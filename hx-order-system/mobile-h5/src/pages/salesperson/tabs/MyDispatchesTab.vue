<script setup lang="ts">
/**
 * 我的调车单 Tab（v0.3-MVP 业务员）
 *
 * 内容：我创建的调车单列表 + 状态流转时间线
 * 数据：dispatches (props from salesperson/index.vue)
 */

import { computed } from 'vue'
import type { DispatchMock } from '@/mock/dispatches'
import { DISPATCH_STATUS_MAP } from '@/constants/dispatchStatus'

const props = defineProps<{
  dispatches: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'switchTab', tab: 'create' | 'me'): void
}>()

// 按创建时间倒序(mock 阶段按 dispatchNo 倒序近似)
const sortedDispatches = computed(() => {
  return [...props.dispatches].sort((a, b) => b.id.localeCompare(a.id))
})

// 状态流转节点(简化为 5 个关键节点,v0.3.0-M2.2 移除客户签收,改用司机确认)
const flowNodes = [
  { key: 'pending_confirm', label: '已创建' },
  { key: 'confirmed', label: '已确认' },
  { key: 'dispatched', label: '已派车' },
  { key: 'entering', label: '司机入场' },
  { key: 'driver_confirmed', label: '已确认完成' },
]

function getFlowIndex(status: string): number {
  const idx = flowNodes.findIndex((n) => n.key === status)
  if (idx >= 0) return idx
  // 兼容其他状态(loading/leaving/in_transit/driver_confirmed/completed)
  if (['loading', 'leaving', 'in_transit', 'driver_confirmed', 'completed'].includes(status)) {
    return 3 // 已派车之后
  }
  return -1
}

function formatDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}/${d.getDate()}`
}
</script>

<template>
  <view class="tab-pane">
    <!-- 顶部统计 -->
    <view class="stat-row">
      <view class="stat-item">
        <text class="stat-num">{{ sortedDispatches.length }}</text>
        <text class="stat-label">总单数</text>
      </view>
      <view class="stat-item highlight">
        <text class="stat-num">{{ sortedDispatches.filter((d) => ['pending_confirm', 'confirmed', 'dispatched', 'entering', 'loading', 'leaving', 'in_transit'].includes(d.status)).length }}</text>
        <text class="stat-label">进行中</text>
      </view>
      <view class="stat-item success">
        <text class="stat-num">{{ sortedDispatches.filter((d) => d.status === 'completed').length }}</text>
        <text class="stat-label">已完成</text>
      </view>
    </view>

    <!-- 空状态 -->
    <view v-if="sortedDispatches.length === 0" class="empty">
      <image class="empty-icon" src="/static/icons/list.svg" mode="aspectFit" />
      <text class="empty-title">还没有调车单</text>
      <text class="empty-desc">点 [创建] Tab 开始录入</text>
      <button class="empty-btn" @click="emit('switchTab', 'create')">立即创建</button>
    </view>

    <!-- 调车单列表 -->
    <view v-else class="list">
      <view v-for="d in sortedDispatches" :key="d.id" class="dispatch-card">
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
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

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
.stat-item {
  flex: 1;
  text-align: center;
}
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
.stat-item.highlight .stat-num { color: #13c2c2; }
.stat-item.success .stat-num { color: var(--color-status-completed); }

/* 空状态 */
.empty {
  text-align: center;
  padding: 120rpx var(--space-md);
}
.empty-icon {
  width: 120rpx;
  height: 120rpx;
  color: var(--color-text-placeholder);
  margin-bottom: var(--space-md);
}
.empty-title {
  display: block;
  font-size: var(--font-size-card-title);
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.empty-desc {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-lg);
}
.empty-btn {
  background: #13c2c2;
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  padding: 0 var(--space-xl);
  height: 80rpx;
  line-height: 80rpx;
}

/* 调车单卡 */
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
}
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.info-icon {
  width: 32rpx;
  height: 32rpx;
  color: #13c2c2;
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

/* 状态流转 */
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
  background: #13c2c2;
  box-shadow: 0 0 0 6rpx rgba(19, 194, 194, 0.2);
}
.flow-node.active .flow-label {
  color: #13c2c2;
  font-weight: var(--font-weight-semibold);
}

/* StatusTag 样式由 components/StatusTag.vue 提供 */
:deep(.status-tag) {
  font-size: var(--font-size-mini);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-medium);
}
</style>