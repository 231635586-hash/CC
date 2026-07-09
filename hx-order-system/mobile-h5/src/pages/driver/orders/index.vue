<script setup lang="ts">
/**
 * 华翔司机端 H5 - 单页多功能（5 Tab 集成）
 *
 * 设计哲学：
 *  - 司机工作场景碎片化（可能 5 分钟看一次），减少页面跳转 = 减少操作摩擦
 *  - 5 个 Tab 横向并列，所有功能一屏可达
 *  - 派车单列表点条目 → 跳详情页（保留原详情页功能完整性）
 *  - 返回时状态自动保留（uni-app 原生行为）
 *
 * 架构：
 *  - token：src/App.vue 全局 CSS variables
 *  - mock：src/mock/dispatches.ts
 *  - 字典：src/constants/dispatchStatus.ts
 *  - 组件：src/components/EmptyState.vue
 *  - store：src/stores/driver.ts
 *
 * 5 个 Tab：
 *  ① 工作台（默认） - 欢迎 + 4 维统计 + 当前进行中 + 最近轨迹
 *  ② 派车单       - 3 子 Tab（进行中/待出发/已完成）+ 接单/拒单
 *  ③ 消息         - 时间分组（今天/昨天/更早）+ 未读标 + 一键已读
 *  ④ GPS          - 入园/离厂子页 + 实时定位 + 距离判定
 *  ⑤ 我的         - 司机信息 + 切换司机
 */

import { onLoad, onShow, onPullDownRefresh } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { useDriverStore } from '@/stores/driver'
import { MOCK_DISPATCHES, type DispatchMock, type DispatchStatus } from '@/mock/dispatches'
import { DISPATCH_STATUS_MAP, ACTIVE_STATUSES, PENDING_STATUSES, DONE_STATUSES } from '@/constants/dispatchStatus'
import { getCurrentPosition, detectYard } from '@/utils/location'
import EmptyState from '@/components/EmptyState.vue'

// ===== 类型 =====
type TabKey = 'workbench' | 'orders' | 'messages' | 'gps' | 'me'
type OrderSubTab = 'active' | 'pending' | 'done'
type GpsSubTab = 'in' | 'out'
type NotificationType = 'depart' | 'loading' | 'arrive' | 'complete' | 'cancel'

interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  content: string
  time: string
  timestamp: number
  read: boolean
  dispatchId?: string
}

interface Yard {
  id: string
  name: string
  lng: number
  lat: number
  radiusM: number
}

// ===== 状态 =====
const driverStore = useDriverStore()

const activeTab = ref<TabKey>('workbench')
const orderSubTab = ref<OrderSubTab>('active')
const msgFilter = ref<'all' | 'unread' | 'yard'>('all')
const gpsSubTab = ref<GpsSubTab>('in')

const dispatchList = ref<DispatchMock[]>([])
const position = ref<{ lng: number; lat: number; accuracyM: number } | null>(null)
const detectedYard = ref<Yard | null>(null)
const loading = ref(false)

const yards: Yard[] = [
  { id: 'mock-yard-001', name: '秦壁', lng: 111.513, lat: 36.081, radiusM: 300 },
  { id: 'mock-yard-002', name: '甘亭', lng: 111.612, lat: 36.156, radiusM: 300 },
]

const notifications = ref<NotificationItem[]>([
  { id: 'n1', type: 'loading', title: '通知装货', content: '秦壁园区已开始装货，请保持手机畅通', time: '14:00', timestamp: Date.now() - 30 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n2', type: 'depart', title: '可出发了', content: '您的派车单已派车，请尽快出发前往秦壁园区', time: '13:30', timestamp: Date.now() - 60 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n3', type: 'arrive', title: '已入园', content: '车辆已进入秦壁园区，库房已准备装货', time: '13:45', timestamp: Date.now() - 45 * 60 * 1000, read: false, dispatchId: 'mock-dispatch-012' },
  { id: 'n4', type: 'complete', title: '装货完成', content: '派车单 DC20260625008 已装货完成，等待出厂', time: '昨天 16:30', timestamp: Date.now() - 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-008' },
  { id: 'n5', type: 'cancel', title: '订单取消', content: '派车单 DC20260622001 已取消，无需前往', time: '06-22 14:00', timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000, read: true, dispatchId: 'mock-dispatch-001' },
])

// ===== 计算属性 =====
// 工作台统计
const wbStats = computed(() => ({
  total: dispatchList.value.length,
  active: dispatchList.value.filter((d) => ACTIVE_STATUSES.includes(d.status)).length,
  pending: dispatchList.value.filter((d) => PENDING_STATUSES.includes(d.status)).length,
  done: dispatchList.value.filter((d) => DONE_STATUSES.includes(d.status)).length,
}))

// 当前进行中（用于工作台"当前任务卡"）
const currentActive = computed(() => {
  return dispatchList.value.find((d) => ACTIVE_STATUSES.includes(d.status))
})

// 最近轨迹（mock：取最近 5 个状态节点）
const recentTimeline = computed(() => {
  const cur = currentActive.value
  if (!cur) return []
  return [
    { time: '14:30', status: 'loading', label: '正在装货' },
    { time: '13:45', status: 'entering', label: '已入园' },
    { time: '13:30', status: 'dispatched', label: '已派车出发' },
    { time: '13:00', status: 'confirmed', label: '已确认受理' },
    { time: '12:30', status: 'pending', label: '订单待确认' },
  ]
})

// 派车单分组
const activeList = computed(() => dispatchList.value.filter((d) => ACTIVE_STATUSES.includes(d.status)))
const pendingList = computed(() => dispatchList.value.filter((d) => PENDING_STATUSES.includes(d.status)))
const doneList = computed(() => dispatchList.value.filter((d) => DONE_STATUSES.includes(d.status)))

const currentOrderList = computed(() => {
  if (orderSubTab.value === 'active') return activeList.value
  if (orderSubTab.value === 'pending') return pendingList.value
  return doneList.value
})

const orderSubTabs = computed(() => [
  { key: 'active', label: '进行中', count: activeList.value.length },
  { key: 'pending', label: '待出发', count: pendingList.value.length },
  { key: 'done', label: '已完成', count: doneList.value.length },
])

// 消息分组
const unreadCount = computed(() => notifications.value.filter((n) => !n.read).length)

const filteredMessages = computed(() => {
  if (msgFilter.value === 'unread') return notifications.value.filter((n) => !n.read)
  if (msgFilter.value === 'yard') return notifications.value.filter((n) => ['depart', 'loading', 'arrive', 'complete'].includes(n.type))
  return notifications.value
})

const groupedMessages = computed(() => {
  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '更早', items: [] },
  ]
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  filteredMessages.value.forEach((n) => {
    const diff = now - n.timestamp
    if (diff < oneDay) groups[0].items.push(n)
    else if (diff < 2 * oneDay) groups[1].items.push(n)
    else groups[2].items.push(n)
  })
  return groups.filter((g) => g.items.length > 0)
})

// GPS 距离
const nearestYard = computed(() => {
  if (!position.value) return null
  let nearest: { yard: Yard; distanceM: number } | null = null
  yards.forEach((y) => {
    const d = distanceM(position.value!.lng, position.value!.lat, y.lng, y.lat)
    if (!nearest || d < nearest.distanceM) nearest = { yard: y, distanceM: d }
  })
  return nearest
})

// ===== 工具函数 =====
function distanceM(lng1: number, lat1: number, lng2: number, lat2: number): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatTime(iso: string): string {
  if (!iso) return '-'
  const d = new Date(iso.replace(' ', 'T'))
  const now = new Date()
  const diff = now.getTime() - d.getTime()
  const day = 86400000
  if (diff < day) {
    return `今天 ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`
  }
  if (diff < day * 2) return '昨天'
  if (diff < day * 7) return `${Math.floor(diff / day)}天前`
  return `${d.getMonth() + 1}月${d.getDate()}日`
}

function formatDistance(m: number): string {
  if (m < 1000) return `${Math.round(m)} m`
  return `${(m / 1000).toFixed(2)} km`
}

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

const msgTypeIcon = (type: NotificationType): { icon: string; bg: string } => {
  const map: Record<NotificationType, { icon: string; bg: string }> = {
    depart: { icon: '/static/icons/depart.svg', bg: 'var(--color-status-pending-bg)' },
    loading: { icon: '/static/icons/package.svg', bg: 'var(--color-status-loading-bg)' },
    arrive: { icon: '/static/icons/arrived.svg', bg: 'var(--color-status-entering-bg)' },
    complete: { icon: '/static/icons/done.svg', bg: 'var(--color-status-completed-bg)' },
    cancel: { icon: '/static/icons/cancel.svg', bg: 'var(--color-status-cancelled-bg)' },
  }
  return map[type]
}

// ===== 操作 =====
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
  if (gpsSubTab.value === 'in') {
    detectedYard.value = detected || null
  } else {
    // out：已离开 = !detected
    detectedYard.value = detected
  }
}

function switchTab(tab: TabKey) {
  activeTab.value = tab
  if (tab === 'gps') refreshGps()
}

function goDetail(item: DispatchMock) {
  uni.navigateTo({ url: `/pages/driver/order-detail/index?id=${item.id}` })
}

function acceptDispatch(item: DispatchMock) {
  uni.showModal({
    title: '确认接单',
    content: `${item.dispatchNo} - ${item.yardNames.join('、')}园区 - ${item.customerName}`,
    success: (res) => {
      if (res.confirm) {
        item.status = 'entering' as DispatchStatus
        uni.showToast({ title: '已确认接单', icon: 'success' })
      }
    },
  })
}

function rejectDispatch(item: DispatchMock) {
  uni.showModal({
    title: '无法前往',
    content: `确认放弃 ${item.dispatchNo}？放弃后将通知调度员重新派车`,
    confirmText: '确认放弃',
    confirmColor: '#ff4d4f',
    success: (res) => {
      if (res.confirm) {
        item.status = 'cancelled' as DispatchStatus
        uni.showToast({ title: '已通知调度员', icon: 'none' })
      }
    },
  })
}

function markMessageRead(n: NotificationItem) {
  n.read = true
  // 真实阶段：根据 type 跳转
  if (n.type === 'depart' || n.type === 'arrive') {
    activeTab.value = 'gps'
    gpsSubTab.value = 'in'
    refreshGps()
  } else if (n.type === 'loading') {
    const d = dispatchList.value.find((x) => x.id === n.dispatchId)
    if (d) goDetail(d)
  } else if (n.type === 'complete') {
    activeTab.value = 'gps'
    gpsSubTab.value = 'out'
    refreshGps()
  }
}

function markAllRead() {
  notifications.value.forEach((n) => (n.read = true))
  uni.showToast({ title: '已全部标记为已读', icon: 'success' })
}

function showDriverSwitcher() {
  uni.showActionSheet({
    itemList: ['陈大壮', '李建国', '赵铁柱', '王大锤'],
    success: (res: any) => {
      const drivers = [
        { id: 'mock-driver-001', name: '陈大壮', phone: '13812345678' },
        { id: 'mock-driver-002', name: '李建国', phone: '13987654321' },
        { id: 'mock-driver-003', name: '赵铁柱', phone: '13611112222' },
        { id: 'mock-driver-004', name: '王大锤', phone: '13733334444' },
      ]
      driverStore.setDriver(drivers[res.tapIndex])
      uni.showToast({ title: `已切换到${drivers[res.tapIndex].name}`, icon: 'none' })
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
onLoad(() => {
  if (!driverStore.currentDriver) {
    driverStore.setDriver({ id: 'mock-driver-002', name: '李建国', phone: '13987654321' })
  }
  loadDispatchList()
})

onShow(() => {})

onPullDownRefresh(async () => {
  await loadDispatchList()
  if (activeTab.value === 'gps') await refreshGps()
  uni.stopPullDownRefresh()
})
</script>

<template>
  <view class="page" :class="{ 'with-tabbar': true }">

    <!-- ============ 顶部状态栏 + Header（5 Tab 共享）============ -->
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

    <!-- ============ Tab 内容区（根据 activeTab 切换）============ -->
    <view class="content">

      <!-- ===== Tab 1: 工作台 ===== -->
      <view v-if="activeTab === 'workbench'" class="tab-pane">
        <!-- 4 维统计 -->
        <view class="wb-stats">
          <view class="wb-stat">
            <text class="wb-stat-num">{{ wbStats.total }}</text>
            <text class="wb-stat-label">总单数</text>
          </view>
          <view class="wb-stat highlight">
            <text class="wb-stat-num">{{ wbStats.active }}</text>
            <text class="wb-stat-label">进行中</text>
          </view>
          <view class="wb-stat">
            <text class="wb-stat-num">{{ wbStats.pending }}</text>
            <text class="wb-stat-label">待出发</text>
          </view>
          <view class="wb-stat success">
            <text class="wb-stat-num">{{ wbStats.done }}</text>
            <text class="wb-stat-label">已完成</text>
          </view>
        </view>

        <!-- 当前进行中卡片 -->
        <view v-if="currentActive" class="wb-current" @click="goDetail(currentActive)">
          <view class="wb-current-header">
            <text class="wb-current-label">当前进行中</text>
            <view :class="['status-tag', 'tag-' + DISPATCH_STATUS_MAP[currentActive.status].cssClass]">
              {{ DISPATCH_STATUS_MAP[currentActive.status].label }}
            </view>
          </view>
          <view class="wb-current-body">
            <text class="wb-current-no">{{ currentActive.dispatchNo }}</text>
            <view class="wb-current-info">
              <view class="info-line">
                <image class="info-line-icon" src="/static/icons/pin.svg" mode="aspectFit" />
                <text>{{ currentActive.yardNames.join('、') }} 园区</text>
              </view>
              <view class="info-line">
                <image class="info-line-icon" src="/static/icons/customer.svg" mode="aspectFit" />
                <text>{{ currentActive.customerName }}</text>
              </view>
              <view class="info-line">
                <image class="info-line-icon" src="/static/icons/clock.svg" mode="aspectFit" />
                <text>预计 {{ currentActive.expectedLoadTime }}</text>
              </view>
            </view>
          </view>
        </view>

        <!-- 最近轨迹 -->
        <view class="wb-section">
          <view class="wb-section-header">
            <text class="wb-section-title">最近轨迹</text>
          </view>
          <view class="timeline">
            <view v-for="(item, idx) in recentTimeline" :key="idx" class="timeline-item">
              <view class="timeline-dot" :class="item.status"></view>
              <view class="timeline-content">
                <text class="timeline-time">{{ item.time }}</text>
                <text class="timeline-label">{{ item.label }}</text>
              </view>
              <view v-if="idx !== recentTimeline.length - 1" class="timeline-line"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== Tab 2: 派车单 ===== -->
      <view v-if="activeTab === 'orders'" class="tab-pane">
        <!-- 子 Tab -->
        <view class="sub-tabs">
          <view
            v-for="t in orderSubTabs"
            :key="t.key"
            class="sub-tab"
            :class="{ active: orderSubTab === t.key }"
            @click="orderSubTab = t.key as OrderSubTab"
          >
            <text>{{ t.label }}</text>
            <text class="sub-tab-count">{{ t.count }}</text>
          </view>
        </view>

        <!-- 列表 -->
        <view class="list">
          <EmptyState
            v-if="currentOrderList.length === 0"
            icon="/static/icons/list.svg"
            :title="`暂无${orderSubTabs.find((t) => t.key === orderSubTab)?.label}的派车单`"
            desc="新派车单会显示在这里"
          />

          <view v-for="item in currentOrderList" :key="item.id" class="dispatch-card" @click="goDetail(item)">
            <view class="card-header">
              <text class="dispatch-no">{{ item.dispatchNo }}</text>
              <view :class="['status-tag', 'tag-' + DISPATCH_STATUS_MAP[item.status].cssClass]">
                {{ DISPATCH_STATUS_MAP[item.status].label }}
              </view>
            </view>

            <view class="card-body">
              <view class="info-row">
                <image class="info-icon" src="/static/icons/yard.svg" mode="aspectFit" />
                <text class="info-label">园区</text>
                <text class="info-value">{{ item.yardNames.join('、') }}</text>
              </view>
              <view class="info-row">
                <image class="info-icon" src="/static/icons/customer.svg" mode="aspectFit" />
                <text class="info-label">客户</text>
                <text class="info-value ellipsis">{{ item.customerName }}</text>
              </view>
              <view class="info-row">
                <image class="info-icon" src="/static/icons/goods.svg" mode="aspectFit" />
                <text class="info-label">货物</text>
                <text class="info-value ellipsis">{{ item.goodsSummary }}</text>
              </view>
            </view>

            <view class="card-footer">
              <view class="footer-left">
                <text class="time-text">{{ formatTime(item.expectedLoadTime) }}</text>
                <text class="direction-text">→ {{ item.direction }}</text>
              </view>
              <text class="arrow">›</text>
            </view>

            <view v-if="item.status === 'dispatched'" class="card-actions" @click.stop>
              <button class="btn-reject" @click="rejectDispatch(item)">无法前往</button>
              <button class="btn-accept" @click="acceptDispatch(item)">确认接单</button>
            </view>
          </view>

          <view v-if="currentOrderList.length > 0" class="load-more">
            <text class="load-more-text">{{ currentOrderList.length }} 条 · 已全部加载</text>
          </view>
        </view>
      </view>

      <!-- ===== Tab 3: 消息 ===== -->
      <view v-if="activeTab === 'messages'" class="tab-pane">
        <view class="msg-header">
          <view class="msg-filter-tabs">
            <view
              v-for="f in [
                { key: 'all', label: '全部' },
                { key: 'unread', label: '未读' },
                { key: 'yard', label: '库房通知' },
              ]"
              :key="f.key"
              class="msg-filter-tab"
              :class="{ active: msgFilter === f.key }"
              @click="msgFilter = f.key as any"
            >
              {{ f.label }}
            </view>
          </view>
          <text class="msg-mark-all" @click="markAllRead">全部已读</text>
        </view>

        <view class="list">
          <EmptyState v-if="filteredMessages.length === 0" icon="/static/icons/bell.svg" title="暂无消息" desc="库房推送会显示在这里" />

          <view v-for="group in groupedMessages" :key="group.label" class="msg-group">
            <view class="msg-group-header">
              <text class="msg-group-label">{{ group.label }}</text>
              <view class="msg-group-line"></view>
              <text class="msg-group-count">{{ group.items.length }}</text>
            </view>

            <view
              v-for="n in group.items"
              :key="n.id"
              class="msg-card"
              :class="{ unread: !n.read }"
              @click="markMessageRead(n)"
            >
              <view class="msg-icon-wrap" :style="{ background: msgTypeIcon(n.type).bg }">
                <image class="msg-icon-svg" :src="msgTypeIcon(n.type).icon" mode="aspectFit" />
              </view>
              <view class="msg-body">
                <view class="msg-top">
                  <text class="msg-title">{{ n.title }}</text>
                  <text class="msg-time">{{ n.time }}</text>
                </view>
                <text class="msg-content">{{ n.content }}</text>
                <view v-if="n.dispatchId" class="msg-meta">
                  <text class="msg-dispatch">派车单：{{ n.dispatchId }}</text>
                </view>
              </view>
              <view v-if="!n.read" class="unread-dot"></view>
            </view>
          </view>
        </view>
      </view>

      <!-- ===== Tab 4: GPS ===== -->
      <view v-if="activeTab === 'gps'" class="tab-pane">
        <view class="gps-sub-tabs">
          <view
            v-for="t in [
              { key: 'in', label: 'GPS 入园' },
              { key: 'out', label: 'GPS 离厂' },
            ]"
            :key="t.key"
            class="gps-sub-tab"
            :class="{ active: gpsSubTab === t.key }"
            @click="gpsSubTab = t.key as GpsSubTab; refreshGps()"
          >
            {{ t.label }}
          </view>
        </view>

        <!-- 状态大卡 -->
        <view
          class="gps-status-card"
          :class="{
            success: gpsSubTab === 'in' ? !!detectedYard : !detectedYard,
          }"
        >
          <view class="gps-status-icon">
            <image
              :src="gpsSubTab === 'in'
                ? (detectedYard ? '/static/icons/checked.svg' : '/static/icons/clock.svg')
                : (detectedYard ? '/static/icons/clock.svg' : '/static/icons/checked.svg')"
              mode="aspectFit"
              class="gps-status-svg"
            />
          </view>
          <view class="gps-status-title">
            {{ gpsSubTab === 'in'
              ? (detectedYard ? `已进入 ${detectedYard.name} 园区` : '等待入园')
              : (detectedYard ? `仍在 ${detectedYard.name} 园区` : '已离开园区') }}
          </view>
          <view class="gps-status-desc">
            {{ gpsSubTab === 'in'
              ? '当车辆 GPS 进入园区半径（300m）时自动打卡'
              : '当车辆 GPS 离开园区半径（300m）时自动打卡' }}
          </view>
        </view>

        <!-- 实时定位 -->
        <view class="gps-card">
          <view class="gps-card-header">
            <text class="gps-card-title">实时定位</text>
            <text class="gps-card-action" @click="refreshGps">刷新</text>
          </view>
          <view v-if="position" class="gps-pos-grid">
            <view class="gps-pos-item">
              <text class="gps-pos-label">经度</text>
              <text class="gps-pos-value">{{ position.lng.toFixed(6) }}</text>
            </view>
            <view class="gps-pos-item">
              <text class="gps-pos-label">纬度</text>
              <text class="gps-pos-value">{{ position.lat.toFixed(6) }}</text>
            </view>
            <view class="gps-pos-item">
              <text class="gps-pos-label">精度</text>
              <text class="gps-pos-value">{{ position.accuracyM }} m</text>
            </view>
          </view>
          <view v-else class="gps-loading">定位中...</view>
        </view>

        <!-- 距离 -->
        <view v-if="nearestYard && !detectedYard && gpsSubTab === 'in'" class="gps-card">
          <view class="gps-distance-row">
            <text class="gps-distance-label">距 {{ nearestYard.yard.name }} 园区</text>
            <text class="gps-distance-value">{{ formatDistance(nearestYard.distanceM) }}</text>
          </view>
          <view class="gps-distance-bar">
            <view
              class="gps-distance-fill"
              :style="{ width: Math.max(5, 100 - (nearestYard.distanceM / 1000) * 100) + '%' }"
            ></view>
          </view>
          <text class="gps-distance-tip">距离 ≤ 300m 时自动入园</text>
        </view>

        <view class="gps-tip">
          💡 M3 阶段：车辆硬件 GPS 自动判定，无需任何操作
        </view>
      </view>

      <!-- ===== Tab 5: 我的 ===== -->
      <view v-if="activeTab === 'me'" class="tab-pane">
        <view class="me-profile">
          <view class="me-avatar">
            <text>{{ driverStore.currentDriver?.name?.charAt(0) || '司' }}</text>
          </view>
          <view class="me-info">
            <text class="me-name">{{ driverStore.currentDriver?.name || '未设置' }}</text>
            <text class="me-phone">{{ driverStore.currentDriver?.phone || '-' }}</text>
          </view>
        </view>

        <view class="me-list">
          <view class="me-item" @click="showDriverSwitcher">
            <text class="me-item-icon">🔄</text>
            <text class="me-item-label">切换司机</text>
            <text class="me-item-arrow">›</text>
          </view>
          <view class="me-item" @click="uni.showToast({ title: '设置 - 待实现', icon: 'none' })">
            <text class="me-item-icon">⚙️</text>
            <text class="me-item-label">设置</text>
            <text class="me-item-arrow">›</text>
          </view>
          <view class="me-item" @click="uni.showToast({ title: '帮助 - 待实现', icon: 'none' })">
            <view class="me-item-icon">
              <image class="me-svg" src="/static/icons/bell.svg" mode="aspectFit" />
            </view>
            <text class="me-item-label">帮助与反馈</text>
            <text class="me-item-arrow">›</text>
          </view>
          <view class="me-item" @click="uni.showToast({ title: '关于 - v0.1.0', icon: 'none' })">
            <text class="me-item-icon">ℹ️</text>
            <text class="me-item-label">关于</text>
            <text class="me-item-arrow">›</text>
          </view>
        </view>
      </view>

    </view>

    <!-- ============ 底部 TabBar（5 Tab 切换）============ -->
    <view class="tabbar">
      <view
        v-for="t in [
          { key: 'workbench', label: '工作台', icon: '/static/icons/dashboard.svg' },
          { key: 'orders', label: '派车单', icon: '/static/icons/list.svg' },
          { key: 'messages', label: '消息', icon: '/static/icons/bell.svg' },
          { key: 'gps', label: 'GPS', icon: '/static/icons/pin.svg' },
          { key: 'me', label: '我的', icon: '/static/icons/user.svg' },
        ]"
        :key="t.key"
        class="tabbar-item"
        :class="{ active: activeTab === t.key }"
        @click="switchTab(t.key as TabKey)"
      >
        <image class="tabbar-icon" :src="t.icon" mode="aspectFit" />
        <text class="tabbar-label">{{ t.label }}</text>
      </view>
    </view>

  </view>
</template>

<style scoped>
/* =============================================
 * 5 Tab 单页样式（CSS Variables from src/App.vue）
 * ============================================= */

.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 140rpx; /* 留出 TabBar 高度 */
}
.page.with-tabbar {
  padding-bottom: 140rpx;
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
  font-weight: 700;
}
.welcome-switch {
  font-size: var(--font-size-mini);
  opacity: 0.85;
  text-decoration: underline;
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
  font-weight: 600;
}

.content {
  min-height: calc(100vh - 200rpx);
}

/* ===== 通用：状态 Tag ===== */
.status-tag {
  font-size: var(--font-size-mini);
  padding: 4rpx 16rpx;
  border-radius: var(--radius-sm);
  font-weight: 500;
}
.tag-pending {
  color: var(--color-status-pending-text);
  background: var(--color-status-pending-bg);
}
.tag-entering {
  color: var(--color-status-entering-text);
  background: var(--color-status-entering-bg);
}
.tag-loading {
  color: var(--color-status-loading-text);
  background: var(--color-status-loading-bg);
}
.tag-leaving {
  color: var(--color-status-leaving-text);
  background: var(--color-status-leaving-bg);
}
.tag-completed {
  color: var(--color-status-completed-text);
  background: var(--color-status-completed-bg);
}
.tag-cancelled {
  color: var(--color-status-cancelled-text);
  background: var(--color-status-cancelled-bg);
}

/* ===========================================
 * Tab 1: 工作台
 * =========================================== */
.wb-stats {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  display: flex;
  justify-content: space-around;
  box-shadow: var(--shadow-sm);
}
.wb-stat {
  flex: 1;
  text-align: center;
}
.wb-stat-num {
  display: block;
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: 4rpx;
}
.wb-stat-label {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.wb-stat.highlight .wb-stat-num { color: var(--color-brand); }
.wb-stat.success .wb-stat-num { color: var(--color-status-completed); }

.wb-current {
  background: var(--color-card);
  margin: 0 var(--space-md) var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.wb-current-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.wb-current-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.wb-current-no {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}
.wb-current-info .info-line {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  margin-bottom: 8rpx;
}

.wb-section {
  background: var(--color-card);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.wb-section-header {
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-divider);
}
.wb-section-title {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}
.timeline {
  position: relative;
}
.timeline-item {
  display: flex;
  align-items: flex-start;
  position: relative;
  padding-bottom: var(--space-sm);
}
.timeline-item:last-child { padding-bottom: 0; }
.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-brand);
  margin-top: 8rpx;
  margin-right: var(--space-sm);
  flex-shrink: 0;
  z-index: 1;
}
.timeline-dot.loading { background: var(--color-status-loading); }
.timeline-dot.entering { background: var(--color-status-entering); }
.timeline-dot.dispatched { background: var(--color-status-pending); }
.timeline-dot.confirmed { background: var(--color-text-placeholder); }
.timeline-dot.pending { background: var(--color-divider); }
.timeline-content {
  flex: 1;
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.timeline-time {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  font-family: monospace;
}
.timeline-label {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.timeline-line {
  position: absolute;
  left: 7rpx;
  top: 24rpx;
  bottom: 0;
  width: 2rpx;
  background: var(--color-divider);
}

/* ===========================================
 * Tab 2: 派车单
 * =========================================== */
.sub-tabs {
  display: flex;
  background: var(--color-card);
  padding: 0 var(--space-md);
  border-bottom: 1rpx solid var(--color-divider);
}
.sub-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-sm) 0;
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  position: relative;
}
.sub-tab.active {
  color: var(--color-brand);
  font-weight: 600;
}
.sub-tab.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 48rpx;
  height: 4rpx;
  background: var(--color-brand);
  border-radius: 2rpx;
}
.sub-tab-count {
  margin-left: var(--space-xs);
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  background: var(--color-bg);
  padding: 2rpx 12rpx;
  border-radius: var(--radius-pill);
}
.sub-tab.active .sub-tab-count {
  background: var(--color-brand-bg);
  color: var(--color-brand);
}

.list {
  padding: 20rpx var(--space-md) 0;
}

.dispatch-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-bg);
  margin-bottom: var(--space-sm);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}
.card-body { margin-bottom: var(--space-sm); }
.info-row {
  display: flex;
  align-items: center;
  margin-bottom: 12rpx;
}
.info-row:last-child { margin-bottom: 0; }
.info-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-brand);
}
.info-line-icon {
  width: 28rpx;
  height: 28rpx;
  color: var(--color-brand);
  margin-right: 6rpx;
}
.info-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 80rpx;
  margin-left: var(--space-xs);
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  margin-left: var(--space-xs);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: var(--space-sm);
  border-top: 1rpx dashed var(--color-divider);
}
.footer-left {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.time-text {
  font-size: var(--font-size-caption);
  color: var(--color-text-regular);
}
.direction-text {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  font-weight: 500;
}
.arrow {
  font-size: 36rpx;
  color: var(--color-text-placeholder);
  font-weight: 300;
}
.card-actions {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}
.btn-reject,
.btn-accept {
  flex: 1;
  height: 72rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-reject {
  background: var(--color-card);
  color: var(--color-status-cancelled-text);
  border: 1rpx solid #d9d9d9;
}
.btn-accept {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  border: none;
}

.load-more {
  text-align: center;
  padding: var(--space-md) 0;
}
.load-more-text {
  font-size: var(--font-size-mini);
  color: var(--color-text-placeholder);
}

/* ===========================================
 * Tab 3: 消息
 * =========================================== */
.msg-header {
  background: var(--color-card);
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.msg-filter-tabs {
  display: flex;
  gap: var(--space-md);
}
.msg-filter-tab {
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  padding: var(--space-xs) 0;
  position: relative;
}
.msg-filter-tab.active {
  color: var(--color-brand);
  font-weight: 600;
}
.msg-filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 32rpx;
  height: 4rpx;
  background: var(--color-brand);
  border-radius: 2rpx;
}
.msg-mark-all {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
}

.msg-group {
  margin-top: var(--space-md);
}
.msg-group-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
  padding: 0 var(--space-md);
  gap: var(--space-sm);
}
.msg-group-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  font-weight: 500;
}
.msg-group-line {
  flex: 1;
  height: 1rpx;
  background: var(--color-divider);
}
.msg-group-count {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.msg-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin: 0 var(--space-md) var(--space-sm);
  display: flex;
  align-items: flex-start;
  position: relative;
  border: 1rpx solid var(--color-divider);
}
.msg-card.unread {
  background: #f0f7ff;
  border-color: #d6e8ff;
}
.msg-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-sm);
  flex-shrink: 0;
}
.msg-icon-svg {
  width: 44rpx;
  height: 44rpx;
  color: var(--color-brand);
}
.msg-body { flex: 1; min-width: 0; }
.msg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}
.msg-title {
  font-size: var(--font-size-card-title);
  color: var(--color-text-regular);
}
.msg-card.unread .msg-title {
  color: var(--color-text-primary);
  font-weight: 600;
}
.msg-time {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-left: var(--space-sm);
}
.msg-content {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  line-height: 1.5;
  margin-bottom: var(--space-xs);
}
.msg-card.unread .msg-content {
  color: var(--color-text-regular);
}
.msg-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-xs);
}
.msg-dispatch {
  font-size: var(--font-size-mini);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-sm);
}
.unread-dot {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ff4d4f;
}

/* ===========================================
 * Tab 4: GPS
 * =========================================== */
.gps-sub-tabs {
  display: flex;
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xs);
}
.gps-sub-tab {
  flex: 1;
  text-align: center;
  padding: var(--space-sm);
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  border-radius: var(--radius-md);
}
.gps-sub-tab.active {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  font-weight: 600;
}

.gps-status-card {
  background: var(--color-status-pending-bg);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-md);
  text-align: center;
  border: 1rpx solid var(--color-status-pending-text);
}
.gps-status-card.success {
  background: var(--color-status-completed-bg);
  border-color: var(--color-status-completed-text);
}
.gps-status-icon {
  width: 100rpx;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-sm);
}
.gps-status-svg {
  width: 80rpx;
  height: 80rpx;
}
.gps-status-title {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: 700;
  color: var(--color-status-pending-text);
  margin-bottom: var(--space-sm);
}
.gps-status-card .gps-status-icon {
  color: var(--color-status-pending);
}
.gps-status-card.success .gps-status-icon {
  color: var(--color-status-completed);
}
.gps-status-card.success .gps-status-title {
  color: var(--color-status-completed-text);
}
.gps-status-desc {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-status-pending-text);
  line-height: 1.5;
}
.gps-status-card.success .gps-status-desc {
  color: var(--color-status-completed-text);
}

.gps-card {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.gps-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.gps-card-title {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}
.gps-card-action {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: 4rpx 16rpx;
  border-radius: var(--radius-pill);
}

.gps-pos-grid {
  display: flex;
  gap: var(--space-sm);
}
.gps-pos-item {
  flex: 1;
  background: var(--color-bg);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  text-align: center;
}
.gps-pos-label {
  display: block;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xs);
}
.gps-pos-value {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-primary);
  font-weight: 600;
  font-family: monospace;
}
.gps-loading {
  text-align: center;
  padding: var(--space-xl);
  color: var(--color-text-secondary);
  font-size: var(--font-size-body);
}

.gps-distance-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.gps-distance-label {
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
}
.gps-distance-value {
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-brand);
  font-family: monospace;
}
.gps-distance-bar {
  height: 12rpx;
  background: var(--color-divider);
  border-radius: 6rpx;
  overflow: hidden;
  margin-bottom: var(--space-sm);
}
.gps-distance-fill {
  height: 100%;
  background: var(--gradient-brand);
  border-radius: 6rpx;
  transition: width 0.5s ease;
}
.gps-distance-tip {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.gps-tip {
  background: #f0f7ff;
  border: 1rpx solid #d6e8ff;
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin: var(--space-md);
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--color-brand);
}

/* ===========================================
 * Tab 5: 我的
 * =========================================== */
.me-profile {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.me-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: var(--color-text-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  font-weight: 600;
  flex-shrink: 0;
}
.me-info {
  flex: 1;
}
.me-name {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: 700;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.me-phone {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}

.me-list {
  background: var(--color-card);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.me-item {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1rpx solid var(--color-divider);
}
.me-item:last-child { border-bottom: none; }
.me-item-icon {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.me-svg {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-text-regular);
}
.me-item-label {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  margin-left: var(--space-sm);
}
.me-item-arrow {
  font-size: 32rpx;
  color: var(--color-text-placeholder);
}

/* ===========================================
 * 底部 TabBar
 * =========================================== */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 100rpx;
  background: var(--color-card);
  border-top: 1rpx solid var(--color-divider);
  display: flex;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
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
  font-weight: 600;
}
.tabbar-item.active .tabbar-icon {
  filter: drop-shadow(0 0 8rpx rgba(22, 119, 255, 0.3));
}
.tabbar-item .tabbar-icon {
  color: var(--color-text-secondary);
}
.tabbar-item.active .tabbar-icon {
  color: var(--color-brand);
}
</style>