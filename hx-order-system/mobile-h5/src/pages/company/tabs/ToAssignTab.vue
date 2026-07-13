<script setup lang="ts">
/**
 * 待派车 Tab（v0.3-MVP 物流公司）
 *
 * 内容：本公司的 confirmed 调车单列表 + 触发派车 modal
 * 数据：dispatches (props from company/index.vue,已按 companyId 筛选)
 */

import { computed, ref } from 'vue'
import type { DispatchMock } from '@/mock/dispatches'

const props = defineProps<{
  dispatches: DispatchMock[]
}>()

const emit = defineEmits<{
  (e: 'assign', item: DispatchMock): void
}>()

const list = computed(() => props.dispatches.filter((d) => d.status === 'confirmed'))

function formatDate(iso?: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  if (isNaN(d.getTime())) return '-'
  return `${d.getMonth() + 1}/${d.getDate()} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
}
</script>

<template>
  <view class="tab-pane">
    <!-- 顶部提示 -->
    <view v-if="list.length > 0" class="hint-bar">
      <text class="hint-text">共 {{ list.length }} 单待派车,选择车辆和司机完成派车</text>
    </view>

    <!-- 空状态 -->
    <view v-if="list.length === 0" class="empty">
      <image class="empty-icon" src="/static/icons/truck.svg" mode="aspectFit" />
      <text class="empty-title">暂无待派车的调车单</text>
      <text class="empty-desc">已确认的调车单会出现在这里</text>
    </view>

    <!-- 列表 -->
    <view v-else class="list">
      <view v-for="d in list" :key="d.id" class="dispatch-card">
        <!-- 头部 -->
        <view class="card-head">
          <text class="dispatch-no">{{ d.dispatchNo }}</text>
          <view class="status-tag tag-confirmed">已确认</view>
        </view>
        <view class="meta-row">
          <text class="meta-label">方向</text>
          <text class="meta-value">{{ d.direction }}</text>
          <text class="meta-divider">·</text>
          <text class="meta-label">期望装货</text>
          <text class="meta-value">{{ formatDate(d.expectedLoadTime) }}</text>
        </view>

        <!-- 客户 + 园区 -->
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
        <view v-if="d.goodsSummary" class="info-row">
          <image class="info-icon" src="/static/icons/goods.svg" mode="aspectFit" />
          <text class="info-label">货物</text>
          <text class="info-value ellipsis">{{ d.goodsSummary }}</text>
        </view>

        <!-- 操作 -->
        <view class="card-actions">
          <button class="btn-assign" @click="emit('assign', d)">
            <image class="btn-icon" src="/static/icons/truck.svg" mode="aspectFit" />
            派车（选车辆+司机）
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

.hint-bar {
  background: rgba(250, 140, 22, 0.08);
  margin: var(--space-md);
  padding: var(--space-sm) var(--space-md);
  border-radius: var(--radius-md);
  border-left: 4rpx solid #fa8c16;
}
.hint-text {
  font-size: var(--font-size-caption);
  color: #fa8c16;
}

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
}

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
.status-tag {
  font-size: var(--font-size-mini);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-pill);
  font-weight: var(--font-weight-medium);
}
.tag-confirmed {
  background: rgba(99, 102, 241, 0.1);
  color: var(--color-info-text);
}

.meta-row {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx dashed var(--color-divider);
  font-size: var(--font-size-sub);
}
.meta-label { color: var(--color-text-secondary); margin-right: 4rpx; }
.meta-value {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  font-family: var(--font-family-mono);
}
.meta-divider { color: var(--color-divider); margin: 0 var(--space-xs); }

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.info-icon {
  width: 32rpx;
  height: 32rpx;
  color: #fa8c16;
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
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card-actions {
  display: flex;
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-assign {
  flex: 1;
  height: 80rpx;
  background: #fa8c16;
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
}
.btn-icon {
  width: 32rpx;
  height: 32rpx;
}
</style>