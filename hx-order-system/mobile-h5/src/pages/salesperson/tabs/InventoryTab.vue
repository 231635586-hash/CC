<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-3 + D-Fix-1 v2：库存列表 Tab（业务员视角，与 Web 端业务逻辑对齐）
 *
 * 内容：我维护的库存列表 + 新建商品入口
 *
 * P1-3 升级（业务员手动添加库存）：
 *  - 顶部 3 KPI（总项数 / 在库数 / 总箱数）
 *  - 卡片：物料名/客户/数量/状态/包装
 *  - 操作按钮：【改数量】【新建商品】
 *  - 库存类型/状态徽章
 *
 * D-Fix-1 v2 业务逻辑对齐 Web 端（commit 重做）：
 *  - KPI 由 3 项改 4 项：总项数 / 已入库 / 已锁定 / 已发货
 *  - 删除「改数量」按钮 + 改数量 Modal（业务逻辑不存在，Web 端无此按钮）
 *  - 新增 4 个操作按钮（与 Web 端一致）：
 *    · 查看：任何状态可点
 *    · 编辑 / 调车 / 删除：仅 status === 'in_stock' 可点
 *  - 1 行 4 按钮等宽布局（size sm + 紧凑 padding）
 *
 * 数据：inventory (props from salesperson/index.vue, 已按 salespersonId 过滤)
 */

import { computed } from 'vue'
import type { Inventory } from '@/types/shared/inventory'
import { INVENTORY_STATUS_LABEL, STOCK_TYPE_LABEL } from '@/mock/inventory'
import EmptyState from '@/components/EmptyState.vue'
import AppButton from '@/components/AppButton.vue'

const props = defineProps<{
  inventory: Inventory[]
}>()

const emit = defineEmits<{
  (e: 'switchTab', tab: 'create'): void
  (e: 'createNew'): void
  /** D-Fix-1 v2：4 个新操作按钮（仅 InventoryTab 触发，由父组件 salesperson/index.vue 实际执行） */
  (e: 'view', item: Inventory): void
  (e: 'edit', item: Inventory): void
  (e: 'dispatch', item: Inventory): void
  (e: 'remove', item: Inventory): void
}>()

// ===== 排序 + KPI（D-Fix-1 v2：4 项对齐 Web 端状态分组）=====
const sortedInventory = computed(() => {
  return [...props.inventory].sort((a, b) => b.id.localeCompare(a.id))
})

const kpiTotal = computed(() => sortedInventory.value.length)
const kpiInStock = computed(() =>
  sortedInventory.value.filter((i) => i.status === 'in_stock').length
)
const kpiLocked = computed(() =>
  sortedInventory.value.filter((i) => i.status === 'locked').length
)
const kpiShipped = computed(() =>
  sortedInventory.value.filter((i) => i.status === 'shipped').length
)

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
    <!-- ===== 顶部 4 KPI（D-Fix-1 v2：对齐 Web 端状态分组）===== -->
    <view class="stat-row">
      <view class="stat-item">
        <text class="stat-num">{{ kpiTotal }}</text>
        <text class="stat-label">总项数</text>
      </view>
      <view class="stat-item success">
        <text class="stat-num">{{ kpiInStock }}</text>
        <text class="stat-label">已入库</text>
      </view>
      <view class="stat-item warn">
        <text class="stat-num">{{ kpiLocked }}</text>
        <text class="stat-label">已锁定</text>
      </view>
      <view class="stat-item info">
        <text class="stat-num">{{ kpiShipped }}</text>
        <text class="stat-label">已发货</text>
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

        <!-- 操作按钮（D-Fix-1 v2：4 个按钮 1 行布局，仅 in_stock 可编辑/调车/删除） -->
        <view class="card-actions card-actions-row4">
          <AppButton variant="ghost" size="sm" custom-class="action-tight" @click="emit('view', i)">
            查看
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            custom-class="action-tight"
            :disabled="i.status !== 'in_stock'"
            @click="emit('edit', i)"
          >
            编辑
          </AppButton>
          <AppButton
            variant="secondary"
            size="sm"
            custom-class="action-tight"
            :disabled="i.status !== 'in_stock'"
            @click="emit('dispatch', i)"
          >
            调车
          </AppButton>
          <AppButton
            variant="danger"
            size="sm"
            custom-class="action-tight"
            :disabled="i.status !== 'in_stock'"
            @click="emit('remove', i)"
          >
            删除
          </AppButton>
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
/* D-Fix-1 v2：4 KPI 颜色（已锁定橙色 / 已发货蓝色，对齐 Web 端） */
.stat-item.warn .stat-num { color: var(--color-status-locked); }
.stat-item.info .stat-num { color: var(--color-status-shipped); }

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

/* ===== D-Fix-1 v2：4 按钮紧凑布局（移动端小屏适配）===== */
.card-actions-row4 {
  gap: var(--space-xs) !important;  /* 4 按钮 gap 缩到 8rpx */
}
.action-tight {
  padding: 0 var(--space-xs) !important;  /* 紧凑 padding（覆盖 AppButton sm 默认 24rpx） */
  min-width: 0 !important;
  font-size: var(--font-size-mini) !important;  /* 字号缩到 24rpx */
  letter-spacing: -0.5rpx;  /* 字间距收紧 */
}
</style>