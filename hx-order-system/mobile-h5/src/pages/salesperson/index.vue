<script setup lang="ts">
/**
 * 业务员工作台（v0.3-MVP）
 *
 * 架构：router + state hub(跟 driver orders/index.vue 同款 Plan B 模式)
 *
 * Tab:
 *  ① 我的调车单  - 我创建的调车单(status 流转可见)
 *  ② 创建调车单  - 5 步引导(MVP 简化为单页表单,后续可拆 5 页)
 *  ③ 我的        - 业务员身份 + 切换角色
 *
 * 设计动机(v0.3-MVP 简化):
 *  - 调车单创建业务字段多,5 步引导虽然 UX 好,但 MVP 阶段单页表单够用
 *  - 拆 5 个 page 路由 + 步骤状态管理是 v0.4 优化项
 */

import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'
import { useRoleStore } from '@/stores/role'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { DEFAULT_SALESPERSON } from '@/mock/salespeople'
import type { TabKey } from '@/types/driver'

import MyDispatchesTab from './tabs/MyDispatchesTab.vue'
import CreateDispatchForm from './tabs/CreateDispatchForm.vue'
import MeTab from './tabs/MeTab.vue'

const uiStore = useUiStore()
const roleStore = useRoleStore()
const { activeTab } = storeToRefs(uiStore)

// 当前业务员身份(M0 阶段固定 mock-sp-001,M3 接统一账户后从 store 读)
const currentSalespersonId = ref(DEFAULT_SALESPERSON.id)

// 我创建的调车单列表(local copy,onShow 时 reload)
const myDispatches = ref<DispatchMock[]>([])

function loadMyDispatches() {
  myDispatches.value = MOCK_DISPATCHES.filter(
    (d) => (d as any).salespersonId === currentSalespersonId.value,
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
})

onShow(() => {
  loadMyDispatches()
})

function switchTab(tab: TabKey) {
  uiStore.setActiveTab(tab)
}

// 创建调车单成功后刷新列表
function onCreated() {
  loadMyDispatches()
  uiStore.setActiveTab('orders')
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
</script>

<template>
  <view class="page">
    <!-- 顶部状态栏 + Header -->
    <view class="status-bar"></view>
    <view class="header">
      <view class="header-top">
        <view class="welcome">
          <text class="welcome-hi">营销业务员</text>
          <view class="welcome-name-row">
            <text class="welcome-name">{{ DEFAULT_SALESPERSON.name }}</text>
          </view>
        </view>
        <view class="welcome-avatar">
          <text>{{ DEFAULT_SALESPERSON.name.charAt(0) }}</text>
        </view>
      </view>
    </view>

    <!-- Tab 内容 -->
    <view class="content">
      <MyDispatchesTab
        v-if="activeTab === 'orders'"
        :dispatches="myDispatches"
        @switch-tab="switchTab"
        @view-detail="onViewDetail"
        @cancel="onCancel"
      />
      <CreateDispatchForm
        v-else-if="activeTab === 'create'"
        @created="onCreated"
      />
      <MeTab v-else-if="activeTab === 'me'" />
    </view>

    <!-- 底部 TabBar -->
    <view class="tabbar">
      <view
        v-for="t in [
          { key: 'orders' as TabKey, label: '调车单', icon: '/static/icons/list.svg' },
          { key: 'create' as TabKey, label: '创建', icon: '/static/icons/package.svg' },
          { key: 'me' as TabKey, label: '我的', icon: '/static/icons/user.svg' },
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
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
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
  height: 40rpx;
  background: var(--role-sales); /* 业务员主题色:青色 */
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
.welcome { display: flex; flex-direction: column; }
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