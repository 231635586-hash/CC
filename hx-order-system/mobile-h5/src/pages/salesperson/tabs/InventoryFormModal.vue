<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-3：新建商品表单 Modal（业务员手动添加库存）
 *
 * 字段（P1-3 简化版，6 个核心字段）：
 *  - 物料编码（必填，唯一）
 *  - 物料名称（必填）
 *  - 客户名称（必填）
 *  - 数量（必填，数字 > 0）
 *  - 单位（必填，如 箱/吨/件）
 *  - 库存类型（现货/等货，默认现货）
 *  - 备注（选填）
 *
 * 与 Web 端 InventoryFormDrawer 16 列必填的差异：
 *  - mobile-h5 简化到 7 字段（必填 5 + 选填 2）
 *  - 后续 F2 阶段如需完整字段再扩展
 */

import { ref } from 'vue'
import type { Inventory } from '@/types/shared/inventory'
import { DEFAULT_SALESPERSON } from '@/mock/salespeople'

const emit = defineEmits<{
  (e: 'created', item: Inventory): void
  (e: 'close'): void
}>()

interface FormState {
  materialCode: string
  materialName: string
  customerName: string
  quantity: string
  unit: string
  stockType: 'in_stock_now' | 'waiting'
  remark: string
}

const form = ref<FormState>({
  materialCode: '',
  materialName: '',
  customerName: '',
  quantity: '',
  unit: '箱',
  stockType: 'in_stock_now',
  remark: '',
})

const errors = ref<Record<string, string>>({})

function validate(): boolean {
  const e: Record<string, string> = {}
  if (!form.value.materialCode.trim()) e.materialCode = '请输入物料编码'
  if (!form.value.materialName.trim()) e.materialName = '请输入物料名称'
  if (!form.value.customerName.trim()) e.customerName = '请输入客户名称'
  const qty = Number(form.value.quantity)
  if (!form.value.quantity || !Number.isFinite(qty) || qty <= 0) {
    e.quantity = '请输入大于 0 的数量'
  }
  if (!form.value.unit.trim()) e.unit = '请输入单位'
  errors.value = e
  return Object.keys(e).length === 0
}

function resetForm() {
  form.value = {
    materialCode: '',
    materialName: '',
    customerName: '',
    quantity: '',
    unit: '箱',
    stockType: 'in_stock_now',
    remark: '',
  }
  errors.value = {}
}

function handleSubmit() {
  if (!validate()) {
    uni.showToast({ title: '请检查必填项', icon: 'none' })
    return
  }

  const now = new Date().toISOString()
  const seq = Date.now().toString().slice(-6)
  const newItem: Inventory = {
    id: `mock-inv-${seq}`,
    materialCode: form.value.materialCode.trim(),
    materialName: form.value.materialName.trim(),
    customerName: form.value.customerName.trim(),
    quantity: Number(form.value.quantity),
    unit: form.value.unit.trim(),
    stockType: form.value.stockType,
    status: 'in_stock',
    barcode: `BC${seq}`,
    importDate: now.slice(0, 10),
    salesPersonId: DEFAULT_SALESPERSON.id,
    remark: form.value.remark.trim() || undefined,
  }

  emit('created', newItem)
  resetForm()
  uni.showToast({ title: '商品已添加', icon: 'success' })
}
</script>

<template>
  <view class="modal-mask" @click.self="emit('close')">
    <view class="modal">
      <view class="modal-header">
        <text class="modal-title">新建商品</text>
        <text class="modal-close" @click="emit('close')">×</text>
      </view>

      <scroll-view class="modal-body" scroll-y>
        <!-- 物料编码 -->
        <view class="form-row">
          <text class="form-label required">物料编码</text>
          <input
            v-model="form.materialCode"
            class="form-input"
            placeholder="例如：MAT-006"
            placeholder-class="form-placeholder"
            :class="{ 'has-error': errors.materialCode }"
          />
          <text v-if="errors.materialCode" class="form-error">{{ errors.materialCode }}</text>
        </view>

        <!-- 物料名称 -->
        <view class="form-row">
          <text class="form-label required">物料名称</text>
          <input
            v-model="form.materialName"
            class="form-input"
            placeholder="例如：大型设备配件"
            placeholder-class="form-placeholder"
            :class="{ 'has-error': errors.materialName }"
          />
          <text v-if="errors.materialName" class="form-error">{{ errors.materialName }}</text>
        </view>

        <!-- 客户名称 -->
        <view class="form-row">
          <text class="form-label required">客户名称</text>
          <input
            v-model="form.customerName"
            class="form-input"
            placeholder="例如：杭州智能装备"
            placeholder-class="form-placeholder"
            :class="{ 'has-error': errors.customerName }"
          />
          <text v-if="errors.customerName" class="form-error">{{ errors.customerName }}</text>
        </view>

        <!-- 数量 + 单位（横排） -->
        <view class="form-row-inline">
          <view class="form-col">
            <text class="form-label required">数量</text>
            <input
              v-model="form.quantity"
              class="form-input"
              type="number"
              placeholder="80"
              placeholder-class="form-placeholder"
              :class="{ 'has-error': errors.quantity }"
            />
            <text v-if="errors.quantity" class="form-error">{{ errors.quantity }}</text>
          </view>
          <view class="form-col" style="margin-left: var(--space-md);">
            <text class="form-label required">单位</text>
            <input
              v-model="form.unit"
              class="form-input"
              placeholder="箱/吨/件"
              placeholder-class="form-placeholder"
              :class="{ 'has-error': errors.unit }"
            />
            <text v-if="errors.unit" class="form-error">{{ errors.unit }}</text>
          </view>
        </view>

        <!-- 库存类型 -->
        <view class="form-row">
          <text class="form-label">库存类型</text>
          <view class="stock-type-group">
            <view
              v-for="opt in [
                { value: 'in_stock_now', label: '现货' },
                { value: 'waiting', label: '等货' },
              ]"
              :key="opt.value"
              class="stock-type-chip"
              :class="{ active: form.stockType === opt.value }"
              @click="form.stockType = opt.value as 'in_stock_now' | 'waiting'"
            >{{ opt.label }}</view>
          </view>
        </view>

        <!-- 备注 -->
        <view class="form-row">
          <text class="form-label">备注（选填）</text>
          <textarea
            v-model="form.remark"
            class="form-textarea"
            placeholder="如：已入库可发货"
            placeholder-class="form-placeholder"
          />
        </view>
      </scroll-view>

      <!-- 底部按钮（浮在 scroll 视图上方） -->
      <view class="modal-footer">
        <button class="btn-cancel" @click="emit('close')">取消</button>
        <button class="btn-submit" @click="handleSubmit">确认添加</button>
      </view>
    </view>
  </view>
</template>

<style scoped>
/* ===== Modal 蒙层 ===== */
.modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-md);
}

/* ===== Modal 内容 ===== */
.modal {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  width: 100%;
  max-width: 680rpx;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md) var(--space-lg);
  border-bottom: 1rpx solid var(--color-divider);
}
.modal-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.modal-close {
  font-size: 48rpx;
  color: var(--color-text-placeholder);
  line-height: 1;
  padding: 0 var(--space-sm);
}
.modal-body {
  flex: 1;
  padding: var(--space-md) var(--space-lg);
  max-height: 60vh;
}

.modal-footer {
  display: flex;
  gap: var(--space-md);
  padding: var(--space-md) var(--space-lg);
  border-top: 1rpx solid var(--color-divider);
  background: var(--color-card);
}
.btn-cancel {
  flex: 1;
  height: 80rpx;
  background: var(--color-card);
  color: var(--color-text-regular);
  border: 1rpx solid var(--color-divider);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
}
.btn-submit {
  flex: 2;
  height: 80rpx;
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
}

/* ===== 表单 ===== */
.form-row {
  margin-bottom: var(--space-md);
}
.form-row-inline {
  display: flex;
  gap: 0;
  margin-bottom: var(--space-md);
}
.form-col {
  flex: 1;
}
.form-label {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  margin-bottom: var(--space-xs);
  font-weight: var(--font-weight-medium);
}
.form-label.required::before {
  content: '*';
  color: #ff4d4f;
  margin-right: 2rpx;
}
.form-input {
  display: block;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  box-sizing: border-box;
  min-height: 72rpx;
  border: 1rpx solid transparent;
}
.form-input.has-error {
  border-color: #ff4d4f;
  background: rgba(255, 77, 79, 0.04);
}
.form-placeholder {
  color: var(--color-text-placeholder);
}
.form-error {
  display: block;
  font-size: var(--font-size-mini);
  color: #ff4d4f;
  margin-top: 4rpx;
}
.form-textarea {
  display: block;
  width: 100%;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  box-sizing: border-box;
  min-height: 120rpx;
  border: 1rpx solid transparent;
}

/* ===== 库存类型选择 ===== */
.stock-type-group {
  display: flex;
  gap: var(--space-sm);
}
.stock-type-chip {
  flex: 1;
  text-align: center;
  padding: var(--space-sm) var(--space-md);
  background: var(--color-bg);
  border: 1rpx solid var(--color-divider);
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
}
.stock-type-chip.active {
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border-color: var(--role-sales);
  font-weight: var(--font-weight-semibold);
}
</style>