<script setup lang="ts">
/**
 * 派车单 Tab（v0.2.x Plan B 抽出）
 *
 * 内容：3 子 Tab（进行中/待出发/已完成）+ 派车单列表 + 导航前往园区
 * 依赖：dispatchList (props) + uiStore (orderSubTab 持久化)
 *       + ACTIVE_STATUSES / PENDING_STATUSES / DONE_STATUSES 常量
 *
 * v0.2.x 简化：去掉 [确认接单] / [无法前往]，司机被动接单
 *   - 卡上仅保留 [导航前往园区] CTA(emit 'navigate')
 *   - 状态机 dispatched → entering 由 GPS 自动触发
 */

import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import type { DispatchMock } from '@/mock/dispatches'
import {
  ACTIVE_STATUSES,
  PENDING_STATUSES,
  DONE_STATUSES,
  DISPATCH_STATUS_MAP,
} from '@/constants/dispatchStatus'
import { useUiStore } from '@/stores/ui'
import type { OrderSubTab } from '@/types/driver'
import EmptyState from '@/components/EmptyState.vue'
import DispatchCard from '@/components/DispatchCard.vue'

// O7-C：下拉筛选（参考截图「未处理 ▼」风格，3 选项：全部/未处理/紧急）
type QuickFilter = 'all' | 'pending' | 'urgent'

interface QuickFilterOption {
  key: QuickFilter
  label: string
  /** 匹配的 status 集合（任一命中即视为符合） */
  matchStatus: DispatchMock['status'][]
}

const QUICK_FILTER_OPTIONS: QuickFilterOption[] = [
  {
    key: 'all',
    label: '全部',
    matchStatus: [...ACTIVE_STATUSES, ...PENDING_STATUSES, ...DONE_STATUSES] as DispatchMock['status'][],
  },
  {
    key: 'pending',
    label: '未处理',
    // 未处理：待确认/已确认/草稿（还没真正开始的状态）
    matchStatus: ['pending_confirm', 'confirmed', 'draft'],
  },
  {
    key: 'urgent',
    label: '紧急',
    // 紧急：mock 阶段以 driver_confirmed/arrived/queued 近似（用 status 排序显示）
    // 真实阶段应基于 isUrgent 字段；mobile-h5 mock 未引入该字段
    matchStatus: ['queued', 'arrived', 'driver_confirmed'],
  },
]

const props = defineProps<{
  dispatchList: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'goDetail', item: DispatchMock): void
  /** D-Fix-10：司机点 [扫码排队] → 父组件调用 markYardQueuedByScan */
  (e: 'queue', item: DispatchMock): void
}>()

// 子 Tab 状态从 uiStore 读，切走不丢失
const uiStore = useUiStore()
const { orderSubTab } = storeToRefs(uiStore)

// O7-C：下拉筛选状态
const quickFilter = ref<QuickFilter>('all')
const quickFilterOpen = ref(false)
const currentFilterOption = computed(
  () => QUICK_FILTER_OPTIONS.find((o) => o.key === quickFilter.value) || QUICK_FILTER_OPTIONS[0],
)

function toggleQuickFilter() {
  quickFilterOpen.value = !quickFilterOpen.value
}

function selectQuickFilter(key: QuickFilter) {
  quickFilter.value = key
  quickFilterOpen.value = false
}

const activeList = computed(() => props.dispatchList.filter((d) => ACTIVE_STATUSES.includes(d.status)))
const pendingList = computed(() => props.dispatchList.filter((d) => PENDING_STATUSES.includes(d.status)))
const doneList = computed(() => props.dispatchList.filter((d) => DONE_STATUSES.includes(d.status)))

const currentOrderList = computed(() => {
  // 1) 先按子 Tab 过滤（进行中/待出发/已完成）
  let list: DispatchMock[]
  if (orderSubTab.value === 'active') list = activeList.value
  else if (orderSubTab.value === 'pending') list = pendingList.value
  else list = doneList.value
  // 2) 再按下拉筛选过滤（全部/未处理/紧急）
  if (quickFilter.value !== 'all' && currentFilterOption.value) {
    const matchStatus = currentFilterOption.value.matchStatus
    list = list.filter((d) => matchStatus.includes(d.status))
  }
  return list
})

const orderSubTabs = computed(() => [
  { key: 'active' as OrderSubTab, label: '进行中', count: activeList.value.length },
  { key: 'pending' as OrderSubTab, label: '待出发', count: pendingList.value.length },
  { key: 'done' as OrderSubTab, label: '已完成', count: doneList.value.length },
])

const subTabLabelMap: Record<OrderSubTab, string> = {
  active: '进行中',
  pending: '待出发',
  done: '已完成',
}
</script>

<template>
  <view class="tab-pane">
    <!-- 子 Tab -->
    <view class="sub-tabs">
      <view
        v-for="t in orderSubTabs"
        :key="t.key"
        class="sub-tab"
        :class="{ active: orderSubTab === t.key }"
        @click="uiStore.setOrderSubTab(t.key)"
      >
        <text>{{ t.label }}</text>
        <text class="sub-tab-count">{{ t.count }}</text>
      </view>
    </view>

    <!-- O7-C：下拉筛选（参考截图「未处理 ▼」风格） -->
    <view class="quick-filter-bar">
      <view
        class="quick-filter-trigger"
        :class="{ open: quickFilterOpen }"
        @click="toggleQuickFilter"
      >
        <text class="quick-filter-label">{{ currentFilterOption.label }}</text>
        <image
          class="quick-filter-arrow"
          :class="{ open: quickFilterOpen }"
          src="/static/icons/info.svg"
          mode="aspectFit"
        />
      </view>
      <text class="quick-filter-count">{{ currentOrderList.length }} 单</text>
    </view>

    <!-- 下拉菜单 -->
    <view v-if="quickFilterOpen" class="quick-filter-mask" @click="quickFilterOpen = false">
      <view class="quick-filter-dropdown" @click.stop>
        <view
          v-for="opt in QUICK_FILTER_OPTIONS"
          :key="opt.key"
          class="quick-filter-option"
          :class="{ active: quickFilter === opt.key }"
          @click="selectQuickFilter(opt.key)"
        >
          <text class="quick-filter-option-label">{{ opt.label }}</text>
          <view v-if="quickFilter === opt.key" class="quick-filter-option-check"></view>
        </view>
      </view>
    </view>

    <!-- 列表 -->
    <view class="list">
      <EmptyState
        v-if="currentOrderList.length === 0"
        icon="/static/icons/list.svg"
        :title="`暂无${subTabLabelMap[orderSubTab]}的派车单`"
        desc="新派车单会显示在这里"
      />

      <DispatchCard
        v-for="item in currentOrderList"
        :key="item.id"
        :item="item"
        @tap="emit('goDetail', item)"
        @queue="emit('queue', item)"
      />

      <view v-if="currentOrderList.length > 0" class="load-more">
        <text class="load-more-text">{{ currentOrderList.length }} 条 · 已全部加载</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

/* 子 Tab */
.sub-tabs {
  display: flex;
  background: var(--color-card);
  padding: 0 var(--space-md);
  border-bottom: 1rpx solid var(--color-divider);
}
.sub-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-sm) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  position: relative;
}
.sub-tab.active {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
}
.sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: var(--color-brand);
  border-radius: 2rpx;
}
.sub-tab-count {
  margin-left: var(--space-xs);
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 2rpx 12rpx;
  border-radius: var(--radius-pill);
}
.sub-tab.active .sub-tab-count {
  background: var(--color-brand-bg);
  color: var(--color-brand);
}

.list { padding: 20rpx var(--space-md) 0; }

/* ===== O7-C：下拉筛选（参考截图「未处理 ▼」风格） ===== */
.quick-filter-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-card);
  border-bottom: 1rpx solid var(--color-divider);
}
.quick-filter-trigger {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  padding: var(--space-xs) var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-pill);
  font-size: var(--font-size-sub);
  color: var(--color-text-primary);
  transition: background var(--motion-fast) var(--ease-out-quart);
}
.quick-filter-trigger.open {
  background: var(--color-brand-bg);
  color: var(--color-brand);
}
.quick-filter-trigger:active {
  background: var(--color-divider);
}
.quick-filter-label {
  font-weight: var(--font-weight-medium);
}
.quick-filter-arrow {
  width: 24rpx;
  height: 24rpx;
  transition: transform var(--motion-fast) var(--ease-out-quart);
  color: var(--color-text-secondary);
}
.quick-filter-arrow.open {
  transform: rotate(180deg);
}
.quick-filter-count {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}

.quick-filter-mask {
  position: fixed;
  inset: 0;
  z-index: 99;
  background: transparent;
}
.quick-filter-dropdown {
  position: absolute;
  top: 240rpx; /* 估算：header ~ 200rpx + sub-tab 80rpx + filter bar 60rpx */
  left: var(--space-md);
  right: var(--space-md);
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  overflow: hidden;
  z-index: 100;
}
.quick-filter-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  border-bottom: 1rpx solid var(--color-bg);
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  transition: background var(--motion-fast) var(--ease-out-quart);
}
.quick-filter-option:last-child {
  border-bottom: none;
}
.quick-filter-option:active {
  background: var(--color-bg);
}
.quick-filter-option.active {
  color: var(--color-brand);
  background: var(--color-brand-bg);
}
.quick-filter-option-label {
  font-weight: var(--font-weight-medium);
}
.quick-filter-option-check {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-brand);
}

.load-more {
  text-align: center;
  padding: var(--space-md) 0;
}
.load-more-text {
  font-size: var(--font-size-mini);
  color: var(--color-text-placeholder);
}
</style>