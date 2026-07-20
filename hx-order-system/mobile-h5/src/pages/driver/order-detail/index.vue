<script setup lang="ts">
/**
 * 派车单详情页（点击列表条目跳转目标）
 *
 * 设计原则：
 *  - uni.navigateBack 默认行为：返回时状态保留（Tab 不动 / 列表滚动位置保留）
 *  - 页面集成所有详情信息（轨迹 + 货物 + 卸货 + 物流 + 联系 + 导航）
 *  - 使用全局 token + mock + 状态字典
 *
 * v0.3.0-M2.2 + P0-3：
 *  - 重建 .bottom-bar（用 safe-area-inset-bottom 避开 Home Indicator）
 *  - arrived 状态显示【📷 拍照确认到货】按钮 → uni.chooseImage 强制相机
 *  - completed 状态 banner 升级为「订单已完成 · 含 X 张到货照片」+ 点击预览
 *  - 拍照失败默认兑底 mock base64 占位图（按用户决策）
 */

import { onLoad } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { DISPATCH_STATUS_MAP, isStepReached } from '@/constants/dispatchStatus'
import { useDriverStore } from '@/stores/driver'
import StatusTag from '@/components/StatusTag.vue'

interface YardInfo {
  id: string
  name: string
  lng: number
  lat: number
}

interface TimelineNode {
  status: string
  label: string
  time: string
  done: boolean
}

interface GoodsItem {
  materialCode: string
  materialName: string
  productName?: string
  quantity: number
  unit: string
  weight?: number
}

interface DetailData {
  id: string
  dispatchNo: string
  status: string
  direction: string
  expectedLoadTime: string
  yards: YardInfo[]
  customerName: string
  customerAddress: string
  customerContact: string
  customerPhone: string
  /** v0.2.0-M2：客户园区 GPS（用于一键导航到客户地址） */
  /** v0.2.0-M2：库房员已生成的签收链接（司机展示给客户备用） */
  companyName: string
  companyPhone: string
  vehicleNo: string
  driverName: string
  driverPhone: string
  goods: GoodsItem[]
  timeline: TimelineNode[]
  remark: string
}

/** P0-3：mock 阶段拍照失败兑底占位图（SVG data URL，无 base64 撑爆风险） */
const MOCK_PHOTO_DATA_URL =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200">' +
      '<rect width="200" height="200" fill="#e0e7ff"/>' +
      '<text x="100" y="105" text-anchor="middle" font-size="20" fill="#3730a3" font-family="sans-serif">' +
        '📷 mock 占位图' +
      '</text>' +
    '</svg>',
  )

// 从 url query 读取 id
const dispatchId = ref<string>('')
const detail = ref<DetailData | null>(null)

const driverStore = useDriverStore()

/** P0-3：当前派车单完单照片数量（响应式） */
const photoCount = computed(() => {
  if (!detail.value) return 0
  return driverStore.getCompletionPhotos(detail.value.id).length
})

const currentStep = computed(() => {
  if (!detail.value) return -1
  const idx = detail.value.timeline.findIndex((t) => !t.done)
  return idx === -1 ? detail.value.timeline.length - 1 : idx
})

function loadDetail(id: string) {
  // mock 阶段：从 MOCK_DISPATCHES 查，真实阶段调 API
  const mock = MOCK_DISPATCHES.find((d) => d.id === id)
  if (!mock) return
  // 补全详情字段
  detail.value = {
    id: mock.id,
    dispatchNo: mock.dispatchNo,
    status: mock.status,
    direction: mock.direction,
    expectedLoadTime: mock.expectedLoadTime,
    yards: mock.yardIds.map((yid, i) => ({
      id: yid,
      name: mock.yardNames[i] || yid,
      lng: yid === 'mock-yard-001' ? 111.513 : 111.612,
      lat: yid === 'mock-yard-001' ? 36.081 : 36.156,
    })),
    customerName: mock.customerName,
    customerAddress: mock.customerAddress,
    customerContact: '周婷',
    customerPhone: '13566778899',
    // ❌ v0.3.0-M2.2 删除:客户园区坐标 / signUrl(客户签收全链路已下线,司机 H5 直接确认到达即完成)
    companyName: mock.companyName,
    companyPhone: '13800138002',
    vehicleNo: mock.vehicleNo || '-',
    driverName: mock.driverName || '-',
    driverPhone: '13987654321',
    goods: [
      { materialCode: 'MAT-DEMO-B', materialName: '大型设备配件', productName: '设备配件', quantity: 80, unit: '箱', weight: 3200 },
      { materialCode: 'MAT-DEMO-B2', materialName: '包装箱', quantity: 40, unit: '箱', weight: 800 },
    ],
    timeline: [
      { status: 'pending_confirm', label: '订单待确认', time: '09:00', done: isStepReached('pending_confirm', mock.status) },
      { status: 'confirmed', label: '已确认受理', time: '09:30', done: isStepReached('confirmed', mock.status) },
      { status: 'dispatched', label: '已派车出发', time: '13:30', done: isStepReached('dispatched', mock.status) },
      { status: 'entering', label: 'GPS 自动入园', time: '13:45', done: isStepReached('entering', mock.status) },
      { status: 'loading', label: '库房通知装货', time: '14:00', done: isStepReached('loading', mock.status) },
      { status: 'leaving', label: '装货完成离厂', time: '14:30', done: isStepReached('leaving', mock.status) },
      // v0.2.0-M2 → v0.3.0-M2.2：到货处理简化（移除 arrived_by_gps / customer_signed 中间态）
      { status: 'in_transit', label: '在途', time: '15:00', done: isStepReached('in_transit', mock.status) },
      // v0.3.0-M2.2 + P0-2：GPS 自动到货节点（时间取 arrivedByGpsAt 真实时间戳）
      {
        status: 'arrived',
        label: 'GPS 自动到货',
        time: mock.arrivedByGpsAt ? new Date(mock.arrivedByGpsAt).toTimeString().slice(0, 5) : '—',
        done: isStepReached('arrived', mock.status),
      },
      { status: 'driver_confirmed', label: '司机确认到达', time: '16:05', done: isStepReached('driver_confirmed', mock.status) },
    ],
    remark: '客户催货，优先派车',
  }
}

/**
 * v0.3.0-M2.2 + P0-3：司机手动拍照确认到货（arrived → completed）
 *  - 强制相机（uni.chooseImage sourceType=['camera']）
 *  - 拍照失败默认兑底 mock base64 占位图 + toast 提示
 *  - 写入 completionPhotos / driverConfirmedAt / completedAt
 *  - 同步 MOCK_DISPATCHES + 推 arrived_prompt → 已完成 消息通知
 */
function confirmArrivalWithPhoto() {
  if (!detail.value) return
  const currentDispatch = detail.value
  uni.chooseImage({
    count: 1,
    sourceType: ['camera'],  // 强制相机
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      // 真实阶段：uni.uploadFile 上传 → 拿到 CDN URL
      // mock 阶段：直接用 tempFilePath（uni H5 端为 base64 data URL）
      // 但为安全起见，统一存 data URL（兼容 web 浏览器）
      const capturedAt = new Date().toISOString()
      applyCompletion(currentDispatch.id, tempFilePath, capturedAt)
    },
    fail: () => {
      // 拍照失败兑底：mock 占位图（按用户决策）
      uni.showToast({ title: '相机不可用,已使用占位图', icon: 'none' })
      const capturedAt = new Date().toISOString()
      applyCompletion(currentDispatch.id, MOCK_PHOTO_DATA_URL, capturedAt)
    },
  })
}

/**
 * P0-3：统一处理完单流（无论真拍照还是兑底都走这里）
 *  - 写入 photo 到 store
 *  - 改 status='completed' + 写时间戳
 *  - 同步 MOCK_DISPATCHES
 *  - 推 arrived_prompt 完成通知
 */
function applyCompletion(id: string, photoData: string, capturedAt: string) {
  if (!detail.value) return
  // 1) 存照片
  driverStore.addCompletionPhoto(id, photoData, capturedAt)
  // 2) 改本地详情状态
  detail.value.status = 'completed'
  // 3) 同步 MOCK_DISPATCHES（含 completionPhotos / driverConfirmedAt / completedAt）
  const nowIso = new Date().toISOString()
  const idx = MOCK_DISPATCHES.findIndex((d) => d.id === id)
  if (idx >= 0) {
    MOCK_DISPATCHES[idx].status = 'completed'
    MOCK_DISPATCHES[idx].driverConfirmedAt = nowIso
    MOCK_DISPATCHES[idx].completedAt = nowIso
    if (!MOCK_DISPATCHES[idx].completionPhotos) MOCK_DISPATCHES[idx].completionPhotos = []
    MOCK_DISPATCHES[idx].completionPhotos!.push({ data: photoData, capturedAt })
  }
  // 4) 推消息
  driverStore.pushNotification({
    id: `n-${id}-completed-${Date.now()}`,
    type: 'arrived_prompt',
    title: '订单已完成',
    content: `${detail.value.dispatchNo} 已拍照确认到货，含 ${photoCount.value + 1} 张凭证照片`,
    time: new Date().toTimeString().slice(0, 5),
    timestamp: Date.now(),
    read: false,
    dispatchId: id,
  })
  // 5) toast 提示
  uni.showToast({ title: '✅ 已完成,感谢您的辛苦付出', icon: 'success' })
}

/**
 * P0-3：预览当前派车单的完单照片（uni.previewImage 全屏预览）
 *  - H5 浏览器未注册时 catch → window.open 兑底
 */
function previewPhoto(index: number) {
  if (!detail.value) return
  const photos = driverStore.getCompletionPhotos(detail.value.id)
  if (photos.length === 0) return
  const urls = photos.map((p) => p.data)
  uni.previewImage({
    current: urls[index] || urls[0],
    urls,
    fail: () => {
      // H5 浏览器兑底：window.open 新窗口打开（仅 mock base64）
      const target = urls[index] || urls[0]
      window.open(target, '_blank')
    },
  })
}

// ❌ v0.3.0-M2.2 删除：openCustomerNavi（客户签收全链路已下线,司机 H5 直接确认到达）
function callPhone(phone: string, name: string) {
  if (!phone) {
    uni.showToast({ title: `${name}电话未填写`, icon: 'none' })
    return
  }
  uni.makePhoneCall({ phoneNumber: phone, fail: () => uni.showToast({ title: '拨号失败', icon: 'none' }) })
}

function openNavi(yard: YardInfo) {
  if (!yard.lng || !yard.lat) {
    uni.showToast({ title: '园区坐标未配置', icon: 'none' })
    return
  }
  uni.showModal({
    title: '一键导航',
    content: `目标：${yard.name}\n坐标：${yard.lng}, ${yard.lat}\n（真实阶段将调起地图 APP）`,
    showCancel: false,
  })
}

function copyAddress() {
  if (!detail.value) return
  uni.setClipboardData({
    data: detail.value.customerAddress,
    success: () => uni.showToast({ title: '地址已复制', icon: 'success' }),
  })
}

// ❌ v0.3.0-M2.2 删除：shareSignUrl

onLoad((query: any) => {
  dispatchId.value = query?.id || 'mock-dispatch-012'
  loadDetail(dispatchId.value)
})
</script>

<template>
  <view class="page" v-if="detail">
    <!-- 顶部摘要 -->
    <view class="summary">
      <view class="summary-row">
        <text class="dispatch-no">{{ detail.dispatchNo }}</text>
        <StatusTag :status="detail.status as any" />
      </view>
      <view class="summary-row2">
        <text class="direction">方向：{{ detail.direction }}</text>
        <text class="time">预计装货：{{ detail.expectedLoadTime }}</text>
      </view>
    </view>

    <!-- 状态轨迹 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">状态轨迹</text>
      </view>
      <view class="timeline">
        <view
          v-for="(item, idx) in detail.timeline"
          :key="idx"
          class="timeline-row"
          :class="{ active: idx === currentStep }"
        >
          <view class="timeline-dot-wrap">
            <view class="timeline-dot" :class="item.done ? 'done' : 'pending'"></view>
            <view v-if="idx !== detail.timeline.length - 1" class="timeline-line"></view>
          </view>
          <view class="timeline-content">
            <text class="timeline-label" :class="{ active: idx === currentStep }">{{ item.label }}</text>
            <text class="timeline-time">{{ item.time }}</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 园区信息 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">装货园区</text>
      </view>
      <view v-for="(yard, idx) in detail.yards" :key="idx" class="yard-row">
        <view class="yard-info">
          <image class="yard-icon" src="/static/icons/yard.svg" mode="aspectFit" />
          <view>
            <text class="yard-name">{{ yard.name }} 园区</text>
            <text class="yard-addr">{{ yard.lng }}, {{ yard.lat }}</text>
          </view>
        </view>
        <button class="btn-navi" @click="openNavi(yard)">导航</button>
      </view>
    </view>

    <!-- 客户 / 卸货信息 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">卸货信息</text>
      </view>
      <view class="info-row">
        <text class="info-label">客户</text>
        <text class="info-value">{{ detail.customerName }}</text>
      </view>
      <view class="info-row" @click="copyAddress">
        <text class="info-label">地址</text>
        <text class="info-value ellipsis">{{ detail.customerAddress }}</text>
        <text class="copy-tip">复制</text>
      </view>
      <view class="info-row" @click="callPhone(detail.customerPhone, '客户')">
        <text class="info-label">联系</text>
        <text class="info-value">{{ detail.customerContact }} {{ detail.customerPhone }}</text>
        <text class="copy-tip">拨打</text>
      </view>
    </view>

    <!-- 货物清单 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">货物清单（{{ detail.goods.length }}）</text>
      </view>
      <view v-for="(g, idx) in detail.goods" :key="idx" class="goods-row">
        <view class="goods-line1">
          <text class="goods-name">{{ g.productName || g.materialName }}</text>
          <text class="goods-qty">{{ g.quantity }} {{ g.unit }}</text>
        </view>
        <view class="goods-line2">
          <text class="goods-code">编码：{{ g.materialCode }}</text>
          <text v-if="g.weight" class="goods-weight">{{ g.weight }} kg</text>
        </view>
      </view>
    </view>

    <!-- 物流信息 -->
    <view class="card">
      <view class="card-header">
        <text class="card-title">物流信息</text>
      </view>
      <view class="info-row">
        <text class="info-label">公司</text>
        <text class="info-value ellipsis">{{ detail.companyName }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">车辆</text>
        <text class="info-value">{{ detail.vehicleNo }}</text>
      </view>
      <view class="info-row">
        <text class="info-label">司机</text>
        <text class="info-value">{{ detail.driverName }}</text>
      </view>
      <view v-if="detail.remark" class="info-row remark-row">
        <text class="info-label">备注</text>
        <text class="info-value remark-text">{{ detail.remark }}</text>
      </view>
    </view>

    <!-- v0.3.0-M2.2 + P0-2：arrived 状态横幅（GPS 自动触发） -->
    <view v-if="detail.status === 'arrived'" class="arrival-banner">
      <image class="banner-icon" src="/static/icons/arrived.svg" mode="aspectFit" />
      <view class="banner-content">
        <text class="banner-title">📍 GPS 自动确认到达客户地址</text>
        <text class="banner-tip">请手动拍照确认到货（凭证照片将作为送达证据）</text>
      </view>
    </view>

    <!-- v0.3.0-M2.2 + P0-3：completed 状态横幅（含照片预览入口） -->
    <view v-if="detail.status === 'completed'" class="arrival-banner confirmed">
      <image class="banner-icon" src="/static/icons/checked.svg" mode="aspectFit" />
      <view class="banner-content">
        <text class="banner-title">✅ 订单已完成</text>
        <text class="banner-tip" v-if="photoCount > 0" @click="previewPhoto(0)">
          含 {{ photoCount }} 张到货照片，点击预览
        </text>
        <text class="banner-tip" v-else>暂无照片凭证</text>
      </view>
    </view>

    <!-- v0.3.0-M2.2 v2：driver_confirmed 状态横幅（兼容老 mock 数据） -->
    <view v-else-if="detail.status === 'driver_confirmed'" class="arrival-banner confirmed">
      <image class="banner-icon" src="/static/icons/checked.svg" mode="aspectFit" />
      <view class="banner-content">
        <text class="banner-title">司机已确认到达</text>
        <text class="banner-tip">v0.3.0-M2.2 v2: 历史兼容，状态将由 P0-3 拍照按钮推进至 completed</text>
      </view>
    </view>

    <!-- v0.3.0-M2.2 + P0-3：重建底部 bar（用 safe-area-inset-bottom 避开 Home Indicator）
         arrived 状态：渲染【📷 拍照确认到货】主按钮
         completed 状态：渲染【查看照片】按钮（仅当 photoCount > 0）
         其他状态：无按钮 -->
    <view v-if="detail.status === 'arrived' || (detail.status === 'completed' && photoCount > 0)" class="bottom-bar">
      <button v-if="detail.status === 'arrived'" class="btn-photo" @click="confirmArrivalWithPhoto">
        <image class="btn-icon" src="/static/icons/camera.svg" mode="aspectFit" />
        拍照确认到货
      </button>
      <button v-else-if="detail.status === 'completed' && photoCount > 0" class="btn-photo-secondary" @click="previewPhoto(0)">
        <image class="btn-icon" src="/static/icons/camera.svg" mode="aspectFit" />
        查看照片（{{ photoCount }}）
      </button>
    </view>
  </view>

  <!-- 加载中 -->
  <view v-else class="loading-page">
    <text class="loading-text">加载中...</text>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  /* v0.3.0-M2.2 + P0-3：重建底部 bar，留 160rpx 避免被拍照按钮遮挡 */
  padding-bottom: 160rpx;
}
/* Frame 模式下：用 100% 替代 100vh，避免撑爆 Frame */
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100%;
  overflow-y: auto;
}

/* Frame 模式下：.summary 不再被原生 nav bar 遮挡（nav bar 自带 44px 顶部空间） */
html.hx-frame-on .summary {
  margin-top: 0;
}

/* v0.3.0-M2.2 + P0-3：重建 .bottom-bar
 *  - 用 safe-area-inset-bottom 避开 iPhone Home Indicator
 *  - Frame 模式下用 absolute 相对 transformed #app
 */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-card);
  padding: var(--space-md) var(--space-md) calc(var(--space-md) + env(safe-area-inset-bottom));
  display: flex;
  gap: var(--space-sm);
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.06);
  z-index: 100;
}
/* Frame 模式下：.bottom-bar 改 absolute（相对 transformed #app）
   + 用 calc(env(safe-area-inset-bottom) + 8px) 给 Home Indicator 留 8px 缓冲 */
html.hx-frame-on .bottom-bar {
  position: absolute !important;
  bottom: 0 !important;
  max-width: 390px !important;
  width: 100% !important;
  z-index: 100 !important;
}

/* v0.3.0-M2.2 + P0-3：拍照主按钮（arrived 状态） */
.btn-photo {
  flex: 1;
  min-height: 88rpx;
  background: var(--color-status-completed);
  color: white;
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-card-title);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  line-height: 1;
}
.btn-photo-secondary {
  flex: 1;
  min-height: 88rpx;
  background: var(--color-card);
  color: var(--color-brand);
  border: 1rpx solid var(--color-brand);
  border-radius: var(--radius-md);
  font-size: var(--font-size-card-title);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
  line-height: 1;
}
.btn-photo .btn-icon,
.btn-photo-secondary .btn-icon {
  width: 36rpx;
  height: 36rpx;
  color: white;
}
.btn-photo-secondary .btn-icon {
  color: var(--color-brand);
}

.summary {
  background: var(--gradient-brand);
  color: var(--color-text-on-brand);
  padding: var(--space-lg) var(--space-md) var(--space-xl);
}
.summary-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-sm);
}
.dispatch-no {
  font-size: var(--font-size-card-title);
  font-weight: 700;
}
.summary-row2 {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-caption);
  opacity: 0.9;
}

/* 注：状态 Tag CSS 已在 components/StatusTag.vue 中定义（v0.2.x 重构抽出） */

.card {
  background: var(--color-card);
  margin: var(--space-md) var(--space-md) 0;
  border-radius: var(--radius-lg);
  padding: var(--space-md);
}
.card-header {
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-divider);
}
.card-title {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}

/* Timeline */
.timeline {
  padding-left: var(--space-xs);
}
.timeline-row {
  display: flex;
  align-items: flex-start;
  position: relative;
}
.timeline-dot-wrap {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 32rpx;
  margin-right: var(--space-sm);
}
.timeline-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: var(--color-status-completed);
  margin-top: 8rpx;
  z-index: 1;
}
.timeline-dot.pending {
  background: var(--color-card);
  border: 2rpx solid var(--color-text-placeholder);
}
.timeline-line {
  width: 2rpx;
  flex: 1;
  background: var(--color-divider);
  min-height: 32rpx;
  margin-top: 4rpx;
}
.timeline-content {
  flex: 1;
  padding-bottom: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.timeline-row:last-child .timeline-content { padding-bottom: 0; }
.timeline-label {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
}
.timeline-label.active {
  color: var(--color-brand);
  font-weight: 600;
}
.timeline-time {
  font-size: var(--font-size-caption);
  color: var(--color-text-placeholder);
  font-family: monospace;
}
.timeline-row.active .timeline-time {
  color: var(--color-brand);
}

/* Yard */
.yard-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1rpx solid var(--color-bg);
}
.yard-row:last-child { border-bottom: none; }
.yard-info {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}
.yard-icon {
  width: 40rpx;
  height: 40rpx;
  color: var(--color-brand);
}
.yard-name {
  display: block;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-weight: 500;
}
.yard-addr {
  display: block;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}
.btn-navi {
  background: var(--color-brand-bg);
  color: var(--color-brand);
  font-size: var(--font-size-caption);
  padding: var(--space-xs) var(--space-md);
  border-radius: var(--radius-sm);
  border: none;
  line-height: 1.4;
}

/* Info */
.info-row {
  display: flex;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1rpx dashed var(--color-bg);
}
.info-row:last-child { border-bottom: none; }
.info-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 96rpx;
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
.copy-tip {
  font-size: var(--font-size-mini);
  color: var(--color-brand);
  padding: 4rpx 12rpx;
  background: var(--color-brand-bg);
  border-radius: var(--radius-sm);
  margin-left: var(--space-xs);
}
.remark-row { align-items: flex-start; }
.remark-text {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  line-height: 1.5;
}

/* Goods */
.goods-row {
  padding: var(--space-sm) 0;
  border-bottom: 1rpx solid var(--color-bg);
}
.goods-row:last-child { border-bottom: none; }
.goods-line1 {
  display: flex;
  justify-content: space-between;
  margin-bottom: var(--space-xs);
}
.goods-name {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  font-weight: 500;
}
.goods-qty {
  font-size: var(--font-size-body);
  color: var(--color-brand);
  font-weight: 600;
}
.goods-line2 {
  display: flex;
  justify-content: space-between;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.loading-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  background: var(--color-bg);
}
/* Frame 模式下：loading 页面也要适配 */
html.hx-frame-on .loading-page {
  min-height: 100% !important;
  height: 100%;
}
.loading-text {
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
}
.arrival-banner {
  display: flex;
  align-items: center;
  gap: 20rpx;
  margin: var(--space-md);
  padding: var(--space-md);
  background: var(--color-status-entering-bg);
  border: 2rpx solid var(--color-status-entering-text);
  border-radius: var(--radius-lg);
}
.arrival-banner.confirmed {
  background: var(--color-status-completed-bg);
  border-color: var(--color-status-completed-text);
}
.arrival-banner.signed {
  background: var(--color-status-completed-bg);
  border-color: var(--color-status-completed-text);
}
.banner-icon {
  width: 64rpx;
  height: 64rpx;
  color: var(--color-status-entering-text);
  flex-shrink: 0;
}
.arrival-banner.confirmed .banner-icon,
.arrival-banner.signed .banner-icon {
  color: var(--color-status-completed-text);
}
.banner-content {
  flex: 1;
}
.banner-title {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-status-entering-text);
  margin-bottom: 4rpx;
}
.arrival-banner.confirmed .banner-title,
.arrival-banner.signed .banner-title {
  color: var(--color-status-completed-text);
}
.banner-tip {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-regular);
}

/* ====== v0.2.0-M2：签收链接展示卡 ====== */
.sign-link-card {
  background: var(--color-brand-bg);
  border: 2rpx solid var(--color-brand);
  border-radius: var(--radius-lg);
  margin: var(--space-md);
  padding: var(--space-md);
}
.sign-link-header {
  display: flex;
  flex-direction: column;
  margin-bottom: var(--space-sm);
}
.sign-link-title-row {
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  margin-bottom: 4rpx;
}
.sign-link-title-icon {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-brand);
}
.sign-link-title {
  font-size: var(--font-size-card-title);
  font-weight: 700;
  color: var(--color-brand);
}
.btn-icon {
  width: 32rpx;
  height: 32rpx;
  margin-right: var(--space-xs);
  vertical-align: middle;
}
.sign-link-tip {
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}
.sign-link-url-row {
  background: rgba(255, 255, 255, 0.7);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin-bottom: var(--space-sm);
}
.sign-link-url {
  font-size: var(--font-size-caption);
  color: var(--color-text-regular);
  font-family: monospace;
  word-break: break-all;
  display: block;
}
.sign-link-actions {
  display: flex;
  gap: var(--space-sm);
}
.btn-copy, .btn-share {
  flex: 1;
  height: 72rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-sub);
  font-weight: 500;
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
}
.btn-copy {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
}
.btn-share {
  background: var(--color-card);
  color: var(--color-brand);
  border: 1rpx solid var(--color-brand);
}
</style>