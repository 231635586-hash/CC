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
import { ref, computed, onUnmounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDriverStore } from '@/stores/driver'
import { useUiStore } from '@/stores/ui'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { MOCK_DRIVERS, DEFAULT_DRIVER } from '@/mock/drivers'
import { MOCK_YARDS } from '@/constants/yards'
import { getCurrentPosition, detectYard, distanceM } from '@/utils/location'
import type { TabKey, NotificationItem, Yard } from '@/types/driver'
import MobileTabBar from '@/components/MobileTabBar.vue'

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

/**
 * v0.3.0-M2.2 v2：司机点 [扫码排队] → 触发 markYardQueuedByScan
 *  - 实际生产：调起扫码摄像头扫园区二维码，解析出 yardId
 *  - mock 阶段：直接用 dispatch.yardIds[0] 作为 yardId
 *  - 本地 dispatchList：直接设置 dispatched → queued + 写 queuedAt
 *  - 注意：H5 与 PC 端不共享 localStorage（mobile-h5 独立 demo），仅本地状态变更
 */
function handleScanQueue(item: DispatchMock) {
  const idx = dispatchList.value.findIndex((d) => d.id === item.id)
  if (idx < 0) {
    uni.showToast({ title: '派车单不存在', icon: 'none' })
    return
  }
  const yardId = item.yardIds?.[0]
  if (!yardId) {
    uni.showToast({ title: '无主园区', icon: 'none' })
    return
  }
  // 触发 reactive 更新：替换 dispatch 对象触发 Vue 重新渲染
  const updated: DispatchMock = {
    ...dispatchList.value[idx],
    status: 'queued',
  }
  dispatchList.value = [
    ...dispatchList.value.slice(0, idx),
    updated,
    ...dispatchList.value.slice(idx + 1),
  ]
  // 同步 driver store 的 queueHistory（M2 兼容保留）
  const yard = yards.find((y) => y.id === yardId)
  driverStore.recordQueue(yardId, yard?.name || yardId, 'mock-scan-token')
  uni.showToast({ title: '📱 扫码成功,排队中', icon: 'success' })
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
  uni.showToast({ title: '已全部标记为已读', icon: 'success' })
}

/**
 * v0.3.0-M2.2：演示控制台触发"模拟道闸放行"事件
 *  - 找到第一条 status='queued' 的派车单 → queued → entering
 *  - H5 mock：本地生效（无 PC 后端通信）
 */
function handleDemoTriggerGate() {
  const idx = dispatchList.value.findIndex((d) => d.status === 'queued')
  if (idx < 0) {
    uni.showToast({ title: '当前没有 queued 状态的派车单', icon: 'none' })
    return
  }
  const updated: DispatchMock = { ...dispatchList.value[idx], status: 'entering' }
  dispatchList.value = [
    ...dispatchList.value.slice(0, idx),
    updated,
    ...dispatchList.value.slice(idx + 1),
  ]
  uni.showToast({ title: '🚪 道闸已开闸,车辆进入', icon: 'success' })
}

/**
 * v0.3.0-M2.2：演示控制台触发"模拟完成"事件
 *  - 找到第一条 status='driver_confirmed' 或最新完成中转 → 直接置 completed
 *  - 也支持跳过中间态：找到 leaving/in_transit 一路强行打 complete
 */
function handleDemoTriggerComplete() {
  // 优先找可完成状态：driver_confirmed / in_transit / leaving 任选第一条
  const candidates = ['driver_confirmed', 'in_transit', 'leaving', 'loading']
  const idx = dispatchList.value.findIndex((d) => candidates.includes(d.status))
  if (idx < 0) {
    uni.showToast({ title: '当前没有可完成的派车单', icon: 'none' })
    return
  }
  const updated: DispatchMock = { ...dispatchList.value[idx], status: 'completed' }
  dispatchList.value = [
    ...dispatchList.value.slice(0, idx),
    updated,
    ...dispatchList.value.slice(idx + 1),
  ]
  uni.showToast({ title: '✅ 订单完成', icon: 'success' })
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
  // 角色进入即重置 activeTab(防御性兜底:从业务员/公司切回司机时也保证回到工作台首屏)
  uiStore.resetForRole('driver')
  loadDispatchList()
  // v0.3.0-M2.2：演示控制台事件监听
  window.addEventListener('demo-trigger-gate', handleDemoTriggerGate)
  window.addEventListener('demo-trigger-complete', handleDemoTriggerComplete)
})

onUnmounted(() => {
  window.removeEventListener('demo-trigger-gate', handleDemoTriggerGate)
  window.removeEventListener('demo-trigger-complete', handleDemoTriggerComplete)
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
        @queue="handleScanQueue"
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

    <!-- 底部 TabBar（5 Tab 切换）统一走 <MobileTabBar> -->
    <MobileTabBar
      :items="[
        { key: 'workbench', label: '工作台', icon: '/static/icons/dashboard.svg' },
        { key: 'orders', label: '派车单', icon: '/static/icons/list.svg' },
        { key: 'messages', label: '消息', icon: '/static/icons/bell.svg' },
        { key: 'gps', label: 'GPS', icon: '/static/icons/pin.svg' },
        { key: 'me', label: '我的', icon: '/static/icons/user.svg' },
      ]"
      :active-key="activeTab"
      @change="switchTab"
    />
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

/* ===== 底部 TabBar 样式已迁出到 <MobileTabBar> 公共组件 ===== */
</style>