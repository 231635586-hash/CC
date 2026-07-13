<script setup lang="ts">
/**
 * 客户签收 H5（v0.2.0-M2）
 *
 * 流程：
 *  1. 客户扫码/点链接进入（URL ?token=xxx）
 *  2. 校验 token 有效性 → 加载调车单 mock 数据
 *  3. 步骤 1：查看订单（订单号 + 货物 + 司机信息）
 *  4. 步骤 2：上传照片（≥1 张，最多 3 张）
 *  5. 步骤 3：填写备注（可选）→ 确认签收
 *  6. 提交完成 → 显示成功页
 *
 * mock 阶段：
 *  - 照片用 data URL 存 localStorage（无后端）
 *  - 真实阶段：调 POST /api/dispatch/{id}/sign（含 token + photos）
 */

import { onLoad } from '@dcloudio/uni-app'
import { ref, computed } from 'vue'
import { parseSignToken, extractTokenFromUrl, getTokenRemainingHours, formatExpiresAt, type SignTokenPayload } from '@/utils/signToken'
import { MOCK_DISPATCHES } from '@/mock/dispatches'

// ===== 类型 =====
interface SignPhoto {
  id: string
  dataUrl: string
  size: number
}

type Step = 'view' | 'photo' | 'confirm' | 'done'

// ===== 状态 =====
const tokenPayload = ref<SignTokenPayload | null>(null)
const step = ref<Step>('view')
const photos = ref<SignPhoto[]>([])
const note = ref('')
const submitting = ref(false)

// mock 订单数据
const orderInfo = ref<{
  dispatchNo: string
  driverName: string
  vehicleNo: string
  customerName: string
  goodsSummary: string
  expectedLoadTime: string
} | null>(null)

const tokenRemaining = computed(() => tokenPayload.value ? getTokenRemainingHours(tokenPayload.value) : 0)
const tokenExpiresAt = computed(() => tokenPayload.value ? formatExpiresAt(tokenPayload.value) : '')

// ===== 加载 =====
function loadFromToken(token: string) {
  const payload = parseSignToken(token)
  if (!payload) {
    uni.showModal({
      title: '链接无效',
      content: '签收链接已过期或无效，请联系调度员重新发送。',
      showCancel: false,
      success: () => uni.reLaunch({ url: '/pages/driver/orders/index' }),
    })
    return
  }
  tokenPayload.value = payload

  // mock 阶段查 mock 订单（按 token 中的 dispatchId）
  const mock = MOCK_DISPATCHES.find((d) => d.id === payload.dispatchId)
  if (!mock) {
    // 不阻断流程：mock 数据可能没这条，仍展示一个 placeholder
    orderInfo.value = {
      dispatchNo: payload.dispatchId.toUpperCase(),
      driverName: '陈大壮',
      vehicleNo: '沪A12345',
      customerName: '华东机械制造有限公司',
      goodsSummary: '货物清单（详情请联系调度员）',
      expectedLoadTime: '今日',
    }
    return
  }
  orderInfo.value = {
    dispatchNo: mock.dispatchNo,
    driverName: mock.driverName || '-',
    vehicleNo: mock.vehicleNo || '-',
    customerName: mock.customerName,
    goodsSummary: mock.goodsSummary || '-',
    expectedLoadTime: mock.expectedLoadTime,
  }
}

onLoad((query: any) => {
  // uni-app onLoad 拿到 query.token
  let token = query?.token
  if (!token) token = extractTokenFromUrl()
  if (!token) {
    uni.showToast({ title: '链接缺少 token 参数', icon: 'none' })
    return
  }
  loadFromToken(token)
})

// ===== 步骤切换 =====
function next() {
  if (step.value === 'view') step.value = 'photo'
  else if (step.value === 'photo') {
    if (photos.value.length === 0) {
      uni.showToast({ title: '请至少上传 1 张照片', icon: 'none' })
      return
    }
    step.value = 'confirm'
  }
  else if (step.value === 'confirm') submitSign()
}

function prev() {
  if (step.value === 'photo') step.value = 'view'
  else if (step.value === 'confirm') step.value = 'photo'
}

// ===== 照片操作 =====
function pickPhoto() {
  if (photos.value.length >= 3) {
    uni.showToast({ title: '最多上传 3 张', icon: 'none' })
    return
  }
  // uni.chooseImage 在 H5 端会调起文件选择
  uni.chooseImage({
    count: 3 - photos.value.length,
    sizeType: ['compressed'],
    sourceType: ['camera', 'album'],
    success: (res: any) => {
      const paths = res.tempFilePaths || []
      paths.forEach((p: string) => {
        // Mock 阶段：直接用 tempFilePaths(blob: URL) 当 src 显示
        // 真实阶段：先 uploadFile 到 OSS 拿 https URL，再存进 photos
        photos.value.push({
          id: `photo-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          dataUrl: p,
          size: 0,
        })
      })
    },
    fail: () => uni.showToast({ title: '选择图片失败', icon: 'none' }),
  })
}

function removePhoto(id: string) {
  photos.value = photos.value.filter((p) => p.id !== id)
}

// ===== 提交签收 =====
function submitSign() {
  if (!tokenPayload.value) return
  submitting.value = true

  // mock 阶段：写入 localStorage + 弹成功
  setTimeout(() => {
    try {
      uni.setStorageSync(`sign_log_${tokenPayload.value!.dispatchId}`, {
        signedAt: new Date().toISOString(),
        photos: photos.value.map((p) => p.id),
        photoCount: photos.value.length,
        note: note.value,
      })
    } catch (e) {
      console.error('[sign] save failed', e)
    }
    submitting.value = false
    step.value = 'done'
    uni.showToast({ title: '签收完成', icon: 'success' })
  }, 600)
}
</script>

<template>
  <view class="page">
    <view class="status-bar"></view>

    <!-- 顶部 Header -->
    <view class="header">
      <text class="header-title">客户签收</text>
      <view v-if="tokenPayload" class="header-meta">
        <text class="header-meta-text">链接有效期：剩余 {{ tokenRemaining }}h</text>
        <text class="header-meta-text">过期于 {{ tokenExpiresAt }}</text>
      </view>
    </view>

    <!-- Token 无效 / 错误 -->
    <view v-if="!tokenPayload" class="error-page">
      <image class="error-icon" src="/static/icons/cancel.svg" mode="aspectFit" />
      <text class="error-title">链接无效</text>
      <text class="error-desc">签收链接已过期或格式错误，请联系调度员重新发送。</text>
    </view>

    <!-- 已完成 -->
    <view v-else-if="step === 'done'" class="success-page">
      <view class="success-icon-wrap">
        <image class="success-icon" src="/static/icons/done.svg" mode="aspectFit" />
      </view>
      <text class="success-title">签收完成</text>
      <text class="success-desc">订单 {{ orderInfo?.dispatchNo }} 已签收，共 {{ photos.length }} 张照片</text>
      <text class="success-tip">感谢您的配合，订单流程已完成</text>
      <button class="btn-primary" @click="uni.reLaunch({ url: '/pages/driver/orders/index' })">返回司机端</button>
    </view>

    <!-- 步骤 1：查看订单 -->
    <view v-else-if="step === 'view'" class="step-page">
      <view class="step-indicator">
        <text class="step-num">1</text>
        <text class="step-label">查看订单</text>
      </view>

      <view v-if="orderInfo" class="card">
        <view class="info-row">
          <text class="info-label">订单号</text>
          <text class="info-value highlight">{{ orderInfo.dispatchNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">客户</text>
          <text class="info-value">{{ orderInfo.customerName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">货物</text>
          <text class="info-value ellipsis">{{ orderInfo.goodsSummary }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">司机</text>
          <text class="info-value">{{ orderInfo.driverName }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">车辆</text>
          <text class="info-value">{{ orderInfo.vehicleNo }}</text>
        </view>
        <view class="info-row">
          <text class="info-label">到货时间</text>
          <text class="info-value">{{ orderInfo.expectedLoadTime }}</text>
        </view>
      </view>

      <view class="tip-card">
        <text class="tip-text">📦 请核对货物信息，确认无误后进入下一步</text>
      </view>

      <button class="btn-primary" @click="next">下一步：上传照片</button>
    </view>

    <!-- 步骤 2：上传照片 -->
    <view v-else-if="step === 'photo'" class="step-page">
      <view class="step-indicator">
        <text class="step-num">2</text>
        <text class="step-label">上传签收照片</text>
      </view>

      <view class="card">
        <text class="card-title">货物照片（{{ photos.length }}/3）</text>
        <text class="card-desc">至少 1 张，建议拍 2-3 张（卸货前/卸货中/卸货后）</text>

        <view class="photo-grid">
          <view v-for="p in photos" :key="p.id" class="photo-item">
            <image class="photo-img" :src="p.dataUrl" mode="aspectFill" />
            <view class="photo-remove" @click="removePhoto(p.id)">×</view>
          </view>
          <view v-if="photos.length < 3" class="photo-add" @click="pickPhoto">
            <image class="photo-add-icon" src="/static/icons/camera.svg" mode="aspectFit" />
            <text class="photo-add-text">添加照片</text>
          </view>
        </view>
      </view>

      <view class="action-row">
        <button class="btn-secondary" @click="prev">上一步</button>
        <button class="btn-primary" :disabled="photos.length === 0" @click="next">下一步：确认签收</button>
      </view>
    </view>

    <!-- 步骤 3：确认签收 -->
    <view v-else-if="step === 'confirm'" class="step-page">
      <view class="step-indicator">
        <text class="step-num">3</text>
        <text class="step-label">确认签收</text>
      </view>

      <view class="card">
        <text class="card-title">签收照片（{{ photos.length }} 张）</text>
        <view class="photo-row">
          <image v-for="p in photos" :key="p.id" class="photo-thumb" :src="p.dataUrl" mode="aspectFill" />
        </view>
      </view>

      <view class="card">
        <text class="card-title">备注（可选）</text>
        <textarea
          v-model="note"
          class="note-input"
          placeholder="如：货物完好 / 缺件 / 包装破损等"
          maxlength="200"
        />
      </view>

      <view class="action-row">
        <button class="btn-secondary" @click="prev">上一步</button>
        <button class="btn-confirm" :disabled="submitting" @click="next">
          {{ submitting ? '提交中...' : '✅ 确认签收' }}
        </button>
      </view>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding-bottom: 200rpx;
}
/* Frame 模式下：用 100% 替代 100vh */
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100%;
  overflow-y: auto;
}
.status-bar { height: 40rpx; background: var(--color-brand); }

.header {
  background: var(--color-brand);
  padding: 0 var(--space-md) var(--space-md);
  color: var(--color-text-on-brand);
}
.header-title {
  display: block;
  font-size: var(--font-size-title);
  font-weight: 700;
  margin-bottom: var(--space-xs);
}
.header-meta {
  display: flex;
  gap: var(--space-md);
  opacity: 0.85;
}
.header-meta-text {
  font-size: var(--font-size-mini);
}

/* ===== 错误页 ===== */
.error-page {
  text-align: center;
  padding: 200rpx var(--space-md);
}
.error-icon {
  width: 120rpx;
  height: 120rpx;
  color: var(--color-status-cancelled);
  margin-bottom: var(--space-md);
}
.error-title {
  display: block;
  font-size: var(--font-size-title);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-sm);
}
.error-desc {
  display: block;
  font-size: var(--font-size-body);
  color: var(--color-text-secondary);
  line-height: 1.6;
}

/* ===== 成功页 ===== */
.success-page {
  text-align: center;
  padding: 200rpx var(--space-md);
}
.success-icon-wrap {
  width: 160rpx;
  height: 160rpx;
  border-radius: 50%;
  background: var(--color-status-completed-bg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto var(--space-md);
}
.success-icon {
  width: 96rpx;
  height: 96rpx;
  color: var(--color-status-completed);
}
.success-title {
  display: block;
  font-size: var(--font-size-display);
  font-weight: 700;
  color: var(--color-status-completed);
  margin-bottom: var(--space-sm);
}
.success-desc {
  display: block;
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  margin-bottom: var(--space-xs);
}
.success-tip {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-xl);
}

/* ===== 步骤页 ===== */
.step-page {
  padding: var(--space-md);
}
.step-indicator {
  display: flex;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-md);
}
.step-num {
  width: 48rpx;
  height: 48rpx;
  border-radius: 50%;
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  font-size: var(--font-size-body);
  font-weight: 600;
  display: flex;
  align-items: center;
  justify-content: center;
}
.step-label {
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
}

.card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.card-title {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.card-desc {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  margin-bottom: var(--space-md);
}

.info-row {
  display: flex;
  align-items: center;
  padding: 12rpx 0;
  border-bottom: 1rpx solid var(--color-bg);
}
.info-row:last-child { border-bottom: none; }
.info-label {
  width: 140rpx;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.info-value {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.info-value.highlight {
  font-weight: 600;
  color: var(--color-brand);
}
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tip-card {
  background: var(--color-brand-bg);
  border-radius: var(--radius-md);
  padding: var(--space-sm);
  margin-bottom: var(--space-md);
  text-align: center;
}
.tip-text {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
}

/* 照片网格 */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: var(--space-sm);
  margin-top: var(--space-sm);
}
.photo-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--color-bg);
}
.photo-img {
  width: 100%;
  height: 100%;
}
.photo-remove {
  position: absolute;
  top: 4rpx;
  right: 4rpx;
  width: 40rpx;
  height: 40rpx;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  font-weight: 700;
}
.photo-add {
  aspect-ratio: 1;
  border: 2rpx dashed var(--color-divider);
  border-radius: var(--radius-md);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8rpx;
  background: var(--color-card);
}
.photo-add-icon {
  width: 60rpx;
  height: 60rpx;
  color: var(--color-text-placeholder);
}
.photo-add-text {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

/* 步骤 3 缩略图 */
.photo-row {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  flex-wrap: wrap;
}
.photo-thumb {
  width: 160rpx;
  height: 160rpx;
  border-radius: var(--radius-md);
  object-fit: cover;
}

/* 备注输入 */
.note-input {
  width: 100%;
  min-height: 160rpx;
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  border: 1rpx solid var(--color-divider);
  margin-top: var(--space-sm);
  box-sizing: border-box;
}

/* 按钮 */
.action-row {
  display: flex;
  gap: var(--space-md);
  margin-top: var(--space-lg);
}
.btn-primary, .btn-secondary, .btn-confirm {
  flex: 1;
  height: 88rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
}
.btn-primary {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
}
.btn-secondary {
  background: var(--color-card);
  color: var(--color-text-regular);
  border: 1rpx solid var(--color-divider);
}
.btn-confirm {
  background: var(--color-status-completed);
  color: var(--color-text-on-brand);
  flex: 2;
}
.btn-primary[disabled], .btn-confirm[disabled] {
  opacity: 0.5;
}
.success-page .btn-primary {
  flex: none;
  width: 280rpx;
  margin: 0 auto;
}
</style>