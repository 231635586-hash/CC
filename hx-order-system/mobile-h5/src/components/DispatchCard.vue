<script setup lang="ts">
/**
 * 派车单卡 — 列表/工作台通用
 *
 * 用法：
 *   <DispatchCard
 *     :item="dispatch"
 *     @tap="goDetail"
 *     @navigate="navigateToYard"
 *   />
 *
 * 业务（v0.2.x 简化）：
 *   - 状态徽章 + 派车单号 + 园区/客户/货物 + 预计时间 + 方向
 *   - 司机无需手动接单/拒单：dispatcher 派车后即默认接单
 *   - 仅在 status === 'dispatched' 时显示 [导航前往园区] 按钮
 *     · dispatched → entering 由 GPS 自动检测触发（M3 真实阶段）
 *     · M2 mock 阶段无真实 GPS，状态停留在 dispatched 直至司机实际进入园区
 */

import StatusTag from './StatusTag.vue'
import type { DispatchMock } from '@/mock/dispatches'

interface Props {
  item: DispatchMock
  /** 显示模式：list = 完整信息 / compact = 工作台紧凑 */
  mode?: 'list' | 'compact'
}
const props = withDefaults(defineProps<Props>(), { mode: 'list' })

const emit = defineEmits<{
  (e: 'tap', item: DispatchMock): void
  /** 司机点击 [导航前往园区] → 调起地图/调用 openNavi(yard) */
  (e: 'navigate', item: DispatchMock): void
}>()

function formatTime(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 86400000
  if (diff < day) {
    return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  if (diff < day * 2) return '昨天'
  if (diff < day * 7) return `${Math.floor(diff / day)}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}
</script>

<template>
  <view class="dispatch-card" @click="emit('tap', item)">
    <view class="card-header">
      <text class="dispatch-no">{{ item.dispatchNo }}</text>
      <StatusTag :status="item.status" />
    </view>

    <view class="card-body">
      <view v-if="mode === 'list'" class="info-row">
        <image class="info-icon" src="/static/icons/yard.svg" mode="aspectFit" />
        <text class="info-label">园区</text>
        <text class="info-value">{{ item.yardNames.join('、') }}</text>
      </view>
      <view class="info-row">
        <image class="info-icon" src="/static/icons/customer.svg" mode="aspectFit" />
        <text class="info-label">客户</text>
        <text class="info-value ellipsis">{{ item.customerName }}</text>
      </view>
      <view v-if="mode === 'list' && item.goodsSummary" class="info-row">
        <image class="info-icon" src="/static/icons/goods.svg" mode="aspectFit" />
        <text class="info-label">货物</text>
        <text class="info-value ellipsis">{{ item.goodsSummary }}</text>
      </view>
    </view>

    <view class="card-footer">
      <view class="footer-left">
        <text class="time-text">{{ formatTime(item.expectedLoadTime) }}</text>
        <text class="direction-text">{{ item.direction }}</text>
      </view>
      <text class="arrow">›</text>
    </view>

    <view v-if="item.status === 'dispatched'" class="card-actions" @click.stop>
      <button class="btn-navigate" @click="emit('navigate', item)">
        <image class="btn-navigate-icon" src="/static/icons/compass.svg" mode="aspectFit" />
        导航前往园区
      </button>
    </view>
  </view>
</template>

<style scoped>
.dispatch-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-bg);
  margin-bottom: var(--space-sm);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}
.card-body { margin-bottom: var(--space-sm); }
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.info-row:last-child { margin-bottom: 0; }
.info-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-brand);
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
  margin-left: var(--space-xs);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-sm);
  border-top: 1rpx dashed var(--color-divider);
}
.footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.time-text {
  font-size: var(--font-size-caption);
  color: var(--color-text-regular);
}
.direction-text {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  font-weight: 500;
}
.arrow {
  font-size: 36rpx;
  color: var(--color-text-placeholder);
  font-weight: var(--font-weight-regular);
}
.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-navigate {
  flex: 1;
  height: 72rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  border: none;
}
.btn-navigate-icon {
  width: 32rpx;
  height: 32rpx;
}
</style>
