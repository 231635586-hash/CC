<script setup lang="ts">
/**
 * 派车单详情页（点击列表条目跳转目标）
 *
 * 设计原则：
 *  - uni.navigateBack 默认行为：返回时状态保留（Tab 不动 / 列表滚动位置保留）
 *  - 页面集成所有详情信息（轨迹 + 货物 + 卸货 + 物流 + 联系 + 导航）
 *  - 使用全局 token + mock + 状态字典
 */

import { onLoad } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { MOCK_DISPATCHES, type DispatchMock } from '@/mock/dispatches'
import { DISPATCH_STATUS_MAP, isStepReached } from '@/constants/dispatchStatus'
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

// 从 url query 读取 id
const dispatchId = ref<string>('')
const detail = ref<DetailData | null>(null)

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
      { status: 'driver_confirmed', label: '司机确认到达', time: '16:05', done: isStepReached('driver_confirmed', mock.status) },
    ],
    remark: '客户催货，优先派车',
  }
}

/** v0.2.0-M2：司机手动确认到达（H5 端动作） */
function confirmArrival() {
  if (!detail.value) return
  uni.showModal({
    title: '确认到达客户园区',
    content: `订单 ${detail.value.dispatchNo} 已到达 ${detail.value.customerName}？\n\n确认后状态将变为「司机确认」，等待客户签收。`,
    confirmText: '确认到达',
    success: (res) => {
      if (res.confirm) {
        const newStatus = 'driver_confirmed'
        // 1) 更新本地详情视图
        detail.value!.status = newStatus
        // 2) 回写 MOCK_DISPATCHES,确保返回列表时状态一致
        const idx = MOCK_DISPATCHES.findIndex((d) => d.id === detail.value!.id)
        if (idx >= 0) MOCK_DISPATCHES[idx].status = newStatus
        uni.showToast({ title: '已确认到达', icon: 'success' })
      }
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

    <!-- v0.3.0-M2.2 v2：driver_confirmed/completed 状态横幅 -->
    <view v-if="detail.status === 'driver_confirmed' || detail.status === 'completed'" class="arrival-banner confirmed">
      <image class="banner-icon" src="/static/icons/checked.svg" mode="aspectFit" />
      <view class="banner-content">
        <text class="banner-title">{{ detail.status === 'completed' ? '订单已完成' : '司机已确认到达' }}</text>
        <text class="banner-tip">v0.3.0-M2.2 v2: 确认到达即完成,无需客户签收</text>
      </view>
    </view>

    <!-- 底部操作栏 -->
    <view class="bottom-bar">
      <button class="btn-secondary" @click="callPhone(detail.companyPhone, '物流公司')">联系物流</button>
      <!-- v0.3.0-M2.2 v2:按状态切换主操作按钮(司机确认到达 → 自动完成,无客户签收步骤) -->
      <template v-if="detail.status === 'in_transit'">
        <button class="btn-primary btn-confirm" @click="confirmArrival">
          <image class="btn-icon" src="/static/icons/checked.svg" mode="aspectFit" />
          确认到达客户
        </button>
      </template>
      <template v-else-if="detail.status === 'driver_confirmed' || detail.status === 'completed'">
        <button class="btn-primary" disabled>
          <image class="btn-icon" src="/static/icons/done.svg" mode="aspectFit" />
          订单已完成
        </button>
      </template>
      <template v-else>
        <button class="btn-primary" @click="openNavi(detail.yards[0])">
          <image class="btn-icon" src="/static/icons/compass.svg" mode="aspectFit" />
          一键导航
        </button>
      </template>
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

/* Frame 模式下：.bottom-bar 改 absolute + 让 padding-bottom 给 Indie 留位置 */
html.hx-frame-on .bottom-bar {
  position: absolute !important;
  bottom: 0 !important;
  max-width: 390px !important;
  width: 100% !important;
  z-index: 100 !important;
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

/* Bottom bar */
.bottom-bar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--color-card);
  padding: var(--space-sm) var(--space-md) calc(var(--space-sm) + env(safe-area-inset-bottom));
  display: flex;
  gap: var(--space-sm);
  box-shadow: 0 -2rpx 8rpx rgba(0, 0, 0, 0.04);
}
.btn-secondary {
  flex: 1;
  background: var(--color-card);
  color: var(--color-brand);
  border: 1rpx solid var(--color-brand);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  line-height: 80rpx;
  text-align: center;
}
.btn-primary {
  flex: 2;
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  border: none;
  border-radius: var(--radius-md);
  font-size: var(--font-size-card-title);
  font-weight: 600;
  line-height: 80rpx;
  text-align: center;
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

/* ====== v0.2.0-M2：确认到达按钮 + 到达状态横幅 ====== */
.btn-confirm {
  background: var(--color-status-completed) !important;
  animation: pulse-confirm 1.5s ease-in-out infinite;
}
@keyframes pulse-confirm {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.85; }
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