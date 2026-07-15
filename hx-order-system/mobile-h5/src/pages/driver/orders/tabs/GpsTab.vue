<script setup lang="ts">
/**
 * GPS Tab（v0.2.x Plan B 抽出）
 *
 * 内容：2 子 Tab（入园/离厂）+ 状态大卡 + 实时定位 + 距离判定 + 操作
 * 依赖：position/detectedYard/nearestYard (props) + uiStore (gpsSubTab)
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'
import type { Yard } from '@/types/driver'

const props = defineProps<{
  position: { lng: number; lat: number; accuracyM: number } | null
  detectedYard: Yard | null
  nearestYard: { yard: Yard; distanceM: number } | null
}>()

const emit = defineEmits<{
  (e: 'refreshGps'): void
  (e: 'openNavi', yard: Yard): void
}>()

const uiStore = useUiStore()
const { gpsSubTab } = storeToRefs(uiStore)

const formatDistance = (m: number): string => {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

const isInYard = computed(() => gpsSubTab.value === 'in' ? !!props.detectedYard : !props.detectedYard)

const statusIcon = computed(() => {
  if (gpsSubTab.value === 'in') {
    return props.detectedYard ? '/static/icons/checked.svg' : '/static/icons/clock.svg'
  }
  return props.detectedYard ? '/static/icons/clock.svg' : '/static/icons/checked.svg'
})

const statusTitle = computed(() => {
  if (gpsSubTab.value === 'in') {
    return props.detectedYard ? `已进入 ${props.detectedYard.name} 园区` : '等待入园'
  }
  return props.detectedYard ? `仍在 ${props.detectedYard.name} 园区` : '已离开园区'
})

const statusDesc = computed(() => {
  return gpsSubTab.value === 'in'
    ? '当车辆 GPS 进入园区半径（300m）时自动打卡'
    : '当车辆 GPS 离开园区半径（300m）时自动打卡'
})

function setSubTab(t: 'in' | 'out') {
  uiStore.setGpsSubTab(t)
  emit('refreshGps')
}
</script>

<template>
  <view class="tab-pane">
    <!-- 子 Tab -->
    <view class="gps-sub-tabs">
      <view
        v-for="t in [
          { key: 'in' as const, label: 'GPS 入园' },
          { key: 'out' as const, label: 'GPS 离厂' },
        ]"
        :key="t.key"
        class="gps-sub-tab"
        :class="{ active: gpsSubTab === t.key }"
        @click="setSubTab(t.key)"
      >
        {{ t.label }}
      </view>
    </view>

    <!-- 状态大卡 -->
    <view class="gps-status-card" :class="{ success: isInYard }">
      <view class="gps-status-icon">
        <image :src="statusIcon" mode="aspectFit" class="gps-status-svg" />
      </view>
      <view class="gps-status-title">{{ statusTitle }}</view>
      <view class="gps-status-desc">{{ statusDesc }}</view>
    </view>

    <!-- 实时定位 -->
    <view class="gps-card">
      <view class="gps-card-header">
        <text class="gps-card-title">实时定位</text>
        <text class="gps-card-action" @click="emit('refreshGps')">刷新</text>
      </view>
      <view v-if="position" class="gps-pos-grid">
        <view class="gps-pos-item">
          <text class="gps-pos-label">经度</text>
          <text class="gps-pos-value">{{ position.lng.toFixed(6) }}</text>
        </view>
        <view class="gps-pos-item">
          <text class="gps-pos-label">纬度</text>
          <text class="gps-pos-value">{{ position.lat.toFixed(6) }}</text>
        </view>
        <view class="gps-pos-item">
          <text class="gps-pos-label">精度</text>
          <text class="gps-pos-value">{{ position.accuracyM }} m</text>
        </view>
      </view>
      <view v-else class="gps-loading">定位中...</view>
    </view>

    <!-- 距离 -->
    <view v-if="nearestYard && !detectedYard && gpsSubTab === 'in'" class="gps-card">
      <view class="gps-distance-row">
        <text class="gps-distance-label">距 {{ nearestYard.yard.name }} 园区</text>
        <text class="gps-distance-value">{{ formatDistance(nearestYard.distanceM) }}</text>
      </view>
      <view class="gps-distance-bar">
        <view
          class="gps-distance-fill"
          :style="{ width: Math.max(5, 100 - (nearestYard.distanceM / 1000) * 100) + '%' }"
        ></view>
      </view>
      <text class="gps-distance-tip">距离 ≤ 300m 时自动入园</text>
    </view>

    <view class="gps-tip">
      <image class="gps-tip-icon" src="/static/icons/tip.svg" mode="aspectFit" />
      <text>车辆硬件 GPS 自动判定，无需任何操作</text>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

.gps-sub-tabs {
  display: flex;
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xs);
}
.gps-sub-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-sm);
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  border-radius: var(--radius-md);
}
.gps-sub-tab.active {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  font-weight: var(--font-weight-semibold);
}

.gps-status-card {
  background: var(--color-status-pending-bg);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  border: 1rpx solid var(--color-status-pending-text);
}
.gps-status-card.success {
  background: var(--color-status-completed-bg);
  border-color: var(--color-status-completed-text);
}
.gps-status-icon {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-sm);
}
.gps-status-svg {
  width: 80rpx;
  height: 80rpx;
}
.gps-status-title {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-status-pending-text);
  margin-bottom: var(--space-sm);
}
.gps-status-card .gps-status-icon {
  color: var(--color-status-pending);
}
.gps-status-card.success .gps-status-icon {
  color: var(--color-status-completed);
}
.gps-status-card.success .gps-status-title {
  color: var(--color-status-completed-text);
}
.gps-status-desc {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-status-pending-text);
  line-height: var(--line-height-base);
}
.gps-status-card.success .gps-status-desc {
  color: var(--color-status-completed-text);
}

.gps-card {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.gps-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.gps-card-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.gps-card-action {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: 4rpx 16rpx;
  border-radius: var(--radius-pill);
}

.gps-pos-grid { display: flex; gap: var(--space-sm); }
.gps-pos-item {
  flex: 1;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  text-align: center;
}
.gps-pos-label {
  display: block;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}
.gps-pos-value {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
  font-family: var(--font-family-mono);
}
.gps-loading {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
}

.gps-distance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.gps-distance-label {
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
}
.gps-distance-value {
  font-size: var(--font-size-display);
  font-weight: var(--font-weight-bold);
  color: var(--color-brand);
  font-family: var(--font-family-mono);
}
.gps-distance-bar {
  height: 12rpx;
  background: var(--color-divider);
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: var(--space-sm);
}
.gps-distance-fill {
  height: 100%;
  background: var(--gradient-brand);
  border-radius: 6rpx;
  transition: width 0.5s ease;
}
.gps-distance-tip {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.gps-tip {
  background: #f0f7ff;
  border: 1rpx solid #d6e8ff;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin: var(--space-md);
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  overflow: hidden;
}
.gps-tip-icon {
  width: 28rpx;
  height: 28rpx;
  color: var(--color-brand);
}
</style>