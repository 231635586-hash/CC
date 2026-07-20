<script setup lang="ts">
/**
 * v0.3.0-M2.2 + O3：通用 Card 组件
 *
 * Why：
 *  - 散落 .card / .dispatch-card / .inv-card / .yard-row 等魔数 class
 *  - 各处卡片 padding / 圆角 / 阴影不一致
 *  - 抽通用组件后统一管理
 *
 * 设计：
 *  - 默认 variant：基础卡片（白底圆角阴影）
 *  - 3 种 variant：default（默认）/ flat（无阴影）/ elevated（强阴影）
 *  - 2 种 padding：md（默认 24rpx）/ sm（16rpx）/ lg（32rpx）
 *  - hoverable：点击反馈（缩放 + 阴影加深）
 *  - header / footer slot：可选标题区 / 操作区
 *
 * 使用示例：
 *   <AppCard>
 *     <text>内容</text>
 *   </AppCard>
 *   <AppCard variant="elevated" hoverable @tap="...">
 *     <template #header>标题</template>
 *     默认 slot
 *   </AppCard>
 */

interface Props {
  /** 卡片变体 */
  variant?: 'default' | 'flat' | 'elevated'
  /** 内边距 */
  padding?: 'sm' | 'md' | 'lg'
  /** 点击反馈（按压缩放 + 阴影加深） */
  hoverable?: boolean
  /** 自定义根样式类 */
  customClass?: string
}

withDefaults(defineProps<Props>(), {
  variant: 'default',
  padding: 'md',
  hoverable: false,
  customClass: '',
})

const emit = defineEmits<{
  (e: 'tap', event: any): void
}>()

function handleTap(e: any) {
  emit('tap', e)
}
</script>

<template>
  <view
    :class="[
      'app-card',
      `app-card-${variant}`,
      `app-card-pad-${padding}`,
      hoverable ? 'app-card-hoverable' : '',
      customClass,
    ]"
    @click="handleTap"
  >
    <!-- 标题区（可选） -->
    <view v-if="$slots.header" class="app-card-header">
      <slot name="header" />
    </view>

    <!-- 默认内容 -->
    <view class="app-card-body">
      <slot />
    </view>

    <!-- 操作区（可选） -->
    <view v-if="$slots.footer" class="app-card-footer">
      <slot name="footer" />
    </view>
  </view>
</template>

<style scoped>
/* ===== 基础 ===== */
.app-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  box-sizing: border-box;
  overflow: hidden;
}

/* ===== 变体 ===== */
.app-card-default {
  box-shadow: var(--shadow-sm);
}
.app-card-flat {
  box-shadow: none;
  border: 1rpx solid var(--color-divider);
}
.app-card-elevated {
  box-shadow: var(--shadow-md);
}

/* ===== 内边距 ===== */
.app-card-pad-sm {
  padding: var(--space-sm);
}
.app-card-pad-md {
  padding: var(--space-md);
}
.app-card-pad-lg {
  padding: var(--space-lg);
}

/* ===== Hoverable ===== */
.app-card-hoverable {
  cursor: pointer;
  transition:
    transform var(--motion-fast) var(--ease-out-quart),
    box-shadow var(--motion-fast) var(--ease-out-quart);
  -webkit-tap-highlight-color: transparent;
}
.app-card-hoverable:active {
  transform: scale(0.985);
  box-shadow: var(--shadow-md);
}

/* ===== Header / Footer ===== */
.app-card-header {
  padding-bottom: var(--space-sm);
  margin-bottom: var(--space-sm);
  border-bottom: 1rpx solid var(--color-bg);
}
.app-card-footer {
  padding-top: var(--space-md);
  margin-top: var(--space-md);
  border-top: 1rpx solid var(--color-divider);
}

/* ===== Reduced-motion 降级 ===== */
@media (prefers-reduced-motion: reduce) {
  .app-card-hoverable {
    transition: none;
  }
}
</style>