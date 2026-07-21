<script setup lang="ts">
/**
 * 工作台 Tab（业务员视角，D-Fix-7 从司机端迁移 + 适配）
 *
 * 数据来源：dispatchList (props from salesperson/index.vue, 已按 salespersonId 过滤)
 * 业务定位：业务员作为「管理者」,能看更多数据(我创建的订单 KPI / 轨迹)
 *
 * 设计要点：
 *  - 4 维统计：总单数 / 进行中 / 待出发 / 已完成（语义对齐 Web 端 DispatchSchedulePage）
 *  - 当前进行中：第一个 active 的订单
 *  - 最近轨迹：mock 演示数据（5 节点）
 *  - 主题色：业务员用 --role-sales（青色）
 */

import { computed } from 'vue'
import type { DispatchMock } from '@/mock/dispatches'
import { ACTIVE_STATUSES, DISPATCH_STATUS_MAP } from '@/constants/dispatchStatus'

const props = defineProps<{
  dispatchList: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'goDetail', item: DispatchMock): void
  (e: 'switchTab', tab: 'orders'): void
}>()

// 4 维统计
const wbStats = computed(() => ({
  total: props.dispatchList.length,
  active: props.dispatchList.filter((d) => ACTIVE_STATUSES.includes(d.status)).length,
  pending: props.dispatchList.filter((d) => ['pending_confirm', 'confirmed', 'draft'].includes(d.status)).length,
  done: props.dispatchList.filter((d) => ['completed', 'cancelled'].includes(d.status)).length,
}))

// 当前进行中（mock：取第一个 active 的订单）
const currentActive = computed(() => {
  return props.dispatchList.find((d) => ACTIVE_STATUSES.includes(d.status))
})

// 最近轨迹（mock 演示数据）
const recentTimeline = computed(() => {
  return [
    { time: '14:30', status: 'loading' as const, label: '正在装货' },
    { time: '13:45', status: 'entering' as const, label: '已入园' },
    { time: '13:30', status: 'dispatched' as const, label: '已派车出发' },
    { time: '13:00', status: 'confirmed' as const, label: '已确认受理' },
    { time: '12:30', status: 'pending' as const, label: '订单待确认' },
  ]
})
</script>

<template>
  <view class="tab-pane">
    <!-- 4 维统计 -->
    <view class="wb-stats">
      <view class="wb-stat" @click="emit('switchTab', 'orders')">
        <text class="wb-stat-num">{{ wbStats.total }}</text>
        <text class="wb-stat-label">总单数</text>
      </view>
      <view class="wb-stat highlight">
        <text class="wb-stat-num">{{ wbStats.active }}</text>
        <text class="wb-stat-label">进行中</text>
      </view>
      <view class="wb-stat">
        <text class="wb-stat-num">{{ wbStats.pending }}</text>
        <text class="wb-stat-label">待出发</text>
      </view>
      <view class="wb-stat success">
        <text class="wb-stat-num">{{ wbStats.done }}</text>
        <text class="wb-stat-label">已完成</text>
      </view>
    </view>

    <!-- 当前进行中卡片 -->
    <view v-if="currentActive" class="wb-current" @click="emit('goDetail', currentActive)">
      <view class="wb-current-header">
        <text class="wb-current-label">当前进行中</text>
        <view :class="['status-tag', 'tag-' + DISPATCH_STATUS_MAP[currentActive.status].cssClass]">
          {{ DISPATCH_STATUS_MAP[currentActive.status].label }}
        </view>
      </view>
      <view class="wb-current-body">
        <text class="wb-current-no">{{ currentActive.dispatchNo }}</text>
        <view class="wb-current-info">
          <view class="info-line">
            <image class="info-line-icon" src="/static/icons/pin.svg" mode="aspectFit" />
            <text>{{ currentActive.yardNames.join('、') }} 园区</text>
          </view>
          <view class="info-line">
            <image class="info-line-icon" src="/static/icons/customer.svg" mode="aspectFit" />
            <text>{{ currentActive.customerName }}</text>
          </view>
          <view class="info-line">
            <image class="info-line-icon" src="/static/icons/clock.svg" mode="aspectFit" />
            <text>预计 {{ currentActive.expectedLoadTime }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 最近轨迹 -->
    <view class="wb-section">
      <view class="wb-section-header">
        <text class="wb-section-title">最近轨迹</text>
      </view>
      <view class="timeline">
        <view v-for="(item, idx) in recentTimeline" :key="idx" class="timeline-item">
          <view class="timeline-dot" :class="item.status"></view>
          <view class="timeline-content">
            <text class="timeline-time">{{ item.time }}</text>
            <text class="timeline-label">{{ item.label }}</text>
          </view>
          <view v-if="idx !== recentTimeline.length - 1" class="timeline-line"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

/* 4 维统计 */
.wb-stats {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  justify-content: space-around;
  box-shadow: var(--shadow-sm);
}
.wb-stat { flex: 1; text-align: center; }
.wb-stat-num {
  display: block;
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: 4rpx;
}
.wb-stat-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
/* D-Fix-7：业务员主题色（青色 sales） */
.wb-stat.highlight .wb-stat-num { color: var(--role-sales); }
.wb-stat.success .wb-stat-num { color: var(--color-status-completed); }

/* 当前进行中 */
.wb-current {
  background: var(--color-card);
  margin: 0 var(--space-md) var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.wb-current-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.wb-current-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.wb-current-no {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}
.wb-current-info .info-line {
  display: flex;
  align-items: center;
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  margin-bottom: 8rpx;
}
.wb-current-info .info-line-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: 8rpx;
  flex-shrink: 0;
}

/* 最近轨迹 */
.wb-section {
  background: var(--color-card);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.wb-section-header {
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-divider);
}
.wb-section-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.timeline { position: relative; }
.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: var(--space-sm);
}
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--role-sales);
  margin-top: 8rpx;
  margin-right: var(--space-sm);
  flex-shrink: 0;
  z-index: 1;
}
.timeline-dot.loading { background: var(--color-status-loading); }
.timeline-dot.entering { background: var(--color-status-entering); }
.timeline-dot.dispatched { background: var(--color-status-pending); }
.timeline-dot.confirmed { background: var(--color-text-placeholder); }
.timeline-dot.pending { background: var(--color-divider); }
.timeline-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.timeline-time {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  font-family: var(--font-family-mono);
}
.timeline-label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.timeline-line {
  position: absolute;
  left: 7rpx;
  top: 24rpx;
  bottom: 0;
  width: 2rpx;
  background: var(--color-divider);
}

/* StatusTag 复用 */
:deep(.status-tag) {
  font-size: var(--font-size-mini);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-medium);
}
</style>