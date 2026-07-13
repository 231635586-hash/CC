<script setup lang="ts">
/**
 * 派车 Modal（v0.3-MVP 物流公司）
 *
 * 流程：
 *  1. 选择车辆（按 companyId 筛 mock 数据）
 *  2. 选择司机（按 companyId 筛）
 *  3. 确认派车 → 更新 dispatch:
 *     - status = 'dispatched'
 *     - vehicleNo = 选中车牌
 *     - driverName = 选中司机
 *     - 后续 M2+ 可加 vehicleId / driverId 字段
 *
 * UI：用 uni-app 自带模态（uni.showModal 风格不够灵活）
 *     改用自定义全屏 modal 覆盖在当前 page 上
 */

import { ref, computed } from 'vue'
import type { DispatchMock } from '@/mock/dispatches'
import { getVehiclesByCompany } from '@/mock/vehicles'
import { getDriversByCompany } from '@/mock/drivers'

const props = defineProps<{
  dispatch: DispatchMock
  companyId: string
}>()

const emit = defineEmits<{
  (e: 'close'): void
  (e: 'assigned'): void
}>()

const selectedVehicleId = ref<string>('')
const selectedDriverId = ref<string>('')

const vehicles = computed(() => getVehiclesByCompany(props.companyId))
const drivers = computed(() => getDriversByCompany(props.companyId))

function confirm() {
  if (!selectedVehicleId.value) {
    uni.showToast({ title: '请选择车辆', icon: 'none' })
    return
  }
  if (!selectedDriverId.value) {
    uni.showToast({ title: '请选择司机', icon: 'none' })
    return
  }

  const v = vehicles.value.find((x) => x.id === selectedVehicleId.value)
  const d = drivers.value.find((x) => x.id === selectedDriverId.value)

  if (!v || !d) {
    uni.showToast({ title: '数据异常', icon: 'none' })
    return
  }

  // 更新 dispatch
  props.dispatch.status = 'dispatched'
  props.dispatch.vehicleNo = v.plateNo
  props.dispatch.driverName = d.name

  uni.showToast({ title: '派车成功', icon: 'success' })
  emit('assigned')
}
</script>

<template>
  <view class="modal-mask" @click.self="emit('close')">
    <view class="modal-content">
      <!-- 头部 -->
      <view class="modal-head">
        <text class="modal-title">派车</text>
        <button class="modal-close" @click="emit('close')">×</button>
      </view>

      <!-- 订单概览 -->
      <view class="order-summary">
        <text class="summary-no">{{ dispatch.dispatchNo }}</text>
        <text class="summary-info">{{ dispatch.direction }} · {{ dispatch.yardNames.join('、') }} · {{ dispatch.customerName }}</text>
      </view>

      <!-- 选择车辆 -->
      <view class="section">
        <view class="section-head">
          <view class="section-num">1</view>
          <text class="section-title">选择车辆</text>
        </view>
        <view class="option-list">
          <view
            v-for="v in vehicles"
            :key="v.id"
            class="option-item"
            :class="{ selected: selectedVehicleId === v.id }"
            @click="selectedVehicleId = v.id"
          >
            <view class="option-radio"></view>
            <view class="option-info">
              <text class="option-main">{{ v.plateNo }}</text>
              <text class="option-sub">{{ v.type }} · {{ v.capacityTon }}吨</text>
            </view>
          </view>
          <view v-if="vehicles.length === 0" class="empty-text">该公司暂无车辆</view>
        </view>
      </view>

      <!-- 选择司机 -->
      <view class="section">
        <view class="section-head">
          <view class="section-num">2</view>
          <text class="section-title">选择司机</text>
        </view>
        <view class="option-list">
          <view
            v-for="d in drivers"
            :key="d.id"
            class="option-item"
            :class="{ selected: selectedDriverId === d.id }"
            @click="selectedDriverId = d.id"
          >
            <view class="option-radio"></view>
            <view class="option-info">
              <text class="option-main">{{ d.name }}</text>
              <text class="option-sub">{{ d.phone }}</text>
            </view>
          </view>
          <view v-if="drivers.length === 0" class="empty-text">该公司暂无司机</view>
        </view>
      </view>

      <!-- 提交按钮 -->
      <view class="submit-bar">
        <button class="btn-confirm" @click="confirm">确认派车</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9999;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  overscroll-behavior: contain;
}

.modal-content {
  width: 100%;
  max-width: 750rpx;
  max-height: 85vh;
  max-height: 85dvh;
  background: var(--color-bg);
  border-radius: 24rpx 24rpx 0 0;
  overflow-y: auto;
  padding: var(--space-md);
  box-sizing: border-box;
  -webkit-overflow-scrolling: touch;
  -webkit-user-select: none;
  user-select: none;
}

.modal-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-md);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-divider);
}
.modal-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
}
.modal-close {
  width: 60rpx;
  height: 60rpx;
  background: transparent;
  border: none;
  font-size: 48rpx;
  color: var(--color-text-placeholder);
  line-height: 1;
  padding: 0;
}

.order-summary {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  border-left: 6rpx solid #fa8c16;
}
.summary-no {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
  margin-bottom: 4rpx;
}
.summary-info {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.section {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.section-head {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.section-num {
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: #fa8c16;
  color: var(--color-text-on-brand);
  font-size: var(--font-size-sub);
  font-weight: var(--font-weight-semibold);
  display: flex;
  align-items: center;
  justify-content: center;
}
.section-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.option-list { display: flex; flex-direction: column; }
.option-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  border-radius: var(--radius-md);
  margin-bottom: 8rpx;
  border: 2rpx solid transparent;
  transition: border-color 0.15s ease;
}
.option-item.selected {
  border-color: #fa8c16;
  background: rgba(250, 140, 22, 0.06);
}
.option-item:last-child { margin-bottom: 0; }
.option-radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid var(--color-divider);
  flex-shrink: 0;
  position: relative;
}
.option-item.selected .option-radio {
  border-color: #fa8c16;
}
.option-item.selected .option-radio::after {
  content: '';
  position: absolute;
  inset: 6rpx;
  background: #fa8c16;
  border-radius: 50%;
}
.option-info { flex: 1; min-width: 0; }
.option-main {
  display: block;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 2rpx;
}
.option-sub {
  display: block;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.empty-text {
  text-align: center;
  padding: var(--space-md);
  color: var(--color-text-placeholder);
  font-size: var(--font-size-caption);
}

.submit-bar {
  padding: var(--space-md) 0;
}
.btn-confirm {
  width: 100%;
  height: 96rpx;
  background: #fa8c16;
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
}
</style>