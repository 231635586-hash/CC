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

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { DispatchMock } from '@/mock/dispatches'
import {
  ACTIVE_STATUSES,
  PENDING_STATUSES,
  DONE_STATUSES,
} from '@/constants/dispatchStatus'
import { useUiStore } from '@/stores/ui'
import type { OrderSubTab } from '@/types/driver'
import EmptyState from '@/components/EmptyState.vue'
import DispatchCard from '@/components/DispatchCard.vue'

const props = defineProps<{
  dispatchList: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'goDetail', item: DispatchMock): void
  /** 司机点 [导航前往园区] → 父组件调用 openNavi(yard) */
  (e: 'navigate', item: DispatchMock): void
}>()

// 子 Tab 状态从 uiStore 读，切走不丢失
const uiStore = useUiStore()
const { orderSubTab } = storeToRefs(uiStore)

const activeList = computed(() => props.dispatchList.filter((d) => ACTIVE_STATUSES.includes(d.status)))
const pendingList = computed(() => props.dispatchList.filter((d) => PENDING_STATUSES.includes(d.status)))
const doneList = computed(() => props.dispatchList.filter((d) => DONE_STATUSES.includes(d.status)))

const currentOrderList = computed(() => {
  if (orderSubTab.value === 'active') return activeList.value
  if (orderSubTab.value === 'pending') return pendingList.value
  return doneList.value
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
        @navigate="emit('navigate', item)"
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

.load-more {
  text-align: center;
  padding: var(--space-md) 0;
}
.load-more-text {
  font-size: var(--font-size-mini);
  color: var(--color-text-placeholder);
}
</style>