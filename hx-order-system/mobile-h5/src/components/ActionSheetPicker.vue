<script setup lang="ts">
/**
 * ActionSheet Picker（v0.3-MVP 替代 uni-app picker）
 *
 * 背景：uni-app 的 <picker> 在生产构建中 runtime 不被 vite-plugin-uni 打包，
 *       导致 HBuilderX 预览能用、Chrome/Safari 不能用。
 * 方案：用 Vue 3 reactive + CSS 全屏遮罩 + 底部抽屉，自己实现 picker 交互。
 *       不依赖 uni-h5 的 picker runtime，100% 跨环境可用。
 *
 * 设计：
 *  - 点击 trigger 区域 → 显示全屏遮罩 + 底部 sheet
 *  - sheet 列出所有 options，点击选中后自动关闭
 *  - v-model:any 双向绑定值
 *
 * Props：
 *  - modelValue: 当前值
 *  - options: 字符串数组 或 {label, value} 对象数组
 *  - placeholder: 未选时显示文字
 *  - title: sheet 顶部标题
 */

interface OptionItem {
  label: string
  value: any
  sub?: string
}

const props = withDefaults(defineProps<{
  modelValue?: any
  options: (string | OptionItem)[]
  placeholder?: string
  title?: string
}>(), {
  placeholder: '请选择',
  title: '',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: any): void
}>()

const visible = ref(false)
const selectedIndex = ref<number>(-1)

function normalizeOptions(): OptionItem[] {
  return props.options.map((opt) => {
    if (typeof opt === 'string') {
      return { label: opt, value: opt }
    }
    return opt
  })
}

const normalizedOptions = computed(() => normalizeOptions())

const displayValue = computed(() => {
  if (props.modelValue === undefined || props.modelValue === null || props.modelValue === '') {
    return ''
  }
  const found = normalizedOptions.value.find((opt) => opt.value === props.modelValue)
  return found?.label || String(props.modelValue)
})

function open() {
  // 记录当前选中索引（用于默认高亮）
  selectedIndex.value = normalizedOptions.value.findIndex(
    (opt) => opt.value === props.modelValue,
  )
  visible.value = true
}

function close() {
  visible.value = false
}

function confirm() {
  if (selectedIndex.value >= 0 && selectedIndex.value < normalizedOptions.value.length) {
    emit('update:modelValue', normalizedOptions.value[selectedIndex.value].value)
  }
  close()
}

function selectOption(idx: number) {
  selectedIndex.value = idx
  // 选中即生效(单步操作,无需点"确定")
  emit('update:modelValue', normalizedOptions.value[idx].value)
  close()
}
</script>

<template>
  <!-- 触发区域 -->
  <view class="picker-trigger" @click="open">
    <text :class="displayValue ? 'picker-value' : 'picker-placeholder'">
      {{ displayValue || placeholder }}
    </text>
    <text class="picker-arrow">›</text>
  </view>

  <!-- 弹出层：全屏遮罩 + 底部 sheet -->
  <view v-if="visible" class="picker-mask" @click.self="close">
    <view class="picker-sheet" @click.stop>
      <view class="sheet-header">
        <text class="sheet-cancel" @click="close">取消</text>
        <text class="sheet-title">{{ title }}</text>
        <text class="sheet-confirm" @click="confirm">确定</text>
      </view>
      <scroll-view scroll-y class="sheet-body">
        <view
          v-for="(opt, idx) in normalizedOptions"
          :key="String(opt.value)"
          class="sheet-option"
          :class="{ selected: idx === selectedIndex }"
          @click="selectOption(idx)"
        >
          <text class="option-label">{{ opt.label }}</text>
          <text v-if="opt.sub" class="option-sub">{{ opt.sub }}</text>
          <text v-if="idx === selectedIndex" class="option-check">✓</text>
        </view>
      </scroll-view>
    </view>
  </view>
</template>

<style scoped>
.picker-trigger {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-sm);
  background: var(--color-bg);
  border-radius: var(--radius-md);
  min-height: 72rpx;
  cursor: pointer;
}
.picker-value {
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.picker-placeholder {
  font-size: var(--font-size-body);
  color: var(--color-text-placeholder);
}
.picker-arrow {
  font-size: 32rpx;
  color: var(--color-text-placeholder);
}

/* ===== 弹出层 ===== */
.picker-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  z-index: 9998;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  -webkit-tap-highlight-color: transparent;
  animation: fadeIn 0.18s ease;
  -webkit-animation: fadeIn 0.18s ease;
  /* Safari iOS: 阻止下拉橡皮筋 */
  overscroll-behavior: contain;
  -webkit-overflow-scrolling: touch;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
@-webkit-keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.picker-sheet {
  width: 100%;
  max-width: 750rpx;
  /* 优先用 dvh,fallback vh(桌面 Safari 不支持 dvh) */
  max-height: 70vh;
  max-height: 70dvh;
  background: var(--color-bg);
  border-radius: 24rpx 24rpx 0 0;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  -webkit-animation: slideUp 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  /* Safari 防止内容溢出 */
  -webkit-overflow-scrolling: touch;
}

@keyframes slideUp {
  from { transform: translateY(100%); -webkit-transform: translateY(100%); }
  to { transform: translateY(0); -webkit-transform: translateY(0); }
}
@-webkit-keyframes slideUp {
  from { transform: translateY(100%); -webkit-transform: translateY(100%); }
  to { transform: translateY(0); -webkit-transform: translateY(0); }
}

.sheet-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: var(--space-md);
  padding-top: calc(var(--space-md) + env(safe-area-inset-top)); /* Safari iOS notch */
  border-bottom: 1rpx solid var(--color-divider);
  background: var(--color-card);
  -webkit-user-select: none;
  user-select: none;
}
.sheet-cancel,
.sheet-confirm {
  font-size: var(--font-size-body);
  padding: 4rpx 12rpx;
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
}
.sheet-cancel {
  color: var(--color-text-secondary);
}
.sheet-confirm {
  color: #13c2c2;
  font-weight: var(--font-weight-medium);
}
.sheet-title {
  font-size: var(--font-size-body);
  font-weight: var(--font-weight-semibold);
  color: var(--color-text-primary);
}

.sheet-body {
  flex: 1;
  max-height: 60vh;
  max-height: 60dvh;
  background: var(--color-card);
  /* Safari: 弹性滚动 */
  -webkit-overflow-scrolling: touch;
  overflow-scrolling: touch;
  /* Safari: 内部滚动不会触发外层下拉刷新 */
  overscroll-behavior: contain;
}

.sheet-option {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1rpx solid var(--color-divider);
  cursor: pointer;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.12s ease;
  -webkit-transition: background 0.12s ease;
  -webkit-user-select: none;
  user-select: none;
}
.sheet-option:last-child { border-bottom: none; }
.sheet-option:active {
  background: var(--color-bg);
}
.sheet-option.selected {
  background: rgba(19, 194, 194, 0.06);
}
.option-label {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
}
.option-sub {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  margin-right: var(--space-sm);
}
.option-check {
  font-size: var(--font-size-body);
  color: #13c2c2;
  font-weight: var(--font-weight-bold);
}

/* Safari 减少动画偏好 */
@media (prefers-reduced-motion: reduce) {
  .picker-mask,
  .picker-sheet {
    animation: none !important;
    -webkit-animation: none !important;
    transition: none !important;
  }
}
</style>