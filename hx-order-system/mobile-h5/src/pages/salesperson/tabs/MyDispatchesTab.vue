<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-2：业务员调车单管理 Tab
 *
 * 内容：我创建的调车单列表 + 状态/方向筛选 + 详情/取消按钮
 *
 * P1-2 升级（业务员调车单管理）：
 *  - 6 状态筛选（全部/待确认/已确认/运输中/已完成/已取消）
 *  - 方向筛选（按 direction 去重）
 *  - 卡片加【详情】按钮（跳 driver/order-detail 复用）
 *  - 取消按钮（仅 draft/pending_confirm/confirmed 可点）
 *
 * 数据：dispatches (props from salesperson/index.vue, 已按 salespersonId 筛选)
 */

import { computed, ref } from 'vue'
import type { DispatchMock, DispatchStatus } from '@/mock/dispatches'
import { DISPATCH_STATUS_MAP } from '@/constants/dispatchStatus'
import EmptyState from '@/components/EmptyState.vue'
import AppButton from '@/components/AppButton.vue'

type StatusFilter = 'all' | 'pending_confirm' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled'

const props = defineProps<{
  dispatches: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'switchTab', tab: 'create' | 'me'): void
  (e: 'viewDetail', item: DispatchMock): void
  (e: 'cancel', item: DispatchMock): void
}>()

// ===== 排序 + 筛选 =====
const sortedDispatches = computed(() => {
  return [...props.dispatches].sort((a, b) => b.id.localeCompare(a.id))
})

const statusFilter = ref<StatusFilter>('all')
const directionFilter = ref<string>('all')

const availableDirections = computed(() => {
  const set = new Set<string>()
  props.dispatches.forEach((d) => set.add(d.direction))
  return Array.from(set).sort()
})

const filteredDispatches = computed(() => {
  let list = sortedDispatches.value
  // 状态筛选
  if (statusFilter.value === 'pending_confirm') {
    list = list.filter((d) => d.status === 'pending_confirm')
  } else if (statusFilter.value === 'confirmed') {
    list = list.filter((d) => d.status === 'confirmed')
  } else if (statusFilter.value === 'in_progress') {
    list = list.filter((d) =>
      ['dispatched', 'queued', 'entering', 'loading', 'leaving', 'in_transit', 'arrived', 'driver_confirmed'].includes(d.status)
    )
  } else if (statusFilter.value === 'completed') {
    list = list.filter((d) => d.status === 'completed')
  } else if (statusFilter.value === 'cancelled') {
    list = list.filter((d) => d.status === 'cancelled')
  }
  // 方向筛选
  if (directionFilter.value !== 'all') {
    list = list.filter((d) => d.direction === directionFilter.value)
  }
  return list
})

// ===== KPI（基于 filtered 后） =====
const kpiTotal = computed(() => filteredDispatches.value.length)
const kpiInProgress = computed(() => filteredDispatches.value.filter((d) =>
  ['pending_confirm', 'confirmed', 'dispatched', 'queued', 'entering', 'loading', 'leaving', 'in_transit', 'arrived', 'driver_confirmed'].includes(d.status)
).length)
const kpiCompleted = computed(() => filteredDispatches.value.filter((d) => d.status === 'completed').length)

// ===== 状态流转节点（5 节点，与 P0-5 之前保持一致） =====
const flowNodes = [
  { key: 'pending_confirm', label: '已创建' },
  { key: 'confirmed', label: '已确认' },
  { key: 'dispatched', label: '已派车' },
  { key: 'entering', label: '司机入场' },
  { key: 'driver_confirmed', label: '已确认完成' },
]

function getFlowIndex(status: DispatchStatus): number {
  const idx = flowNodes.findIndex((n) => n.key === status)
  if (idx >= 0) return idx
  if (['loading', 'leaving', 'in_transit', 'driver_confirmed', 'completed'].includes(status)) {
    return 3 // 已派车之后
  }
  return -1
}

// ===== 取消按钮权限 =====
function canCancel(status: DispatchStatus): boolean {
  // 草稿/待确认/已确认 状态可取消（物流公司接手后不再允许取消）
  return ['draft', 'pending_confirm', 'confirmed'].includes(status)
}

function formatDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}/${d.getDate()}`
}

// ===== 筛选器配置 =====
const statusFilters: { key: StatusFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'pending_confirm', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'in_progress', label: '运输中' },
  { key: 'completed', label: '已完成' },
  { key: 'cancelled', label: '已取消' },
]
</script>

<template>
  <view class="tab-pane">
    <!-- D-Fix-3：新建调车单按钮（架构调整：TabBar 移除「创建」,挪到调车单 Tab 顶部） -->
    <view class="top-actions">
      <AppButton
        variant="primary"
        size="md"
        block
        icon="/static/icons/package.svg"
        @click="emit('switchTab', 'create')"
      >
        新建调车单
      </AppButton>
    </view>

    <!-- ===== 顶部 3 统计 ===== -->
    <view class="stat-row">
      <view class="stat-item">
        <text class="stat-num">{{ kpiTotal }}</text>
        <text class="stat-label">总单数</text>
      </view>
      <view class="stat-item highlight">
        <text class="stat-num">{{ kpiInProgress }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-item success">
        <text class="stat-num">{{ kpiCompleted }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- ===== 状态筛选 ===== -->
    <scroll-view class="status-filter-row" scroll-x>
      <view
        v-for="f in statusFilters"
        :key="f.key"
        class="status-chip"
        :class="{ active: statusFilter === f.key }"
        @click="statusFilter = f.key"
      >
        {{ f.label }}
      </view>
    </scroll-view>

    <!-- ===== 方向筛选 ===== -->
    <view v-if="availableDirections.length > 1" class="direction-row">
      <text class="direction-label">方向:</text>
      <scroll-view class="direction-list" scroll-x>
        <view
          class="direction-chip"
          :class="{ active: directionFilter === 'all' }"
          @click="directionFilter = 'all'"
        >全部</view>
        <view
          v-for="d in availableDirections"
          :key="d"
          class="direction-chip"
          :class="{ active: directionFilter === d }"
          @click="directionFilter = d"
        >{{ d }}</view>
      </scroll-view>
    </view>

    <!-- ===== 空状态 ===== -->
    <view v-if="filteredDispatches.length === 0" class="empty-wrap">
      <EmptyState
        v-if="dispatches.length === 0"
        icon="/static/icons/list.svg"
        title="还没有调车单"
        desc="点 [创建] Tab 开始录入"
      >
        <button class="empty-btn" @click="emit('switchTab', 'create')">立即创建</button>
      </EmptyState>
      <EmptyState
        v-else
        icon="/static/icons/list.svg"
        title="该筛选下没有派车单"
        desc="试试调整状态或方向筛选"
      />
    </view>

    <!-- ===== 调车单列表 ===== -->
    <view v-else class="list">
      <view v-for="d in filteredDispatches" :key="d.id" class="dispatch-card">
        <!-- 头部:订单号 + 当前状态 -->
        <view class="card-head">
          <text class="dispatch-no">{{ d.dispatchNo }}</text>
          <view :class="['status-tag', 'tag-' + DISPATCH_STATUS_MAP[d.status].cssClass]">
            {{ DISPATCH_STATUS_MAP[d.status].label }}
          </view>
        </view>

        <!-- 简明信息 -->
        <view class="info-row">
          <image class="info-icon" src="/static/icons/customer.svg" mode="aspectFit" />
          <text class="info-label">客户</text>
          <text class="info-value">{{ d.customerName }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/yard.svg" mode="aspectFit" />
          <text class="info-label">园区</text>
          <text class="info-value">{{ d.yardNames.join('、') }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/clock.svg" mode="aspectFit" />
          <text class="info-label">装货</text>
          <text class="info-value">{{ formatDate(d.expectedLoadTime) }}</text>
        </view>

        <!-- 状态流转时间线 -->
        <view class="flow">
          <view
            v-for="(node, idx) in flowNodes"
            :key="node.key"
            class="flow-node"
            :class="{
              active: idx === getFlowIndex(d.status),
              done: idx < getFlowIndex(d.status),
            }"
          >
            <view class="flow-dot"></view>
            <text class="flow-label">{{ node.label }}</text>
            <view v-if="idx !== flowNodes.length - 1" class="flow-line"></view>
          </view>
        </view>

        <!-- P1-2：操作按钮（详情 / 取消） -->
        <view class="card-actions">
          <button class="btn-detail" @click="emit('viewDetail', d)">
            <image class="btn-icon" src="/static/icons/list.svg" mode="aspectFit" />
            详情
          </button>
          <button
            v-if="canCancel(d.status)"
            class="btn-cancel"
            @click="emit('cancel', d)"
          >取消</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding-bottom: 40rpx; }

/* ===== D-Fix-3：新建调车单按钮 ===== */
.top-actions {
  padding: var(--space-md) var(--space-md) 0;
}

/* 顶部 3 统计 */
.stat-row {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  justify-content: space-around;
  box-shadow: var(--shadow-sm);
}
.stat-item { flex: 1; text-align: center; }
.stat-num {
  display: block;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: 4rpx;
}
.stat-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.stat-item.highlight .stat-num { color: var(--role-sales); }
.stat-item.success .stat-num { color: var(--color-status-completed); }

/* ===== 状态筛选 ===== */
.status-filter-row {
  white-space: nowrap;
  padding: 0 var(--space-md);
  margin-bottom: var(--space-sm);
}
.status-chip {
  display: inline-block;
  padding: var(--space-xs) var(--space-md);
  margin-right: var(--space-xs);
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  background: var(--color-card);
  border: 1rpx solid var(--color-divider);
  border-radius: var(--radius-pill);
}
.status-chip.active {
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border-color: var(--role-sales);
  font-weight: var(--font-weight-semibold);
}

/* ===== 方向筛选 ===== */
.direction-row {
  display: flex;
  align-items: center;
  padding: 0 var(--space-md);
  margin-bottom: var(--space-md);
  gap: var(--space-sm);
}
.direction-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  flex-shrink: 0;
}
.direction-list {
  white-space: nowrap;
  flex: 1;
}
.direction-chip {
  display: inline-block;
  padding: 4rpx var(--space-sm);
  margin-right: var(--space-xs);
  font-size: var(--font-size-mini);
  color: var(--color-text-regular);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
}
.direction-chip.active {
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-semibold);
}

/* ===== 空状态 ===== */
.empty-wrap {
  padding: 60rpx var(--space-md);
}
.empty-btn {
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  padding: 0 var(--space-xl);
  height: 80rpx;
  line-height: 80rpx;
  margin-top: var(--space-md);
}

/* ===== 调车单卡 ===== */
.list { padding: 0 var(--space-md); }
.dispatch-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.card-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-bg);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);
}
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.info-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--role-sales);
}
.info-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 80rpx;
  margin-left: var(--space-xs);
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}

/* ===== 状态流转 ===== */
.flow {
  display: flex;
  align-items: flex-start;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx dashed var(--color-divider);
}
.flow-node {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}
.flow-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-divider);
  margin-bottom: 4rpx;
}
.flow-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-placeholder);
}
.flow-line {
  position: absolute;
  top: 8rpx;
  left: 50%;
  width: 100%;
  height: 2rpx;
  background: var(--color-divider);
}
.flow-node.done .flow-dot { background: var(--color-status-completed); }
.flow-node.done .flow-label { color: var(--color-text-regular); }
.flow-node.done .flow-line { background: var(--color-status-completed); }
.flow-node.active .flow-dot {
  background: var(--role-sales);
  box-shadow: 0 0 0 6rpx rgba(19, 194, 194, 0.2);
}
.flow-node.active .flow-label {
  color: var(--role-sales);
  font-weight: var(--font-weight-semibold);
}

/* ===== 操作按钮（P1-2） ===== */
.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-detail {
  flex: 1;
  min-height: 72rpx;
  background: var(--color-brand-bg);
  color: var(--role-sales);
  border: 1rpx solid var(--role-sales);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.btn-cancel {
  flex: 1;
  min-height: 72rpx;
  background: var(--color-card);
  color: #ff4d4f;
  border: 1rpx solid #ff4d4f;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-medium);
}
.btn-icon {
  width: 28rpx;
  height: 28rpx;
}

/* StatusTag 样式由 components/StatusTag.vue 提供 */
:deep(.status-tag) {
  font-size: var(--font-size-mini);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-medium);
}
</style>