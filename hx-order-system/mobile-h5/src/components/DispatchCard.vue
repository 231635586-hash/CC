<script setup lang="ts">
/**
 * 派车单卡 — 列表/工作台通用 (v2.0 · 接入 mobile-design-system skill)
 *
 * 用法：
 *   <DispatchCard
 *     :item="dispatch"
 *     @tap="goDetail"
 *     @navigate="navigateToYard"
 *     @queue="handleScanQueue"
 *   />
 *
 * v2.0 改进：
 *   - 4 处业务元素硬编码 hex → 业务 status token（修复 skill Pre-Flight §5 反例 1）
 *   - 卡片左边框颜色按 status 自动变（pending/loading/completed/cancelled/transit）
 *   - transition 物理反馈（按压 scale + shadow 加深）
 *   - role="article" 语义化
 *   - reduced-motion 降级
 *
 * 业务（v0.3.0-M2.2 v2 状态机）：
 *   - 状态徽章 + 派车单号 + 园区/客户/货物 + 预计时间 + 方向
 *   - 司机无需手动接单/拒单：dispatcher 派车后即默认接单
 *   - status='dispatched' 时显示 [导航前往园区] + [扫码排队] 两个按钮
 *   - queued 状态：等待库房员开闸
 */

import { computed } from 'vue'
import StatusTag from './StatusTag.vue'
import { DISPATCH_STATUS_MAP } from '@/constants/dispatchStatus'
import type { DispatchMock } from '@/mock/dispatches'

interface Props {
  item: DispatchMock
  /** 显示模式：list = 完整信息 / compact = 工作台紧凑 */
  mode?: 'list' | 'compact'
}
const props = withDefaults(defineProps<Props>(), { mode: 'list' })

const emit = defineEmits<{
  (e: 'tap', item: DispatchMock): void
  /** D-Fix-10：司机点 [扫码排队] → 触发 markYardQueuedByScan */
  (e: 'queue', item: DispatchMock): void
}>()

/** 当前订单对应业务 cssClass（pending / entering / loading / leaving / transit / completed / cancelled） */
const cssClass = computed(() => DISPATCH_STATUS_MAP[props.item.status].cssClass)
const edgeClass = computed(() => `edge-${cssClass.value}`)

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
  <view
    :class="['dispatch-card', edgeClass]"
    @click="emit('tap', item)"
    role="article"
  >
    <!-- 头部：单号 + 状态 -->
    <view class="card-header">
      <text class="dispatch-no">{{ item.dispatchNo }}</text>
      <StatusTag :status="item.status" size="sm" />
    </view>

    <!-- 主体：3 类信息 -->
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

    <!-- 底部：时间 + 方向 + chevron -->
    <view class="card-footer">
      <view class="footer-left">
        <text class="time-text">{{ formatTime(item.expectedLoadTime) }}</text>
        <text class="direction-text">{{ item.direction }}</text>
      </view>
      <view class="arrow-icon" aria-hidden="true">›</view>
    </view>

    <!-- D-Fix-10：司机端不需要导航按钮，只保留【扫码排队】 -->
    <view v-if="item.status === 'dispatched'" class="card-actions card-actions-single" @click.stop>
      <button class="btn-scan btn-scan-full" @click="emit('queue', item)">
        <text class="btn-scan-emoji" aria-hidden="true">📱</text>
        扫码排队
      </button>
    </view>

    <!-- 排队中：提示横幅 -->
    <view v-else-if="item.status === 'queued'" class="card-actions card-actions-queued" @click.stop>
      <text class="queued-tip">🚧 排队中 · 等待库房员开闸</text>
    </view>

    <!-- v0.3.0-M2.2 + P0-3：arrived 引导横幅（GPS 已到货，待司机手动拍照确认完单） -->
    <view v-else-if="item.status === 'arrived'" class="card-actions card-actions-arrived" @click.stop>
      <text class="arrived-tip">📍 已到达客户 · 待拍照确认到货</text>
    </view>
  </view>
</template>

<style scoped>
/* ============ Base ============ */
.dispatch-card {
  position: relative;
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  padding-left: calc(var(--space-md) + 12rpx);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
  overflow: hidden;
  transition:
    transform var(--motion-fast) var(--ease-out-quart),
    box-shadow var(--motion-fast) var(--ease-out-quart);
}
.dispatch-card:active {
  transform: scale(0.985);
  box-shadow: var(--shadow-md);
}

/* ============ v2.0 业务状态左边框色（按 status 自动） ============ */
/* Pre-Flight §5 一致性原则：所有视觉属性都走业务 token，无硬编码 */
.dispatch-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: var(--space-sm);
  bottom: var(--space-sm);
  width: 8rpx;
  border-radius: var(--radius-sm);
  background: var(--color-divider);
}
.edge-pending::before   { background: var(--color-status-pending-text); }
.edge-entering::before  { background: var(--color-status-entering-text); }
.edge-loading::before   { background: var(--color-status-loading-text); }
.edge-leaving::before   { background: var(--color-status-leaving-text); }
.edge-transit::before   { background: var(--color-status-entering-text); }
.edge-completed::before { background: var(--color-status-completed-text); }
.edge-cancelled::before { background: var(--color-status-cancelled-text); }

/* ============ Header ============ */
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-divider);
  margin-bottom: var(--space-sm);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: var(--fw-semibold);
  color: var(--color-text-primary);
  font-family: var(--font-family-mono);     /* 等宽，数字防抖 */
}

/* ============ Body ============ */
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
  flex-shrink: 0;
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
  min-width: 0;     /* 让 ellipsis 生效 */
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ============ Footer ============ */
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
  font-family: var(--font-family-mono);     /* 等宽，数字防抖 */
}
.direction-text {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  font-weight: var(--fw-medium);
}
.arrow-icon {
  font-size: 36rpx;
  color: var(--color-text-placeholder);
  font-weight: var(--fw-regular);
  line-height: 1;
}

/* ============ Actions ============ */
.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-scan {
  flex: 1;
  min-height: 72rpx;            /* Pre-Flight 第 12 项：触摸目标 ≥44dp */
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: var(--fw-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  border: none;
}
/* v2.0 关键修复：原硬编码 #fa8c16 → 业务 warn token */
.btn-scan {
  background: var(--color-warn);
  color: white;
}
/* D-Fix-10：单按钮时占满宽度（删除【导航】按钮后,只剩扫码排队） */
.btn-scan-full {
  flex: 1 1 100%;
}
.btn-scan-emoji {
  font-size: 32rpx;
  margin-right: 4rpx;
}

/* ============ Queued tip（v2.0 关键修复：3 处硬编码 hex → token） ============ */
.card-actions-queued {
  justify-content: center;
  background: var(--color-warn-bg);
  border: 1rpx solid var(--color-warn);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
}
.queued-tip {
  font-size: var(--font-size-sub);
  color: var(--color-warn-text);
  font-weight: var(--fw-medium);
}

/* ============ v0.3.0-M2.2 + P0-3：arrived 引导横幅（GPS 已到货） ============ */
.card-actions-arrived {
  justify-content: center;
  background: var(--color-status-entering-bg);
  border: 1rpx solid var(--color-status-entering-text);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
}
.arrived-tip {
  font-size: var(--font-size-sub);
  color: var(--color-status-entering-text);
  font-weight: var(--fw-medium);
}

/* ============ Reduced-motion 降级（Pre-Flight 第 5 项强制） ============ */
@media (prefers-reduced-motion: reduce) {
  .dispatch-card,
  .dispatch-card:active {
    transform: none;
    box-shadow: var(--shadow-sm);
    transition: none;
  }
}
</style>
