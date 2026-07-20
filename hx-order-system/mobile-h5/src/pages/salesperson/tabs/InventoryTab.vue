<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-3：库存列表 Tab（业务员视角，E2 方案）
 *
 * 内容：我维护的库存列表 + 快速改数量 + 新建商品入口
 *
 * P1-3 升级（业务员手动添加库存）：
 *  - 顶部 3 KPI（总项数 / 在库数 / 总箱数）
 *  - 卡片：物料名/客户/数量/状态/包装
 *  - 操作按钮：【改数量】【新建商品】
 *  - 库存类型/状态徽章
 *
 * 数据：inventory (props from salesperson/index.vue, 已按 salespersonId 过滤)
 */

import { computed, ref } from 'vue'
import type { Inventory } from '@/types/shared/inventory'
import { INVENTORY_STATUS_LABEL, STOCK_TYPE_LABEL } from '@/mock/inventory'
import EmptyState from '@/components/EmptyState.vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{
  inventory: Inventory[]
}>()

const emit = defineEmits<{
  (e: 'switchTab', tab: 'create'): void
  (e: 'editQuantity', item: Inventory): void
  (e: 'createNew'): void
}>()

// ===== 排序 + KPI =====
const sortedInventory = computed(() => {
  return [...props.inventory].sort((a, b) => b.id.localeCompare(a.id))
})

const kpiTotal = computed(() => sortedInventory.value.length)
const kpiInStock = computed(() =>
  sortedInventory.value.filter((i) => i.status === 'in_stock').length
)
const kpiTotalQty = computed(() =>
  sortedInventory.value.reduce((sum, i) => sum + i.quantity, 0)
)

// ===== 修改数量弹窗 =====
const showQtyModal = ref(false)
const qtyTarget = ref<Inventory | null>(null)
const qtyInput = ref('')

function openQtyModal(item: Inventory) {
  qtyTarget.value = item
  qtyInput.value = String(item.quantity)
  showQtyModal.value = true
}

function closeQtyModal() {
  showQtyModal.value = false
  qtyTarget.value = null
  qtyInput.value = ''
}

function confirmQtyChange() {
  if (!qtyTarget.value) return
  const newQty = Number(qtyInput.value)
  if (!Number.isFinite(newQty) || newQty < 0) {
    uni.showToast({ title: '请输入有效数字', icon: 'none' })
    return
  }
  emit('editQuantity', { ...qtyTarget.value, quantity: newQty })
  closeQtyModal()
}

function statusClass(status: Inventory['status']): string {
  const map: Record<Inventory['status'], string> = {
    in_stock: 'status-in-stock',
    locked: 'status-locked',
    shipped: 'status-shipped',
    voided: 'status-voided',
  }
  return map[status]
}
</script>

<template>
  <view class="tab-pane">
    <!-- ===== 顶部 3 KPI ===== -->
    <view class="stat-row">
      <view class="stat-item">
        <text class="stat-num">{{ kpiTotal }}</text>
        <text class="stat-label">总项数</text>
      </view>
      <view class="stat-item highlight">
        <text class="stat-num">{{ kpiInStock }}</text>
        <text class="stat-label">在库数</text>
      </view>
      <view class="stat-item success">
        <text class="stat-num">{{ kpiTotalQty }}</text>
        <text class="stat-label">总箱数</text>
      </view>
    </view>

    <!-- ===== 空状态 ===== -->
    <view v-if="sortedInventory.length === 0" class="empty-wrap">
      <EmptyState
        icon="/static/icons/package.svg"
        title="还没有库存"
        desc="点底部【新建商品】录入第一批库存"
      >
        <button class="empty-btn" @click="emit('createNew')">立即新建</button>
      </EmptyState>
    </view>

    <!-- ===== 库存列表 ===== -->
    <view v-else class="list">
      <view v-for="i in sortedInventory" :key="i.id" class="inv-card">
        <view class="card-head">
          <text class="material-name">{{ i.materialName }}</text>
          <view class="status-tag" :class="statusClass(i.status)">
            {{ INVENTORY_STATUS_LABEL[i.status] }}
          </view>
        </view>

        <view class="info-row">
          <image class="info-icon" src="/static/icons/goods.svg" mode="aspectFit" />
          <text class="info-label">编码</text>
          <text class="info-value">{{ i.materialCode }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/customer.svg" mode="aspectFit" />
          <text class="info-label">客户</text>
          <text class="info-value ellipsis">{{ i.customerName }}</text>
        </view>
        <view class="info-row">
          <image class="info-icon" src="/static/icons/package.svg" mode="aspectFit" />
          <text class="info-label">数量</text>
          <text class="info-value qty-value">{{ i.quantity }} {{ i.unit }}</text>
          <text class="stock-type-tag">{{ STOCK_TYPE_LABEL[i.stockType] }}</text>
        </view>
        <view v-if="i.remark" class="info-row">
          <text class="info-label">备注</text>
          <text class="info-value ellipsis remark-text">{{ i.remark }}</text>
        </view>

        <!-- 操作按钮（O3 改用 AppButton 通用组件） -->
        <view class="card-actions">
          <AppButton variant="secondary" icon="/static/icons/edit.svg" @click="openQtyModal(i)">
            改数量
          </AppButton>
        </view>
      </view>
    </view>

    <!-- ===== 修改数量弹窗 ===== -->
    <view v-if="showQtyModal && qtyTarget" class="qty-modal-mask" @click.self="closeQtyModal">
      <view class="qty-modal">
        <view class="qty-modal-header">
          <text class="qty-modal-title">修改库存数量</text>
        </view>
        <view class="qty-modal-body">
          <view class="qty-modal-info">
            <text class="qty-modal-material">{{ qtyTarget.materialName }}</text>
            <text class="qty-modal-customer">{{ qtyTarget.customerName }}</text>
            <text class="qty-modal-current">当前数量：{{ qtyTarget.quantity }} {{ qtyTarget.unit }}</text>
          </view>
          <input
            v-model="qtyInput"
            class="qty-input"
            type="number"
            placeholder="输入新数量"
          />
          <text class="qty-input-unit">{{ qtyTarget.unit }}</text>
        </view>
        <view class="qty-modal-actions">
          <button class="qty-btn-cancel" @click="closeQtyModal">取消</button>
          <button class="qty-btn-confirm" @click="confirmQtyChange">确认</button>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding-bottom: 80rpx; }

/* ===== KPI ===== */
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
  font-family: var(--font-family-mono);
}
.stat-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.stat-item.highlight .stat-num { color: var(--role-sales); }
.stat-item.success .stat-num { color: var(--color-status-completed); }

/* ===== 空状态 ===== */
.empty-wrap { padding: 60rpx var(--space-md); }
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

/* ===== 库存卡 ===== */
.list { padding: 0 var(--space-md); }
.inv-card {
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
.material-name {
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
.status-in-stock { background: rgba(82, 196, 26, 0.12); color: #52c41a; }
.status-locked { background: rgba(250, 140, 22, 0.12); color: #fa8c16; }
.status-shipped { background: rgba(22, 119, 255, 0.12); color: #1677ff; }
.status-voided { background: rgba(140, 140, 140, 0.12); color: #8c8c8c; }

.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}
.info-icon {
  width: 32rpx;
  height: 32rpx;
  color: var(--role-sales);
  flex-shrink: 0;
}
.info-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 80rpx;
  margin-left: var(--space-xs);
  flex-shrink: 0;
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  min-width: 0;
}
.qty-value {
  font-weight: var(--font-weight-semibold);
  color: var(--role-sales);
  font-family: var(--font-family-mono);
}
.stock-type-tag {
  font-size: var(--font-size-mini);
  padding: 2rpx 10rpx;
  background: var(--color-bg);
  color: var(--color-text-secondary);
  border-radius: var(--radius-sm);
  margin-left: var(--space-xs);
}
.remark-text {
  color: var(--color-text-secondary);
  font-size: var(--font-size-sub);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* ===== 操作按钮 ===== */
.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-edit-qty {
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
.btn-icon {
  width: 28rpx;
  height: 28rpx;
}

/* ===== 改数量 Modal ===== */
.qty-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 999;
  display: flex;
  align-items: center;
  justify-content: center;
}
.qty-modal {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  width: 640rpx;
  max-width: 90%;
  padding: var(--space-lg);
}
.qty-modal-header {
  margin-bottom: var(--space-md);
}
.qty-modal-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}
.qty-modal-body {
  margin-bottom: var(--space-lg);
}
.qty-modal-info {
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-sm) var(--space-md);
  margin-bottom: var(--space-md);
  display: flex;
  flex-direction: column;
  gap: 4rpx;
}
.qty-modal-material {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  color: var(--color-text-primary);
}
.qty-modal-customer {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.qty-modal-current {
  font-size: var(--font-size-sub);
  color: var(--role-sales);
  margin-top: 4rpx;
}
.qty-input {
  display: block;
  width: 100%;
  padding: var(--space-md);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: 40rpx;
  font-weight: var(--font-weight-bold);
  color: var(--role-sales);
  text-align: center;
  box-sizing: border-box;
  min-height: 96rpx;
}
.qty-input-unit {
  display: block;
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-top: var(--space-xs);
}
.qty-modal-actions {
  display: flex;
  gap: var(--space-sm);
}
.qty-btn-cancel {
  flex: 1;
  height: 80rpx;
  background: var(--color-card);
  color: var(--color-text-regular);
  border: 1rpx solid var(--color-divider);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
}
.qty-btn-confirm {
  flex: 1;
  height: 80rpx;
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
}
</style>