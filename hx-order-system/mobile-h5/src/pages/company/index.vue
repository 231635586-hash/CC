<script setup lang="ts">
/**
 * 物流公司工作台（v0.3-MVP + D-Fix-8 Tab 精简）
 *
 * 架构：router + state hub(跟 driver orders/index.vue + salesperson/index.vue 同款)
 *
 * Tab（D-Fix-8 后）：
 *  ① 待派车  - 本公司 confirmed 单,触发派车 modal → dispatched
 *  ② 我的    - 当前公司 + 切换角色
 *
 * 主题色：橙色 var(--role-company)
 */

import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useUiStore } from '@/stores/ui'
import { useRoleStore } from '@/stores/role'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { MOCK_LOGISTICS_COMPANIES } from '@/mock/companies'
import type { TabKey } from '@/types/driver'

import ToAssignTab from './tabs/ToAssignTab.vue'
import MeTab from './tabs/MeTab.vue'
import AssignDispatchModal from '@/components/AssignDispatchModal.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

// O1：加载状态（首次进入显示骨架屏）
const initialLoading = ref(true)

const uiStore = useUiStore()
const roleStore = useRoleStore()
const { activeTab } = storeToRefs(uiStore)

// 当前公司：MVP 阶段固定 mock-co-001(北方通远),M3+ 接账户体系
const currentCompany = MOCK_LOGISTICS_COMPANIES[0]
const currentCompanyId = ref(currentCompany.id)

// 共享调度单列表(按当前公司筛选)
const myDispatches = ref<DispatchMock[]>([])

function loadMyDispatches() {
  myDispatches.value = MOCK_DISPATCHES.filter(
    (d) => d.companyName === currentCompany.name,
  )
}

onLoad(() => {
  if (roleStore.currentRole !== 'company') {
    roleStore.setRole('company', currentCompanyId.value)
  }
  // 角色进入即重置 activeTab,避免从其他角色切过来时残留的 tab key 命中不到本角色 Tab 列表
  uiStore.resetForRole('company')
  loadMyDispatches()
  // O1：模拟数据加载延迟后关闭骨架屏（mock 阶段用 setTimeout 演示效果）
  setTimeout(() => {
    initialLoading.value = false
  }, 600)
})

onShow(() => {
  loadMyDispatches()
})

function switchTab(tab: TabKey) {
  uiStore.setActiveTab(tab)
}

// 待派车:触发 modal
const showAssignModal = ref(false)
const assigningItem = ref<DispatchMock | null>(null)

function openAssignModal(item: DispatchMock) {
  assigningItem.value = item
  showAssignModal.value = true
}

function closeAssignModal() {
  showAssignModal.value = false
  assigningItem.value = null
}

function onAssigned() {
  closeAssignModal()
  loadMyDispatches() // 刷新列表,该单从待派车移到已派车
}
</script>

<template>
  <view class="page">
    <!-- 顶部状态栏 + Header -->
    <view class="status-bar"></view>
    <view class="header">
      <view class="header-top">
        <view class="welcome">
          <text class="welcome-hi">物流公司</text>
          <view class="welcome-name-row">
            <text class="welcome-name">{{ currentCompany.name }}</text>
          </view>
        </view>
        <view class="welcome-avatar">
          <text>{{ currentCompany.name.charAt(0) }}</text>
        </view>
      </view>
    </view>

    <!-- Tab 内容 -->
    <view class="content">
      <!-- O1：加载骨架屏 -->
      <AppSkeleton
        v-if="initialLoading && activeTab === 'assign'"
        type="kpi"
        :count="3"
      />
      <ToAssignTab
        v-else-if="activeTab === 'assign'"
        :dispatches="myDispatches"
        @assign="openAssignModal"
      />
      <MeTab v-else-if="activeTab === 'me'" />
    </view>

    <!-- 底部 TabBar（D-Fix-8：移除「待确认」Tab,2 项精简） -->
    <view class="tabbar">
      <view
        v-for="t in [
          { key: 'assign' as TabKey, label: '待派车', icon: '/static/icons/truck.svg' },
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

    <!-- 派车 Modal -->
    <AssignDispatchModal
      v-if="showAssignModal && assigningItem"
      :dispatch="assigningItem"
      :company-id="currentCompanyId"
      @close="closeAssignModal"
      @assigned="onAssigned"
    />
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
  background: var(--role-company); /* 物流公司主题色:橙色 */
}

/* ===== Header ===== */
.header {
  background: var(--role-company);
  padding: var(--space-md) var(--space-md) var(--space-md);
  color: var(--color-text-on-brand);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome { display: flex; flex-direction: column; min-width: 0; flex: 1; }
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
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
  flex-shrink: 0;
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
  color: var(--role-company);
  font-weight: var(--font-weight-semibold);
}
.tabbar-item.active .tabbar-icon { color: var(--role-company); }
.tabbar-item .tabbar-icon { color: var(--color-text-secondary); }
</style>