<script setup lang="ts">
/**
 * 创建调车单 表单（v0.3-MVP 简化版）
 *
 * 设计动机：
 *  - MVP 阶段单页表单够用,业务字段虽然多但都是下拉/输入
 *  - 拆 5 步引导是 v0.4 优化项(目前作为页面分组用 section title 视觉引导)
 *
 * 字段：
 *  ① 客户  - 客户列表(下拉选)
 *  ② 园区  - 园区列表(下拉选)
 *  ③ 货物  - 货物摘要 + 数量
 *  ④ 时间窗口 - 预计装货时间
 *  ⑤ 物流公司 - 按方向筛选(MVP 阶段让业务员手动指定)
 *
 * 提交：
 *  - 加 salespersonId / companyId
 *  - 状态置 pending_confirm
 *  - push 到 MOCK_DISPATCHES
 *  - emit 'created' 触发父组件刷新列表
 */

import { ref, computed } from 'vue'
import { MOCK_DISPATCHES, type DispatchMock, type DispatchStatus } from '@/mock/dispatches'
import { MOCK_YARDS } from '@/constants/yards'
import { MOCK_LOGISTICS_COMPANIES, getCompaniesByDirection } from '@/mock/companies'
import { DEFAULT_SALESPERSON } from '@/mock/salespeople'
import ActionSheetPicker from '@/components/ActionSheetPicker.vue'

const emit = defineEmits<{
  (e: 'created'): void
}>()

// 客户列表(mock 阶段从 MOCK_DISPATCHES 提取去重)
const customerOptions = computed(() => {
  const set = new Map<string, string>()
  MOCK_DISPATCHES.forEach((d) => {
    if (d.customerName) set.set(d.customerName, d.customerAddress || '')
  })
  return Array.from(set.entries()).map(([name, address]) => ({ name, address }))
})

// 园区列表
const yardOptions = MOCK_YARDS.map((y) => ({ id: y.id, name: y.name }))

// 表单状态
const form = ref({
  customerName: '',
  customerAddress: '',
  yardId: '',
  goodsSummary: '',
  goodsQuantity: '',
  expectedLoadTime: '',
  direction: '',
  companyId: '',
})

// 方向列表(从现有 dispatches 提取)
const directionOptions = computed(() => {
  const set = new Set<string>()
  MOCK_DISPATCHES.forEach((d) => d.direction && set.add(d.direction))
  return Array.from(set)
})

// 物流公司列表(按方向筛选)
const companyOptions = computed(() => {
  if (!form.value.direction) return MOCK_LOGISTICS_COMPANIES
  return getCompaniesByDirection(form.value.direction)
})

// 表单是否完整
const isValid = computed(() => {
  return (
    form.value.customerName &&
    form.value.yardId &&
    form.value.goodsSummary &&
    form.value.goodsQuantity &&
    form.value.expectedLoadTime &&
    form.value.direction &&
    form.value.companyId
  )
})

function handleCustomerChange(name: string) {
  form.value.customerName = name
  const c = customerOptions.value.find((c) => c.name === name)
  form.value.customerAddress = c?.address || ''
}

function submit() {
  if (!isValid.value) {
    uni.showToast({ title: '请填写完整', icon: 'none' })
    return
  }

  const yard = MOCK_YARDS.find((y) => y.id === form.value.yardId)
  const co = MOCK_LOGISTICS_COMPANIES.find((c) => c.id === form.value.companyId)

  const newDispatch: DispatchMock = {
    id: `mock-dispatch-sp-${Date.now()}`,
    dispatchNo: `DC${new Date().toISOString().slice(0, 10).replace(/-/g, '')}${String(MOCK_DISPATCHES.length + 1).padStart(3, '0')}`,
    status: 'pending_confirm' as DispatchStatus,
    direction: form.value.direction,
    expectedLoadTime: form.value.expectedLoadTime,
    yardIds: [form.value.yardId],
    yardNames: yard ? [yard.name] : [],
    customerName: form.value.customerName,
    customerAddress: form.value.customerAddress,
    companyName: co?.name || '',
    companyId: form.value.companyId,
    salespersonId: DEFAULT_SALESPERSON.id,
    vehicleNo: '-',
    driverName: '-',
    goodsSummary: `${form.value.goodsSummary} ${form.value.goodsQuantity}`,
  }

  MOCK_DISPATCHES.unshift(newDispatch)
  console.log('[create-dispatch] 新调车单已加入 MOCK_DISPATCHES:', newDispatch.dispatchNo)

  // 重置表单
  form.value = {
    customerName: '',
    customerAddress: '',
    yardId: '',
    goodsSummary: '',
    goodsQuantity: '',
    expectedLoadTime: '',
    direction: '',
    companyId: '',
  }

  emit('created')
}
</script>

<template>
  <view class="tab-pane">
    <view class="form-intro">
      <text class="intro-title">创建调车单</text>
      <text class="intro-desc">填写 5 项关键信息后即可下单,系统会通知物流公司确认和派车</text>
    </view>

    <!-- Step 1 客户 -->
    <view class="section">
      <view class="section-head">
        <view class="section-num">1</view>
        <text class="section-title">选客户</text>
      </view>
      <ActionSheetPicker
        v-model="form.customerName"
        :options="customerOptions.map((c) => ({ label: c.name, value: c.name, sub: c.address }))"
        placeholder="点此选择客户"
        title="选择客户"
        @update:modelValue="handleCustomerChange"
      />
      <view v-if="form.customerAddress" class="address-preview">{{ form.customerAddress }}</view>
    </view>

    <!-- Step 2 园区 -->
    <view class="section">
      <view class="section-head">
        <view class="section-num">2</view>
        <text class="section-title">选装货园区</text>
      </view>
      <ActionSheetPicker
        v-model="form.yardId"
        :options="yardOptions.map((y) => ({ label: y.name, value: y.id }))"
        placeholder="点此选择园区"
        title="选择装货园区"
      />
    </view>

    <!-- Step 3 货物 -->
    <view class="section">
      <view class="section-head">
        <view class="section-num">3</view>
        <text class="section-title">货物信息</text>
      </view>
      <input
        v-model="form.goodsSummary"
        class="input"
        placeholder="如:大型设备配件 / 包装箱"
        placeholder-class="input-placeholder"
      />
      <input
        v-model="form.goodsQuantity"
        class="input"
        placeholder="数量(箱/吨)"
        placeholder-class="input-placeholder"
      />
    </view>

    <!-- Step 4 时间 -->
    <view class="section">
      <view class="section-head">
        <view class="section-num">4</view>
        <text class="section-title">预计装货时间</text>
      </view>
      <input
        v-model="form.expectedLoadTime"
        class="input"
        placeholder="格式:YYYY-MM-DD HH:mm:ss"
        placeholder-class="input-placeholder"
      />
    </view>

    <!-- Step 5 物流公司 -->
    <view class="section">
      <view class="section-head">
        <view class="section-num">5</view>
        <text class="section-title">方向 + 物流公司</text>
      </view>
      <ActionSheetPicker
        v-model="form.direction"
        :options="directionOptions"
        placeholder="先选运输方向"
        title="选择运输方向"
      />
      <view v-if="form.direction" class="company-list">
        <view
          v-for="co in companyOptions"
          :key="co.id"
          class="company-item"
          :class="{ selected: form.companyId === co.id }"
          @click="form.companyId = co.id"
        >
          <view class="company-radio"></view>
          <view class="company-info">
            <text class="company-name">{{ co.name }}</text>
            <text class="company-dirs">承接：{{ co.directions.join('/') }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- P1-2 fix v3：提交按钮作为 form 末尾第 6 个 Section（与现有 5 步同卡片样式）
         - 跟随表单滚动，不再 fixed 浮起（避免遮挡 TabBar 与表单底部内容）
         - 用户填完需滚动到底才能看到，符合「自然滚动」原则 -->
    <view class="section submit-section">
      <button class="btn-submit" :disabled="!isValid" @click="submit">
        {{ isValid ? '提交调车单' : '请填写完整' }}
      </button>
      <text v-if="!isValid" class="submit-hint">请检查上方必填项</text>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding-bottom: var(--space-xl); }

.form-intro {
  padding: var(--space-md);
  background: linear-gradient(135deg, var(--role-sales) 0%, var(--role-sales-light) 100%);
  color: var(--color-text-on-brand);
}
.intro-title {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  margin-bottom: 4rpx;
}
.intro-desc {
  display: block;
  font-size: var(--font-size-caption);
  opacity: 0.9;
}

.section {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
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
  background: var(--role-sales);
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

.address-preview {
  margin-top: var(--space-xs);
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.input {
  display: block;
  width: 100%;
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
  box-sizing: border-box;
  min-height: 72rpx;
}
.input:last-child { margin-bottom: 0; }
.input-placeholder { color: var(--color-text-placeholder); }

.company-list {
  margin-top: var(--space-sm);
}
.company-item {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  margin-bottom: var(--space-xs);
  border: 2rpx solid transparent;
}
.company-item.selected {
  border-color: var(--role-sales);
  background: rgba(19, 194, 194, 0.08);
}
.company-item:last-child { margin-bottom: 0; }
.company-radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid var(--color-divider);
  flex-shrink: 0;
}
.company-item.selected .company-radio {
  border-color: var(--role-sales);
  background: var(--role-sales);
  box-shadow: inset 0 0 0 6rpx var(--color-card);
}
.company-info { flex: 1; }
.company-name {
  display: block;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-weight: var(--font-weight-medium);
  margin-bottom: 2rpx;
}
.company-dirs {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.submit-section {
  /* P1-2 fix v3：作为 form 末尾第 6 个 Section，不设 fixed（跟随滚动） */
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.submit-section .btn-submit {
  width: 100%;
}
.submit-hint {
  display: block;
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--color-text-placeholder);
  margin-top: var(--space-xs);
}
.btn-submit {
  width: 100%;
  height: 96rpx;
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
}
.btn-submit[disabled] {
  opacity: 0.5;
  background: var(--role-sales);
}
</style>