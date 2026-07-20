<script setup lang="ts">
/**
 * v0.3.0-M2.2 + O2：友好错误页
 *
 * Why：
 *  - 全局错误处理跳转到这里，给用户友好提示而非白屏
 *  - 提供「重新加载」「返回首页」两个操作
 *
 * 设计：
 *  - 显示错误图标 + 错误文案
 *  - 开发模式下显示错误堆栈（折叠）
 *  - 显示错误时间戳（用户报告问题时可附）
 */

import { onLoad, onShow } from '@dcloudio/uni-app'
import { ref } from 'vue'

interface ErrorInfo {
  message: string
  stack: string
  timestamp: number
}

const errorInfo = ref<ErrorInfo | null>(null)
const showStack = ref(false)
const timeText = ref('')

function formatTime(ts: number): string {
  if (!ts) return '-'
  const d = new Date(ts)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function loadError() {
  try {
    const raw = uni.getStorageSync('__last_error')
    if (raw) {
      errorInfo.value = raw as ErrorInfo
      timeText.value = formatTime(raw.timestamp)
    } else {
      errorInfo.value = {
        message: '页面加载失败',
        stack: '',
        timestamp: Date.now(),
      }
      timeText.value = formatTime(Date.now())
    }
  } catch (e) {
    errorInfo.value = {
      message: '读取错误信息失败',
      stack: '',
      timestamp: Date.now(),
    }
    timeText.value = formatTime(Date.now())
  }
}

function reload() {
  // 清错误信息 + 跳回角色选择
  try {
    uni.removeStorageSync('__last_error')
  } catch (e) {
    // ignore
  }
  uni.reLaunch({ url: '/pages/role-select/index' })
}

function goHome() {
  // 返回上一次成功进入的角色页（兜底走 role-select）
  uni.reLaunch({ url: '/pages/role-select/index' })
}

function copyError() {
  if (!errorInfo.value) return
  const text = `[${timeText.value}]\n${errorInfo.value.message}\n\n${errorInfo.value.stack}`
  uni.setClipboardData({
    data: text,
    success: () => uni.showToast({ title: '错误信息已复制', icon: 'success' }),
  })
}

function toggleStack() {
  showStack.value = !showStack.value
}

onLoad(() => {
  loadError()
})

onShow(() => {
  loadError()
})
</script>

<template>
  <view class="page">
    <!-- 顶部错误图标 + 标题 -->
    <view class="error-hero">
      <view class="error-icon">⚠️</view>
      <text class="error-title">出错了</text>
      <text class="error-subtitle">页面遇到意外错误</text>
    </view>

    <!-- 错误信息卡 -->
    <view class="error-card">
      <view class="error-row">
        <text class="error-label">错误信息</text>
        <text class="error-message">{{ errorInfo?.message || '-' }}</text>
      </view>
      <view class="error-row">
        <text class="error-label">发生时间</text>
        <text class="error-value">{{ timeText }}</text>
      </view>

      <!-- 错误堆栈（可展开） -->
      <view v-if="errorInfo?.stack" class="error-stack-wrap">
        <view class="error-stack-toggle" @click="toggleStack">
          <text class="error-stack-label">错误堆栈</text>
          <text class="error-stack-arrow">{{ showStack ? '▲ 收起' : '▼ 展开' }}</text>
        </view>
        <view v-if="showStack" class="error-stack-box">
          <text class="error-stack-text">{{ errorInfo.stack }}</text>
        </view>
      </view>
    </view>

    <!-- 操作按钮组 -->
    <view class="action-group">
      <button class="btn-primary" @click="reload">
        <text class="btn-icon-text">↻</text>
        重新加载
      </button>
      <button class="btn-secondary" @click="copyError">
        <text class="btn-icon-text">📋</text>
        复制错误信息
      </button>
      <button class="btn-tertiary" @click="goHome">
        <text class="btn-icon-text">⌂</text>
        返回首页
      </button>
    </view>

    <!-- 提示文案 -->
    <view class="footer-tip">
      <text>如反复出现，请联系开发人员并附上错误信息</text>
    </view>
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-xl) var(--space-md);
  display: flex;
  flex-direction: column;
}
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100% !important;
}

/* ===== 错误头 ===== */
.error-hero {
  text-align: center;
  padding: var(--space-xl) var(--space-md);
  margin-bottom: var(--space-lg);
}
.error-icon {
  font-size: 96rpx;
  display: block;
  margin-bottom: var(--space-md);
}
.error-title {
  display: block;
  font-size: 48rpx;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.error-subtitle {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}

/* ===== 错误信息卡 ===== */
.error-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin-bottom: var(--space-lg);
  box-shadow: var(--shadow-sm);
}
.error-row {
  display: flex;
  align-items: flex-start;
  padding: var(--space-sm) 0;
  border-bottom: 1rpx dashed var(--color-bg);
}
.error-row:last-of-type {
  border-bottom: none;
}
.error-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  width: 140rpx;
  flex-shrink: 0;
  padding-top: 4rpx;
}
.error-message {
  flex: 1;
  font-size: var(--font-size-body);
  color: #ff4d4f;
  font-weight: var(--font-weight-medium);
  word-break: break-all;
}
.error-value {
  flex: 1;
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  font-family: var(--font-family-mono);
}

/* ===== 错误堆栈 ===== */
.error-stack-wrap {
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1rpx dashed var(--color-bg);
}
.error-stack-toggle {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-xs) 0;
}
.error-stack-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.error-stack-arrow {
  font-size: var(--font-size-sub);
  color: var(--color-brand);
}
.error-stack-box {
  margin-top: var(--space-sm);
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-sm);
  max-height: 360rpx;
  overflow-y: auto;
}
.error-stack-text {
  display: block;
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  font-family: monospace;
  word-break: break-all;
  white-space: pre-wrap;
  line-height: 1.4;
}

/* ===== 操作按钮 ===== */
.action-group {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  margin-bottom: var(--space-lg);
}
.btn-primary,
.btn-secondary,
.btn-tertiary {
  height: 88rpx;
  border-radius: var(--radius-md);
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-medium);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-sm);
}
.btn-primary {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  border: none;
}
.btn-secondary {
  background: var(--color-card);
  color: var(--color-brand);
  border: 1rpx solid var(--color-brand);
}
.btn-tertiary {
  background: var(--color-card);
  color: var(--color-text-regular);
  border: 1rpx solid var(--color-divider);
}
.btn-icon-text {
  font-size: 32rpx;
  line-height: 1;
}

/* ===== 提示 ===== */
.footer-tip {
  text-align: center;
  font-size: var(--font-size-caption);
  color: var(--color-text-placeholder);
  margin-top: auto;
  padding-top: var(--space-md);
}
</style>