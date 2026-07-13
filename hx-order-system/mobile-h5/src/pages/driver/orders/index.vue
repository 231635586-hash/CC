<script setup lang="ts">
/**
 * 华翔司机端 H5 - 工作台主页面（v0.2.x Plan B 重构）
 *
 * 设计哲学（保留）：
 *  - 司机工作场景碎片化（可能 5 分钟看一次），减少页面跳转 = 减少操作摩擦
 *  - 5 个 Tab 横向并列，所有功能一屏可达
 *
 * Plan B 架构（v0.2.x）：
 *  - index.vue 退化为 router + state hub（~150 行）
 *    · 共享状态：dispatchList / notifications / position / detectedYard / yards
 *    · 跨 Tab 业务方法：navigateToYard / markMessageRead / ...
 *    · TabBar（5 项固定在底部）
 *  - 5 个 Tab 拆为 tabs/*.vue 子组件，各自管自己内部的 sub-tab / filter 等 UI state
 *  - Tab 级别 UI state（orderSubTab / msgFilter / gpsSubTab）提到 uiStore
 *    · 切走再切回不重置（之前 v-if 会销毁 ref）
 *
 * 派车单业务简化（v0.2.x）：
 *  - 司机无接单/拒单操作，dispatcher 派车即默认接单
 *  - status='dispatched' 的卡只显示 [导航前往园区] 按钮
 *  - dispatched → entering 由 GPS 自动检测触发（M3 真实阶段）
 *
 * token：src/App.vue 全局 CSS variables
 * mock：src/mock/dispatches.ts
 * 字典：src/constants/dispatchStatus.ts
 * store：src/stores/driver.ts + src/stores/ui.ts
 */

import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { storeToRefs } from 'pinia'
import { useDriverStore } from '@/stores/driver'
import { useUiStore } from '@/stores/ui'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { MOCK_DRIVERS, DEFAULT_DRIVER } from '@/mock/drivers'
import { MOCK_YARDS } from '@/constants/yards'
import { getCurrentPosition, detectYard, distanceM } from '@/utils/location'
import type { TabKey, NotificationItem, Yard } from '@/types/driver'

// 子组件
import WorkbenchTab from './tabs/WorkbenchTab.vue'
import OrdersTab from './tabs/OrdersTab.vue'
import MessagesTab from './tabs/MessagesTab.vue'
import GpsTab from './tabs/GpsTab.vue'
import MeTab from './tabs/MeTab.vue'

// ===== Pinia =====
const driverStore = useDriverStore()
const uiStore = useUiStore()
const { activeTab } = storeToRefs(uiStore)

// ===== 共享状态 =====
const dispatchList = ref<DispatchMock[]>([])
const position = ref<{ lng: number; lat: number; accuracyM: number } | null>(null)
const detectedYard = ref<Yard | null>(null)
const loading = ref(false)

const yards: Yard[] = MOCK_YARDS

const notifications = ref<NotificationItem[]>([
  { id: 'n1', type: 'loading', title: '通知装货', content: '秦壁园区已开始装货，请保持手机畅通', time: '14:00', timestamp: Date.now() - 30 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n2', type: 'depart', title: '可出发了', content: '您的派车单已派车，请尽快出发前往秦壁园区', time: '13:30', timestamp: Date.now() - 60 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n3', type: 'arrive', title: '已入园', content: '车辆已进入秦壁园区，库房已准备装货', time: '13:45', timestamp: Date.now() - 45 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n4', type: 'complete', title: '装货完成', content: '派车单 DC20260625008 已装货完成，等待出厂', time: '昨天 16:30', timestamp: Date.now() - 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-008' },
  { id: 'n5', type: 'cancel', title: '订单取消', content: '派车单 DC20260622001 已取消，无需前往', time: '06-22 14:00', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-001' },
])

// ===== GPS 最近园区计算（跨 Tab 共享，传给 GpsTab）=====
const nearestYard = computed(() => {
  if (!position.value) return null
  let nearest: { yard: Yard; distanceM: number } | null = null
  yards.forEach((y) => {
    const d = distanceM(position.value!, y)
    if (!nearest || d < nearest.distanceM) nearest = { yard: y, distanceM: d }
  })
  return nearest
})

// ===== 工具 =====
function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 6) return '凌晨好'
  if (h < 9) return '早上好'
  if (h < 12) return '上午好'
  if (h < 14) return '中午好'
  if (h < 18) return '下午好'
  if (h < 22) return '晚上好'
  return '夜深了'
}

// ===== 数据加载 =====
async function loadDispatchList() {
  loading.value = true
  await new Promise((r) => setTimeout(r, 200))
  dispatchList.value = MOCK_DISPATCHES
  loading.value = false
}

async function refreshGps() {
  const p = await getCurrentPosition()
  position.value = { ...p, accuracyM: 50 }
  const detected = detectYard(p, yards)
  if (uiStore.gpsSubTab === 'in') {
    detectedYard.value = detected || null
  } else {
    // out：已离开 = !detected
    detectedYard.value = detected
  }
}

// ===== 跨 Tab 操作 =====
function switchTab(tab: TabKey) {
  uiStore.setActiveTab(tab)
  if (tab === 'gps') refreshGps()
}

function goDetail(item: DispatchMock) {
  uni.navigateTo({ url: `/pages/driver/order-detail/index?id=${item.id}` })
}

/** 司机点 [导航前往园区] → 查首个园区坐标 → 调起导航(mock 阶段弹 modal,真实阶段调地图 SDK) */
function navigateToYard(item: DispatchMock) {
  const yardId = item.yardIds[0]
  const yard = yards.find((y) => y.id === yardId)
  if (!yard) {
    uni.showToast({ title: '园区未配置', icon: 'none' })
    return
  }
  openNavi(yard)
}

function markMessageRead(n: NotificationItem) {
  n.read = true
  if (n.type === 'depart' || n.type === 'arrive') {
    uiStore.setActiveTab('gps')
    uiStore.setGpsSubTab('in')
    refreshGps()
  } else if (n.type === 'loading') {
    const d = dispatchList.value.find((x) => x.id === n.dispatchId)
    if (d) goDetail(d)
  } else if (n.type === 'complete') {
    uiStore.setActiveTab('gps')
    uiStore.setGpsSubTab('out')
    refreshGps()
  }
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
  uni.showToast({ title: '已全部标记为已读', icon: 'success' })
}

function showDriverSwitcher() {
  uni.showActionSheet({
    itemList: MOCK_DRIVERS.map((d) => d.name),
    success: (res: any) => {
      const driver = MOCK_DRIVERS[res.tapIndex]
      driverStore.setDriver(driver)
      uni.showToast({ title: `已切换到${driver.name}`, icon: 'none' })
    },
  })
}

function openNavi(yard?: Yard) {
  if (!yard?.lng || !yard?.lat) {
    uni.showToast({ title: '园区坐标未配置', icon: 'none' })
    return
  }
  uni.showModal({
    title: '一键导航',
    content: `目标：${yard.name}\n坐标：${yard.lng}, ${yard.lat}\n（真实阶段将调起地图 APP）`,
    showCancel: false,
  })
}

// ===== 生命周期 =====
onLoad((query: any) => {
  if (query?.token) {
    uni.redirectTo({ url: `/pages/customer/sign/index?token=${encodeURIComponent(query.token)}` })
    return
  }
  if (!driverStore.currentDriver) {
    driverStore.setDriver(DEFAULT_DRIVER)
  }
  loadDispatchList()
})

onPullDownRefresh(async () => {
  await loadDispatchList()
  if (uiStore.activeTab === 'gps') await refreshGps()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page">
    <!-- 顶部状态栏 + Header（5 Tab 共享）-->
    <view class="status-bar"></view>
    <view class="header">
      <view class="header-top">
        <view class="welcome">
          <text class="welcome-hi">{{ getGreeting() }}</text>
          <view class="welcome-name-row">
            <text class="welcome-name">{{ driverStore.currentDriver?.name || '司机' }}</text>
          </view>
        </view>
        <view class="welcome-avatar">
          <text>{{ driverStore.currentDriver?.name?.charAt(0) || '司' }}</text>
        </view>
      </view>
    </view>

    <!-- Tab 内容区 -->
    <view class="content">
      <WorkbenchTab
        v-if="activeTab === 'workbench'"
        :dispatch-list="dispatchList"
        @go-detail="goDetail"
        @switch-tab="switchTab"
      />
      <OrdersTab
        v-else-if="activeTab === 'orders'"
        :dispatch-list="dispatchList"
        @go-detail="goDetail"
        @navigate="navigateToYard"
      />
      <MessagesTab
        v-else-if="activeTab === 'messages'"
        :notifications="notifications"
        @mark-read="markMessageRead"
        @mark-all-read="markAllRead"
      />
      <GpsTab
        v-else-if="activeTab === 'gps'"
        :position="position"
        :detected-yard="detectedYard"
        :nearest-yard="nearestYard"
        @refresh-gps="refreshGps"
        @open-navi="openNavi"
      />
      <MeTab
        v-else-if="activeTab === 'me'"
        @switch-driver="showDriverSwitcher"
        @toast="(msg: string) => uni.showToast({ title: msg, icon: 'none' })"
      />
    </view>

    <!-- 底部 TabBar（5 Tab 切换）-->
    <view class="tabbar">
      <view
        v-for="t in [
          { key: 'workbench' as TabKey, label: '工作台', icon: '/static/icons/dashboard.svg' },
          { key: 'orders' as TabKey, label: '派车单', icon: '/static/icons/list.svg' },
          { key: 'messages' as TabKey, label: '消息', icon: '/static/icons/bell.svg' },
          { key: 'gps' as TabKey, label: 'GPS', icon: '/static/icons/pin.svg' },
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
/* =============================================
 * 5 Tab 单页骨架（CSS Variables from src/App.vue）
 * 子组件自带 scoped 样式，page 只保留共享的 .page / .header / .tabbar
 * ============================================= */

/* Frame 模式：隐藏 uni-app 默认 navigationBar（我们自己画了 .header 蓝色块） */
:deep(uni-page-head),
:deep(.uni-page-head),
:deep(.uni-placeholder) {
  display: none !important;
}

.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 140rpx; /* 留出 TabBar 高度（mobile 模式）*/
}
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100% !important;
  padding-bottom: 0 !important;
}

.status-bar {
  height: 40rpx;
  background: var(--color-brand);
}

/* ===== 顶部 Header（5 Tab 共享）===== */
.header {
  background: var(--color-brand);
  padding: var(--space-md) var(--space-md) var(--space-md);
  color: var(--color-text-on-brand);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.welcome {
  display: flex;
  flex-direction: column;
}
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

/* ===== 底部 TabBar ===== */
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
/* Frame 模式：App.vue 已接管 position: absolute + bottom: 0,
   此处只补宽度约束(max-width 跟 Frame 等宽 390px) */
html.hx-frame-on .tabbar {
  max-width: 390px !important;
}
.tabbar-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4rpx;
  transition: color 0.2s ease;
}
.tabbar-icon {
  width: 40rpx;
  height: 40rpx;
  line-height: 1;
}
.tabbar-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.tabbar-item.active .tabbar-label {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
}
.tabbar-item.active .tabbar-icon {
  filter: drop-shadow(0 0 8rpx rgba(22, 119, 255, 0.3));
  color: var(--color-brand);
}
.tabbar-item .tabbar-icon {
  color: var(--color-text-secondary);
}
</style>