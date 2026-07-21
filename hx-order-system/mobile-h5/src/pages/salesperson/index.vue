<script setup lang="ts">
/**
 * v0.3.0-M2.2 + P1-3：业务员工作台
 *
 * Tab（v0.3-MVP 3 个 + P1-3 新增库存）：
 *  ① 调车单  - 我创建的调车单(状态 流转可见)
 *  ② 创建调车单  - 5 步引导(MVP 简化为单页表单,后续可拆 5 页)
 *  ③ 库存 (P1-3 新增) - 我维护的库存 + 快速改数量 + 新建商品
 *  ④ 我的        - 业务员身份 + 切换角色
 *
 * 架构：router + state hub(跟 driver orders/index.vue 同款 Plan B 模式)
 *
 * 设计动机(v0.3-MVP 简化):
 *  - 调车单创建业务字段多,5 步引导虽然 UX 好,但 MVP 阶段单页表单够用
 *  - 拆 5 个 page 路由 + 步骤状态管理是 v0.4 优化项
 */

import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'
import { useRoleStore } from '@/stores/role'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { MOCK_INVENTORY, type Inventory } from '@/mock/inventory'
import { DEFAULT_SALESPERSON } from '@/mock/salespeople'

import MyDispatchesTab from './tabs/MyDispatchesTab.vue'
import CreateDispatchForm from './tabs/CreateDispatchForm.vue'
import InventoryTab from './tabs/InventoryTab.vue'
import InventoryFormModal from './tabs/InventoryFormModal.vue'
import MeTab from './tabs/MeTab.vue'
import WorkbenchTab from './tabs/WorkbenchTab.vue'  // D-Fix-7：从司机端迁移
import AppSkeleton from '@/components/AppSkeleton.vue'

// O1：加载状态（首次进入时显示骨架屏）
const initialLoading = ref(true)

/**
 * v0.3.0-M2.2 + P1-3：业务员工作台
 *
 * 设计动机(v0.3-MVP 简化):
 *  - 调车单创建业务字段多,5 步引导虽然 UX 好,但 MVP 阶段单页表单够用
 *  - 拆 5 个 page 路由 + 步骤状态管理是 v0.4 优化项
 *
 * Why SalespersonTabKey 本地类型：
 *  - driver 端 TabKey 是 5 个（workbench/orders/messages/gps/me）
 *  - salesperson 端 4 个（orders/create/inventory/me），完全不同
 *  - uiStore.activeTab 类型是 TabKey（driver），salesperson 用本地类型 + 类型断言兼容
 */
type SalespersonTabKey = 'workbench' | 'orders' | 'create' | 'inventory' | 'me'  // D-Fix-7：新增 workbench

const uiStore = useUiStore()
const roleStore = useRoleStore()
const { activeTab } = storeToRefs(uiStore)

// 当前业务员身份(M0 阶段固定 mock-sp-001,M3 接统一账户后从 store 读)
const currentSalespersonId = ref(DEFAULT_SALESPERSON.id)

// 我创建的调车单列表(local copy,onShow 时 reload)
const myDispatches = ref<DispatchMock[]>([])
// v0.3.0-M2.2 + P1-3：我维护的库存列表（按 salespersonId 过滤）
const myInventory = ref<Inventory[]>([])

function loadMyDispatches() {
  myDispatches.value = MOCK_DISPATCHES.filter(
    (d) => (d as any).salespersonId === currentSalespersonId.value,
  )
}

function loadMyInventory() {
  myInventory.value = MOCK_INVENTORY.filter(
    (i) => i.salesPersonId === currentSalespersonId.value,
  )
}

onLoad(() => {
  // 确保角色正确(从 role-select 跳过来时已经设了,这里兜底)
  if (roleStore.currentRole !== 'salesperson') {
    roleStore.setRole('salesperson', currentSalespersonId.value)
  }
  // 角色进入即重置 activeTab,避免从其他角色切过来时残留的 tab key 命中不到本角色 Tab 列表
  uiStore.resetForRole('salesperson')
  loadMyDispatches()
  loadMyInventory()
  // O1：模拟数据加载延迟后关闭骨架屏（mock 阶段用 setTimeout 演示效果）
  setTimeout(() => {
    initialLoading.value = false
  }, 600)
})

onShow(() => {
  loadMyDispatches()
  loadMyInventory()
})

function switchTab(tab: SalespersonTabKey) {
  uiStore.setActiveTab(tab as any) // 类型兼容：uiStore TabKey 是 driver 的，salesperson 用本地类型
}

// 创建调车单成功后刷新列表
function onCreated() {
  loadMyDispatches()
  uiStore.setActiveTab('orders' as any)
  uni.showToast({ title: '调车单已创建', icon: 'success' })
}

// P1-2：业务员点【详情】→ 复用 driver/order-detail 页（统一详情页）
function onViewDetail(item: DispatchMock) {
  uni.navigateTo({ url: `/pages/driver/order-detail/index?id=${item.id}` })
}

// P1-2：业务员取消调车单（仅 draft/pending_confirm/confirmed 状态可取消）
function onCancel(item: DispatchMock) {
  uni.showModal({
    title: '取消调车单',
    content: `订单 ${item.dispatchNo}（${item.customerName}）确认取消？\n\n取消后物流公司将不再受理。`,
    confirmText: '确认取消',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (!res.confirm) return
      // 1) 更新本地 myDispatches
      const idx = myDispatches.value.findIndex((d) => d.id === item.id)
      if (idx >= 0) {
        myDispatches.value[idx].status = 'cancelled'
      }
      // 2) 同步 MOCK_DISPATCHES
      const mockIdx = MOCK_DISPATCHES.findIndex((d) => d.id === item.id)
      if (mockIdx >= 0) MOCK_DISPATCHES[mockIdx].status = 'cancelled'
      // 3) toast 提示
      uni.showToast({ title: '已取消', icon: 'success' })
    },
  })
}

// D-Fix-1 v2：4 个库存操作按钮 handler
//   - onRemoveInventory: 真做（删除已入库库存并同步 mock）
//   - onViewInventory / onEditInventory / onDispatchFromInventory: 临时 toast 占位
//     （InventoryFormModal 暂不支持 view/edit 模式，CreateDispatchForm 暂不支持
//      inventoryId 预填，后续 commit 扩展）

function onViewInventory(item: Inventory) {
  // 后续 commit 扩展 InventoryFormModal 支持 view 模式（readonly 弹窗）
  uni.showToast({ title: `查看「${item.materialName}」功能开发中`, icon: 'none' })
}

function onEditInventory(item: Inventory) {
  // 后续 commit 扩展 InventoryFormModal 支持 edit 模式
  uni.showToast({ title: `编辑「${item.materialName}」功能开发中`, icon: 'none' })
}

function onDispatchFromInventory(item: Inventory) {
  // 后续 commit 扩展 CreateDispatchForm 支持 inventoryId 预填（已写入 storage 标记）
  uni.showToast({ title: `从「${item.materialName}」发起调车功能开发中`, icon: 'none' })
}

function onRemoveInventory(item: Inventory) {
  uni.showModal({
    title: '确认删除',
    content: `确认删除库存「${item.materialName}」? 仅可删除已入库库存,删除后不可恢复`,
    confirmText: '确认删除',
    cancelText: '取消',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (!res.confirm) return
      // 1) 从 myInventory 移除
      const idx = myInventory.value.findIndex((i) => i.id === item.id)
      if (idx >= 0) myInventory.value.splice(idx, 1)
      // 2) 同步 MOCK_INVENTORY
      const mockIdx = MOCK_INVENTORY.findIndex((i) => i.id === item.id)
      if (mockIdx >= 0) MOCK_INVENTORY.splice(mockIdx, 1)
      uni.showToast({ title: '已删除', icon: 'success' })
    },
  })
}

// P1-3：业务员新建商品（InventoryFormModal emit created）
function onCreatedInventory(item: Inventory) {
  myInventory.value.unshift(item)
  MOCK_INVENTORY.unshift(item)
  uni.setStorageSync('__inventory_just_added', item.id) // 用于「我的」Tab 显示高亮（可选）
}

// P1-3：底部【新建商品】浮动按钮触发
const showInventoryForm = ref(false)
function openInventoryForm() {
  showInventoryForm.value = true
}
</script>

<template>
  <view class="page">
    <!-- D-Fix-3：create 状态下显示返回栏（替代 Header） -->
    <view v-if="activeTab === 'create'" class="create-header">
      <view class="create-header-back" @click="switchTab('orders')">
        <text class="create-back-icon">‹</text>
      </view>
      <text class="create-header-title">创建调车单</text>
      <view class="create-header-placeholder"></view>
    </view>

    <!-- 顶部状态栏 + Header（仅非 create 状态显示） -->
    <view v-if="activeTab !== 'create'">
      <view class="status-bar"></view>
      <view class="header">
        <view class="header-top">
          <view class="welcome">
            <text class="welcome-hi">营销业务员</text>
            <view class="welcome-name-row">
              <text class="welcome-name">{{ DEFAULT_SALESPERSON.name }}</text>
            </view>
          </view>
          <!-- D-Fix-5：右侧容器（[+] 按钮 + avatar）固定贴右 -->
          <view class="header-right">
            <!-- D-Fix-4：调车单 Tab 右上角圆形 + 按钮（替代 D-Fix-3 顶部全宽按钮） -->
            <view
              v-if="activeTab === 'orders'"
              class="header-create-btn"
              @click="switchTab('create')"
            >
              <image class="header-create-icon" src="/static/icons/plus.svg" mode="aspectFit" />
            </view>
            <view class="welcome-avatar">
              <text>{{ DEFAULT_SALESPERSON.name.charAt(0) }}</text>
            </view>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 内容 -->
    <view class="content">
      <!-- O1：加载骨架屏（首次进入时显示） -->
      <AppSkeleton
        v-if="initialLoading && (activeTab === 'workbench' || activeTab === 'orders' || activeTab === 'inventory')"
        :type="activeTab === 'orders' ? 'list' : 'card'"
        :count="3"
      />
      <WorkbenchTab
        v-else-if="activeTab === 'workbench'"
        :dispatch-list="myDispatches"
        @go-detail="onViewDetail"
        @switch-tab="switchTab"
      />
      <MyDispatchesTab
        v-else-if="activeTab === 'orders'"
        :dispatches="myDispatches"
        @switch-tab="switchTab"
        @view-detail="onViewDetail"
        @cancel="onCancel"
      />
      <CreateDispatchForm
        v-else-if="activeTab === 'create'"
        @created="onCreated"
      />
      <InventoryTab
        v-else-if="activeTab === 'inventory'"
        :inventory="myInventory"
        @create-new="openInventoryForm"
        @view="onViewInventory"
        @edit="onEditInventory"
        @dispatch="onDispatchFromInventory"
        @remove="onRemoveInventory"
      />
      <MeTab v-else-if="activeTab === 'me'" />
    </view>

    <!-- 底部 TabBar（D-Fix-7：4 项含工作台，create 状态隐藏） -->
    <view v-if="activeTab !== 'create'" class="tabbar">
      <view
        v-for="t in [
          { key: 'workbench' as SalespersonTabKey, label: '工作台', icon: '/static/icons/dashboard.svg' },
          { key: 'orders' as SalespersonTabKey, label: '调车单', icon: '/static/icons/list.svg' },
          { key: 'inventory' as SalespersonTabKey, label: '库存', icon: '/static/icons/warehouse.svg' },
          { key: 'me' as SalespersonTabKey, label: '我的', icon: '/static/icons/user.svg' },
        ]"
        :key="t.key"
        class="tabbar-item"
        :class="{ active: activeTab === t.key }"
        @click="switchTab(t.key)"
      >
        <image class="tabbar-icon" :src="t.icon" mode="aspectFit" />
        <text class="tabbar-label">{{ t.label }}</text>
      </view>
    </view>

    <!-- v0.3.0-M2.2 + P1-3：新建商品 Modal（库存 Tab 用） -->
    <InventoryFormModal
      v-if="showInventoryForm"
      @close="showInventoryForm = false"
      @created="onCreatedInventory"
    />
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  /* P1-2 fix v3：提交按钮改为 form 末尾 Section（跟随滚动），无需大量底部留白
     留 140rpx 仅为 TabBar 高度 */
  padding-bottom: 140rpx;
}
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100% !important;
  padding-bottom: 0 !important;
}

/* Frame 模式：隐藏 uni-app 默认 navigationBar */
:deep(uni-page-head),
:deep(.uni-page-head),
:deep(.uni-placeholder) {
  display: none !important;
}

.status-bar {
  height: 88rpx; /* iPhone 14 Dynamic Island 安全区 (44dp × 2rpx) */
  background: var(--role-sales); /* 业务员主题色:青色 */
}

/* ===== D-Fix-5：右侧容器（[+] 按钮 + avatar）固定贴右 ===== */
.header-right {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* ===== D-Fix-4：Header 右上角 + 按钮（调车单 Tab 用） ===== */
.header-create-btn {
  width: 64rpx;
  height: 64rpx;
  border-radius: 50%;
  background: var(--color-card);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-sm);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  box-shadow: var(--shadow-sm);
}
.header-create-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--role-sales);
}

/* ===== D-Fix-3：create 状态返回栏 ===== */
.create-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-md);
  background: var(--role-sales);
  color: var(--color-text-on-brand);
  /* 状态栏占位（与 Header 顶部的 status-bar 高度一致） */
  padding-top: calc(var(--space-md) + var(--space-2xs));
}
.create-header-back {
  width: 64rpx;
  height: 64rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.create-back-icon {
  font-size: 56rpx;
  line-height: 1;
  font-weight: var(--font-weight-medium);
}
.create-header-title {
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-semibold);
  flex: 1;
  text-align: center;
}
.create-header-placeholder {
  width: 64rpx;
  height: 64rpx;
}

/* ===== Header ===== */
.header {
  background: var(--role-sales);
  padding: var(--space-md) var(--space-md) var(--space-md);
  color: var(--color-text-on-brand);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
/* D-Fix-5：.welcome 加 flex: 1，让 [+] 按钮与 avatar 自然贴到右侧 */
.welcome { display: flex; flex-direction: column; flex: 1; min-width: 0; }
.welcome-hi {
  font-size: var(--font-size-sub);
  opacity: 0.9;
}
.welcome-name-row {
  display: flex;
  align-items: baseline;
  gap: var(--space-sm);
  margin-top: 4rpx;
}
.welcome-name {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
}
.welcome-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  font-weight: var(--font-weight-semibold);
}

.content {
  min-height: calc(100vh - 200rpx);
}
html.hx-frame-on .content {
  flex: 1 1 auto !important;
  min-height: 0 !important;
  overflow-y: auto !important;
  -webkit-overflow-scrolling: touch;
}

/* ===== TabBar ===== */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 130rpx;
  background: var(--color-card);
  border-top: 1rpx solid var(--color-divider);
  display: flex;
  align-items: center;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
  -webkit-tap-highlight-color: transparent;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
html.hx-frame-on .tabbar {
  position: absolute !important;
  bottom: 0 !important;
  max-width: 390px !important;
}
.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
}
.tabbar-icon {
  width: 40rpx;
  height: 40rpx;
}
.tabbar-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.tabbar-item.active .tabbar-label {
  color: var(--role-sales);
  font-weight: var(--font-weight-semibold);
}
.tabbar-item.active .tabbar-icon {
  color: var(--role-sales);
}
.tabbar-item .tabbar-icon { color: var(--color-text-secondary); }
</style>