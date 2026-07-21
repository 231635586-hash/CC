<script setup lang="ts">
/**
 * 华翔司机端 H5 - 主页面（v0.2.x Plan B + D-Fix-6 Tab 精简）
 *
 * 设计哲学（保留）：
 *  - 司机工作场景碎片化（可能 5 分钟看一次），减少页面跳转 = 减少操作摩擦
 *  - 3 个 Tab 横向并列（精简后），核心功能一屏可达
 *
 * Plan B 架构（v0.2.x）：
 *  - index.vue 退化为 router + state hub
 *    · 共享状态：dispatchList / notifications / position / yards
 *    · 跨 Tab 业务方法：markMessageRead / ... (D-Fix-10: navigateToYard 已删除)
 *    · TabBar（3 项精简后）
 *  - 3 个 Tab 拆为 tabs/*.vue 子组件，各自管自己内部的 sub-tab / filter 等 UI state
 *  - Tab 级别 UI state（orderSubTab / msgFilter）提到 uiStore
 *    · 切走再切回不重置（之前 v-if 会销毁 ref）
 *
 * D-Fix-6 Tab 精简（commit 待提交）：
 *  - 移除工作台 Tab（移到业务员端 — D-Fix-7）
 *  - 移除 GPS Tab（GPS 自动到货 watcher 保留，仅 UI 移除）
 *  - 司机核心流程：派车单 + 消息 + 我的
 *
 * 派车单业务简化（v0.2.x）：
 *  - 司机无接单/拒单操作，dispatcher 派车即默认接单
 *  - status='dispatched' 的卡只显示 [导航前往园区] 按钮
 *  - dispatched → entering 由 GPS 自动检测触发
 *
 * token：src/App.vue 全局 CSS variables
 * mock：src/mock/dispatches.ts
 * 字典：src/constants/dispatchStatus.ts
 * store：src/stores/driver.ts + src/stores/ui.ts
 */

import { onLoad, onPullDownRefresh } from '@dcloudio/uni-app'
import { ref, computed, onUnmounted, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { useDriverStore } from '@/stores/driver'
import { useUiStore } from '@/stores/ui'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { MOCK_DRIVERS, DEFAULT_DRIVER } from '@/mock/drivers'
import { MOCK_YARDS } from '@/constants/yards'
import { getCurrentPosition, detectYard, detectCustomerAddress, distanceM, type Position } from '@/utils/location'
import { startGpsWatcher, stopGpsWatcher, isGpsWatcherRunning } from '@/utils/gpsWatcher'
import type { TabKey, NotificationItem, Yard } from '@/types/driver'
import MobileTabBar from '@/components/MobileTabBar.vue'
import AppSkeleton from '@/components/AppSkeleton.vue'

// 子组件（D-Fix-6：精简为 3 Tab,移除 WorkbenchTab + GpsTab）
import OrdersTab from './tabs/OrdersTab.vue'
import MessagesTab from './tabs/MessagesTab.vue'
import MeTab from './tabs/MeTab.vue'

// ===== Pinia =====
const driverStore = useDriverStore()
const uiStore = useUiStore()
const { activeTab } = storeToRefs(uiStore)

// ===== 共享状态 =====
const dispatchList = ref<DispatchMock[]>([])
const position = ref<{ lng: number; lat: number; accuracyM: number } | null>(null)
const loading = ref(false)

const yards: Yard[] = MOCK_YARDS

const notifications = ref<NotificationItem[]>([
  { id: 'n1', type: 'loading', title: '通知装货', content: '秦壁园区已开始装货，请保持手机畅通', time: '14:00', timestamp: Date.now() - 30 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n2', type: 'depart', title: '可出发了', content: '您的派车单已派车，请尽快出发前往秦壁园区', time: '13:30', timestamp: Date.now() - 60 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n3', type: 'arrive', title: '已入园', content: '车辆已进入秦壁园区，库房已准备装货', time: '13:45', timestamp: Date.now() - 45 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n4', type: 'complete', title: '装货完成', content: '派车单 DC20260625008 已装货完成，等待出厂', time: '昨天 16:30', timestamp: Date.now() - 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-008' },
  { id: 'n5', type: 'cancel', title: '订单取消', content: '派车单 DC20260622001 已取消，无需前往', time: '06-22 14:00', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-001' },
])

// ===== O7-A：Header 副标题 KPI 数据 + 通知未读数 =====
const driverTodayCount = computed(() =>
  dispatchList.value.filter((d) =>
    ['dispatched', 'queued', 'entering', 'loading', 'leaving', 'in_transit', 'arrived', 'driver_confirmed'].includes(d.status),
  ).length,
)
const driverCompletedCount = computed(() =>
  dispatchList.value.filter((d) => d.status === 'completed').length,
)
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

/** O7-A：搜索图标点击 → 切到派车单 Tab（mock 阶段简易跳转） */
function goSearch() {
  switchTab('orders')
}

/** O7-A：通知图标点击 → 切到消息 Tab */
function goNotifications() {
  switchTab('messages')
}

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

// ===== 跨 Tab 操作 =====
function switchTab(tab: TabKey) {
  uiStore.setActiveTab(tab)
}

function goDetail(item: DispatchMock) {
  uni.navigateTo({ url: `/pages/driver/order-detail/index?id=${item.id}` })
}

// =============================================================
// P0-2：GPS 自动到货（in_transit → arrived）
// =============================================================
//
// 设计：
//  - 单例 watcher（utils/gpsWatcher.ts）扫描所有 in_transit + dispatched 派车单
//  - 每 30s tick 一次，分类处理：
//    * in_transit + customerSite：距离 ≤200m → 自动 arrived（一次性事件）
//    * dispatched + yardIds：距离 ≤300m → 自动写 gpsArrivedAt（提示事件，不改 status）
//  - arrived 后 stop watcher；gpsArrivedAt 写入后不 stop（持续检测，仍可能继续触发后续事件）
//
/**
 * GPS tick 回调：扫描 dispatchList 中所有需要检测的派车单
 *  - in_transit：距离客户地址 ≤200m → arrived
 *  - dispatched：距离园区 ≤300m → 写 gpsArrivedAt（不改 status）
 */
async function handleGpsTick(position: Position) {
  // 1) P0-2：in_transit 派车单 → 客户地址到达检测
  const inTransitList = dispatchList.value.filter((d) => d.status === 'in_transit' && d.customerSite)
  for (const item of inTransitList) {
    if (!item.customerSite) continue
    if (detectCustomerAddress(position, item.customerSite)) {
      const now = new Date().toISOString()
      const idx = dispatchList.value.findIndex((d) => d.id === item.id)
      if (idx < 0) continue
      const updated: DispatchMock = {
        ...dispatchList.value[idx],
        status: 'arrived',
        arrivedByGpsAt: now,
        arrivedByGpsLocation: { lng: position.lng, lat: position.lat },
      }
      dispatchList.value = [
        ...dispatchList.value.slice(0, idx),
        updated,
        ...dispatchList.value.slice(idx + 1),
      ]
      const mockIdx = MOCK_DISPATCHES.findIndex((d) => d.id === item.id)
      if (mockIdx >= 0) {
        MOCK_DISPATCHES[mockIdx].status = 'arrived'
        MOCK_DISPATCHES[mockIdx].arrivedByGpsAt = now
        MOCK_DISPATCHES[mockIdx].arrivedByGpsLocation = { lng: position.lng, lat: position.lat }
      }
      uni.showToast({ title: '📍 已到达客户地址', icon: 'success' })
      driverStore.pushNotification({
        id: `n-${item.id}-arrived-${Date.now()}`,
        type: 'arrived_prompt',
        title: '已到达客户地址',
        content: `${item.dispatchNo} 已到达 ${item.customerName}，请拍照确认到货`,
        time: new Date().toTimeString().slice(0, 5),
        timestamp: Date.now(),
        read: false,
        dispatchId: item.id,
      })
      stopGpsWatcher()
      return
    }
  }

  // 2) P0-5：dispatched 派车单 → 园区到达检测（不跳 status）
  const dispatchedList = dispatchList.value.filter((d) => d.status === 'dispatched' && d.yardIds?.length)
  for (const item of dispatchedList) {
    if (!item.yardIds?.length) continue
    // 已写过 gpsArrivedAt → 跳过（一事件一写）
    if (item.gpsArrivedAt) continue
    // 找第一个匹配的园区
    for (const yardId of item.yardIds) {
      const yard = yards.find((y) => y.id === yardId)
      if (!yard) continue
      const radius = yard.radiusM ?? 300
      if (distanceM(position, { lng: yard.lng, lat: yard.lat }) <= radius) {
        const now = new Date().toISOString()
        // 1) 写本地 dispatchList
        const idx = dispatchList.value.findIndex((d) => d.id === item.id)
        if (idx < 0) continue
        const updated: DispatchMock = {
          ...dispatchList.value[idx],
          gpsArrivedAt: now,
        }
        dispatchList.value = [
          ...dispatchList.value.slice(0, idx),
          updated,
          ...dispatchList.value.slice(idx + 1),
        ]
        // 2) 同步 MOCK_DISPATCHES
        const mockIdx = MOCK_DISPATCHES.findIndex((d) => d.id === item.id)
        if (mockIdx >= 0) MOCK_DISPATCHES[mockIdx].gpsArrivedAt = now
        // 3) toast 提示（不跳 status，仅记录时间）
        uni.showToast({
          title: `📍 已到达 ${yard.name} 园区，可扫码排队`,
          icon: 'none',
          duration: 2500,
        })
        // 4) 推送消息（不强制）
        driverStore.pushNotification({
          id: `n-${item.id}-yard-${Date.now()}`,
          type: 'arrived_prompt',
          title: `已到达 ${yard.name} 园区`,
          content: `${item.dispatchNo} GPS 已到达园区，请尽快扫码排队`,
          time: new Date().toTimeString().slice(0, 5),
          timestamp: Date.now(),
          read: false,
          dispatchId: item.id,
        })
        // 5) 不 stop watcher（dispatched 派车单可能有多条，仍持续检测直到 in_transit）
        break
      }
    }
  }
}

/**
 * 启动 GPS watcher（P0-5 扩展：检测 in_transit + dispatched 两类派车单）
 *  - in_transit：客户地址到达检测（一次性事件，触发后 stop）
 *  - dispatched：园区到达检测（持续事件，提示但不跳状态）
 *  - 启动条件：dispatchList 中存在 in_transit 或 dispatched 状态的派车单
 *  - onUnmounted 会 stop（避免泄漏）
 */
function startArrivalWatcher() {
  const hasTarget = dispatchList.value.some(
    (d) => (d.status === 'in_transit' && d.customerSite) || (d.status === 'dispatched' && d.yardIds?.length)
  )
  if (!hasTarget) return
  startGpsWatcher({
    onTick: handleGpsTick,
    intervalMs: 30000,
    immediate: true,
  })
}

// D-Fix-10：navigateToYard 函数已删除（司机端不需要导航功能）

function markMessageRead(n: NotificationItem) {
  n.read = true
  // D-Fix-6：司机端移除 GpsTab 后,消息点击改为跳派车单详情
  if (n.type === 'loading' || n.type === 'depart' || n.type === 'arrive' || n.type === 'complete') {
    const d = dispatchList.value.find((x) => x.id === n.dispatchId)
    if (d) goDetail(d)
    else uiStore.setActiveTab('orders')
  }
}

/**
 * v0.3.0-M2.2 + P0-4：司机点 [扫码排队] → 弹 modal 三选一
 *  - 选 0：uni.scanCode 真实扫码（真机有效，桌面浏览器 catch）
 *  - 选 1：uni.showModal 输入园区 ID（手动输入兑底）
 *  - 选 2：自动 mock（演示用，直接用 dispatch.yardIds[0]）
 *  - 三条路径都汇入 applyQueueTransition，最终 dispatched → queued + recordQueue + toast
 *  - 注意：H5 与 PC 端不共享 localStorage（mobile-h5 独立 demo），仅本地状态变更
 */
function handleScanQueue(item: DispatchMock) {
  const idx = dispatchList.value.findIndex((d) => d.id === item.id)
  if (idx < 0) {
    uni.showToast({ title: '派车单不存在', icon: 'none' })
    return
  }
  // 防御：已进入 queued/entering/loading 等后续状态时直接 toast 跳过，避免重复 recordQueue
  if (['queued', 'entering', 'loading', 'leaving', 'in_transit', 'arrived', 'completed'].includes(dispatchList.value[idx].status)) {
    uni.showToast({ title: `当前状态 ${dispatchList.value[idx].status}，无需重复扫码`, icon: 'none' })
    return
  }
  uni.showActionSheet({
    itemList: ['📷 扫码园区二维码', '⌨️ 输入园区 ID', '🎬 自动 mock（演示）'],
    success: (res: any) => {
      if (res.tapIndex === 0) {
        // 路径 1：真实扫码
        uni.scanCode({
          scanType: ['qrCode'],
          success: (scanRes: any) => {
            const yardId = parseYardId(scanRes.result)
            if (yardId) {
              applyQueueTransition(item, yardId, '扫码')
            } else {
              uni.showToast({ title: '无法识别的二维码', icon: 'none' })
            }
          },
          fail: () => {
            uni.showToast({ title: '扫码失败,请用【输入 ID】或【自动 mock】', icon: 'none' })
          },
        })
      } else if (res.tapIndex === 1) {
        // 路径 2：手动输入
        uni.showModal({
          title: '输入园区 ID',
          editable: true,
          placeholderText: '例如 mock-yard-001',
          success: (modalRes: any) => {
            if (modalRes.confirm && modalRes.content) {
              const yardId = parseYardId(modalRes.content.trim())
              if (yardId) {
                applyQueueTransition(item, yardId, '输入')
              } else {
                uni.showToast({ title: '园区 ID 格式错误', icon: 'none' })
              }
            }
          },
        })
      } else if (res.tapIndex === 2) {
        // 路径 3：自动 mock 兑底
        const yardId = item.yardIds?.[0]
        if (!yardId) {
          uni.showToast({ title: '无主园区', icon: 'none' })
          return
        }
        applyQueueTransition(item, yardId, '自动 mock')
      }
    },
  })
}

/**
 * v0.3.0-M2.2 + P0-4 + P0-5：扫码/输入的统一处理（parking transition）
 *  - 改 dispatch.status = 'queued'
 *  - P0-5：写 queuedAt（扫码排队时间，对齐 Web 端 YardTimeline.queuedAt）
 *  - 同步 MOCK_DISPATCHES
 *  - 调 driverStore.recordQueue
 *  - toast 提示
 */
function applyQueueTransition(item: DispatchMock, yardId: string, source: string) {
  const idx = dispatchList.value.findIndex((d) => d.id === item.id)
  if (idx < 0) return
  const now = new Date().toISOString()
  const updated: DispatchMock = {
    ...dispatchList.value[idx],
    status: 'queued',
    queuedAt: now,
  }
  dispatchList.value = [
    ...dispatchList.value.slice(0, idx),
    updated,
    ...dispatchList.value.slice(idx + 1),
  ]
  // 同步 MOCK_DISPATCHES
  const mockIdx = MOCK_DISPATCHES.findIndex((d) => d.id === item.id)
  if (mockIdx >= 0) {
    MOCK_DISPATCHES[mockIdx].status = 'queued'
    MOCK_DISPATCHES[mockIdx].queuedAt = now
  }
  // 写 store 的 queueHistory（M2 兼容保留）
  const yard = yards.find((y) => y.id === yardId)
  driverStore.recordQueue(yardId, yard?.name || yardId, `scan-${source}-${Date.now()}`)
  uni.showToast({ title: `📱 ${source}成功,排队中`, icon: 'success' })
}

/**
 * v0.3.0-M2.2 + P0-4：解析园区 ID
 *  - 支持 3 种格式：
 *    1. yard://mock-yard-001（标准 URI 形式）
 *    2. mock-yard-001（裸 ID）
 *    3. https://xxx.com/?yardId=mock-yard-001（URL query 形式）
 *  - 返回 null 表示无法解析
 */
function parseYardId(raw: string): string | null {
  if (!raw) return null
  const trimmed = raw.trim()
  // 1) yard://yardId 形式
  if (trimmed.startsWith('yard://')) {
    const id = trimmed.slice('yard://'.length).split('?')[0].trim()
    return id || null
  }
  // 2) URL 形式（https://...?yardId=xxx）
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    try {
      const url = new URL(trimmed)
      const id = url.searchParams.get('yardId')
      return id?.trim() || null
    } catch {
      return null
    }
  }
  // 3) 裸 ID（mock-yard-001 等）
  if (/^[A-Za-z0-9_-]+$/.test(trimmed)) {
    return trimmed
  }
  return null
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
  uni.showToast({ title: '已全部标记为已读', icon: 'success' })
}

/**
 * v0.3.0-M2.2 + P0-5：演示控制台触发"模拟道闸放行"事件
 *  - 库房选择通知入场后等于下发道闸系统该车辆允许入场
 *  - 入场时间记录为通过道闸的时间（mock 阶段 = 演示按钮点击时间）
 *  - 找到第一条 status='queued' 的派车单 → queued → entering + 写 enteredAt
 *  - H5 mock：本地生效（无 PC 后端通信）；真实阶段库房员 Web 端通过 WebSocket 通知 H5
 */
function handleDemoTriggerGate() {
  const idx = dispatchList.value.findIndex((d) => d.status === 'queued')
  if (idx < 0) {
    uni.showToast({ title: '当前没有 queued 状态的派车单', icon: 'none' })
    return
  }
  const now = new Date().toISOString()
  const updated: DispatchMock = {
    ...dispatchList.value[idx],
    status: 'entering',
    enteredAt: now,
  }
  dispatchList.value = [
    ...dispatchList.value.slice(0, idx),
    updated,
    ...dispatchList.value.slice(idx + 1),
  ]
  // 同步 MOCK_DISPATCHES
  const mockIdx = MOCK_DISPATCHES.findIndex((d) => d.id === dispatchList.value[idx].id)
  if (mockIdx >= 0) {
    MOCK_DISPATCHES[mockIdx].status = 'entering'
    MOCK_DISPATCHES[mockIdx].enteredAt = now
  }
  uni.showToast({ title: '🚪 道闸已开闸,车辆进入', icon: 'success' })
}

/**
 * v0.3.0-M2.2 + P0-3：演示控制台触发"模拟完成"事件
 *  - 找到第一条 status='driver_confirmed' 或最新完成中转 → 直接置 completed
 *  - 也支持跳过中间态：找到 leaving/in_transit 一路强行打 complete
 *  - P0-3 扩展：arrived 状态也可被演示推进（GPS 已自动到货，待手动拍照）
 */
function handleDemoTriggerComplete() {
  // 优先找可完成状态：arrived / driver_confirmed / in_transit / leaving / loading 任选第一条
  const candidates = ['arrived', 'driver_confirmed', 'in_transit', 'leaving', 'loading']
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

// D-Fix-10：openNavi 函数已删除（司机端不需要导航功能）

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

// P0-2：监听 dispatchList 变化，自动启动/停止 GPS watcher
// P0-5：watch dispatchList 状态变化，自动启动/停止 GPS watcher
//  - 启动条件：存在 in_transit（含 customerSite）或 dispatched（含 yardIds）的派车单
//  - 停止条件：以上都不存在（已全部 arrived / completed / 等）
watch(
  () => dispatchList.value.map((d) => `${d.id}:${d.status}`).join(','),
  () => {
    const hasTarget = dispatchList.value.some(
      (d) => (d.status === 'in_transit' && d.customerSite) || (d.status === 'dispatched' && d.yardIds?.length)
    )
    const watcherRunning = isGpsWatcherRunning()
    if (hasTarget && !watcherRunning) {
      startArrivalWatcher()
    } else if (!hasTarget && watcherRunning) {
      stopGpsWatcher()
    }
  },
)

onUnmounted(() => {
  window.removeEventListener('demo-trigger-gate', handleDemoTriggerGate)
  window.removeEventListener('demo-trigger-complete', handleDemoTriggerComplete)
  // P0-2：清理 GPS watcher，避免泄漏
  stopGpsWatcher()
})

onPullDownRefresh(async () => {
  await loadDispatchList()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page">
    <!-- 顶部状态栏 + Header（5 Tab 共享）-->
    <view class="status-bar"></view>
    <!-- O7-A：顶部 Header 重设计（参考截图：左侧大头像 + 欢迎语 + 副标题 + 右侧搜索+通知） -->
    <view class="header">
      <view class="header-top">
        <view class="header-left">
          <view class="welcome-avatar">
            <text>{{ driverStore.currentDriver?.name?.charAt(0) || '司' }}</text>
          </view>
          <view class="welcome">
            <text class="welcome-hi">{{ getGreeting() }},{{ driverStore.currentDriver?.name || '司机' }}</text>
            <view class="welcome-sub-row">
              <text class="welcome-sub-label">今日</text>
              <text class="welcome-sub-num">{{ driverTodayCount }}</text>
              <text class="welcome-sub-divider">·</text>
              <text class="welcome-sub-label">已完成</text>
              <text class="welcome-sub-num success">{{ driverCompletedCount }}</text>
            </view>
          </view>
        </view>
        <view class="header-right">
          <view class="header-icon-btn" @click="goSearch">
            <text class="header-icon-text">🔍</text>
          </view>
          <view class="header-icon-btn" @click="goNotifications">
            <text class="header-icon-text">🔔</text>
            <view v-if="unreadCount > 0" class="header-icon-badge">{{ unreadCount }}</view>
          </view>
        </view>
      </view>
    </view>

    <!-- Tab 内容区 -->
    <view class="content">
      <AppSkeleton v-if="loading && dispatchList.length === 0" type="list" :count="3" />
      <OrdersTab
        v-else-if="activeTab === 'orders'"
        :dispatch-list="dispatchList"
        @go-detail="goDetail"
        @queue="handleScanQueue"
      />
      <MessagesTab
        v-else-if="activeTab === 'messages'"
        :notifications="notifications"
        @mark-read="markMessageRead"
        @mark-all-read="markAllRead"
      />
      <MeTab
        v-else-if="activeTab === 'me'"
        @switch-driver="showDriverSwitcher"
        @toast="(msg: string) => uni.showToast({ title: msg, icon: 'none' })"
      />
    </view>

    <!-- 底部 TabBar（D-Fix-6：3 Tab,移除 workbench + gps） -->
    <MobileTabBar
      :items="[
        { key: 'orders', label: '派车单', icon: '/static/icons/list.svg' },
        { key: 'messages', label: '消息', icon: '/static/icons/bell.svg' },
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

/* ===== 顶部 Header（5 Tab 共享，O7-A 重设计）===== */
.header {
  background: var(--color-brand);
  padding: var(--space-md) var(--space-md) var(--space-md);
  color: var(--color-text-on-brand);
}
.header-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: var(--space-md);
}
.header-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  flex: 1;
  min-width: 0;
}
.welcome {
  display: flex;
  flex-direction: column;
  min-width: 0;
  flex: 1;
}
.welcome-hi {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  opacity: 0.95;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.welcome-sub-row {
  display: flex;
  align-items: baseline;
  gap: 4rpx;
  margin-top: 4rpx;
  font-size: var(--font-size-caption);
  opacity: 0.85;
}
.welcome-sub-label {
  opacity: 0.8;
}
.welcome-sub-num {
  font-weight: var(--font-weight-bold);
  opacity: 1;
  font-family: var(--font-family-mono);
}
.welcome-sub-num.success {
  color: #b7eb8f;
}
.welcome-sub-divider {
  opacity: 0.5;
  margin: 0 4rpx;
}
.welcome-avatar {
  /* O7-A：左头大头像（80rpx → 96rpx，更醒目） */
  width: 96rpx;
  height: 96rpx;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.25);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}

/* ===== O7-A：右侧操作图标区（搜索 + 通知）===== */
.header-right {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  flex-shrink: 0;
}
.header-icon-btn {
  position: relative;
  width: 64rpx;
  height: 64rpx;
  border-radius: var(--radius-md);
  background: rgba(255, 255, 255, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background var(--motion-fast) var(--ease-out-quart);
}
.header-icon-btn:active {
  background: rgba(255, 255, 255, 0.3);
}
.header-icon-text {
  font-size: 32rpx;
  color: var(--color-text-on-brand);
  line-height: 1;
}
.header-icon-badge {
  position: absolute;
  top: -4rpx;
  right: -4rpx;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  border-radius: 16rpx;
  background: #ff4d4f;
  color: white;
  font-size: var(--font-size-mini);
  font-weight: var(--font-weight-bold);
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  box-shadow: 0 0 0 4rpx var(--color-brand);
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