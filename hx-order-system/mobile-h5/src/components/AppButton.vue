<script setup lang="ts">
/**
 * v0.3.0-M2.2 + O3：通用 Button 组件
 *
 * Why：
 *  - 散落 17 种 btn-* class 难以维护（.btn-assign / .btn-cancel / .btn-photo 等）
 *  - 各处按钮样式不一致（高度、圆角、间距、active 反馈）
 *  - 抽通用组件后统一管理
 *
 * 设计：
 *  - 4 种 variant：primary（主行动）/ secondary（白底主色边）/ ghost（白底灰边）/ danger（白底红边）
 *  - 3 种 size：sm（72rpx）/ md（80rpx 默认）/ lg（96rpx 大按钮）
 *  - block：宽度 100%（用于底部 bar）
 *  - icon：可选 SVG path，与现有 image icon 风格一致
 *  - disabled / loading：状态控制
 *
 * 使用示例：
 *   <AppButton variant="primary" size="md" @click="...">提交</AppButton>
 *   <AppButton variant="secondary" icon="/static/icons/list.svg" @click="...">详情</AppButton>
 *   <AppButton variant="danger" block @click="...">取消</AppButton>
 */

interface Props {
  /** 按钮变体 */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger'
  /** 按钮尺寸 */
  size?: 'sm' | 'md' | 'lg'
  /** 宽度 100%（用于底部 bar / 弹窗主按钮） */
  block?: boolean
  /** 可选图标 SVG 路径（与现有 image icon 一致） */
  icon?: string
  /** 禁用状态 */
  disabled?: boolean
  /** 加载状态 */
  loading?: boolean
  /** 自定义根样式类 */
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'primary',
  size: 'md',
  block: false,
  icon: '',
  disabled: false,
  loading: false,
  customClass: '',
})

const emit = defineEmits<{
  (e: 'click', event: any): void
}>()

function handleClick(e: any) {
  emit('click', e)
}
</script>

<template>
  <button
    :class="[
      'app-btn',
      `app-btn-${variant}`,
      `app-btn-${size}`,
      block ? 'app-btn-block' : '',
      disabled || loading ? 'app-btn-disabled' : '',
      customClass,
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <image v-if="icon && !loading" class="app-btn-icon" :src="icon" mode="aspectFit" />
    <text v-if="loading" class="app-btn-loading">⏳</text>
    <text class="app-btn-text">
      <slot />
    </text>
  </button>
</template>

<style scoped>
/* ===== 基础 ===== */
.app-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-xs);
  border-radius: var(--radius-md);
  font-weight: var(--font-weight-medium);
  font-family: inherit;
  cursor: pointer;
  transition:
    transform var(--motion-fast) var(--ease-out-quart),
    box-shadow var(--motion-fast) var(--ease-out-quart),
    opacity var(--motion-fast) var(--ease-out-quart);
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

/* ===== 尺寸 ===== */
.app-btn-sm {
  min-height: 64rpx;
  padding: 0 var(--space-md);
  font-size: var(--font-size-sub);
}
.app-btn-md {
  min-height: 80rpx;
  padding: 0 var(--space-lg);
  font-size: var(--font-size-body);
}
.app-btn-lg {
  min-height: 96rpx;
  padding: 0 var(--space-xl);
  font-size: var(--font-size-card-title);
}

/* ===== 变体 ===== */
.app-btn-primary {
  background: var(--color-brand);
  color: var(--color-text-on-brand);
  border: none;
}
.app-btn-primary:not(.app-btn-disabled):active {
  background: var(--color-brand-dark, #0958d9);
  transform: scale(0.985);
}

.app-btn-secondary {
  background: var(--color-card);
  color: var(--color-brand);
  border: 1rpx solid var(--color-brand);
}
.app-btn-secondary:not(.app-btn-disabled):active {
  background: var(--color-brand-bg);
}

.app-btn-ghost {
  background: var(--color-card);
  color: var(--color-text-regular);
  border: 1rpx solid var(--color-divider);
}
.app-btn-ghost:not(.app-btn-disabled):active {
  background: var(--color-bg);
}

.app-btn-danger {
  background: var(--color-card);
  color: #ff4d4f;
  border: 1rpx solid #ff4d4f;
}
.app-btn-danger:not(.app-btn-disabled):active {
  background: rgba(255, 77, 79, 0.06);
}

/* ===== 块级 ===== */
.app-btn-block {
  display: flex;
  width: 100%;
}

/* ===== 禁用 / loading ===== */
.app-btn-disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
.app-btn-loading {
  font-size: 32rpx;
  line-height: 1;
  color: currentColor;
  opacity: 0.7;
  animation: app-btn-spin 1s linear infinite;
}
@keyframes app-btn-spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* ===== 图标 ===== */
.app-btn-icon {
  width: 32rpx;
  height: 32rpx;
  flex-shrink: 0;
}
.app-btn-sm .app-btn-icon {
  width: 28rpx;
  height: 28rpx;
}
.app-btn-text {
  font: inherit;
  color: inherit;
  line-height: 1;
}

/* ===== Reduced-motion 降级 ===== */
@media (prefers-reduced-motion: reduce) {
  .app-btn {
    transition: none;
  }
  .app-btn-loading {
    animation: none;
  }
}
</style>