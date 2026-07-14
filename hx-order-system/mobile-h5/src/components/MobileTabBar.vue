<script setup lang="ts">
/**
 * 移动端底部 TabBar（uni-app / Vue 3）
 *
 * 用途：替代 driver / salesperson / company 三个 index.vue 各自维护的 .tabbar 块
 * 设计：
 *  - items 由调用方传入（每个 index 顶部有自己的业务 Tab 列表）
 *  - 主题色读 var(--color-brand)，由 App.vue 注入
 *  - 保留 Frame 模式 hack（html.hx-frame-on 限制 max-width 390rpx）
 *  - 保留 env(safe-area-inset-bottom) iPhone 底部安全区
 *
 * 涉及的页面（已迁移 / 待迁移）：
 *  - driver/orders/index.vue     ◯ TODO
 *  - salesperson/index.vue       ◯ TODO
 *  - company/index.vue           ◯ TODO
 */
import type { PropType } from 'vue'

export interface TabBarItem {
  /** 唯一 key（与调用方 switchTab 入参一致） */
  key: string
  /** 文字 label */
  label: string
  /** 图标 URL（uni-app 仅支持 image src，不支持内嵌 SVG） */
  icon: string
}

defineProps({
  items: {
    type: Array as PropType<TabBarItem[]>,
    required: true,
  },
  activeKey: {
    type: String,
    required: true,
  },
})

const emit = defineEmits<{
  (e: 'change', key: string): void
}>()

function handleClick(key: string) {
  emit('change', key)
}
</script>

<template>
  <view class="tabbar">
    <view
      v-for="t in items"
      :key="t.key"
      class="tabbar-item"
      :class="{ active: activeKey === t.key }"
      @click="handleClick(t.key)"
    >
      <image class="tabbar-icon" :src="t.icon" mode="aspectFit" />
      <text class="tabbar-label">{{ t.label }}</text>
    </view>
  </view>
</template>

<style scoped>
/* =============================================
 * 底部 TabBar(由 src/App.vue 提供 --color-* CSS variables)
 * Frame 模式:html.hx-frame-on 限制 max-width 跟 Frame 等宽 390rpx
 * ============================================= */
.tabbar {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  min-height: 130rpx;
  background: var(--color-card);
  border-top: 1rpx solid var(--color-divider);
  display: flex;
  align-items: center;
  z-index: 100;
  padding-bottom: env(safe-area-inset-bottom);
  -webkit-tap-highlight-color: transparent;
  -webkit-backface-visibility: hidden;
  backface-visibility: hidden;
}
html.hx-frame-on .tabbar {
  max-width: 390px !important;
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
  font-weight: var(--font-weight-semibold);
}
.tabbar-item.active .tabbar-icon {
  filter: drop-shadow(0 0 8rpx rgba(22, 119, 255, 0.3));
  color: var(--color-brand);
}
.tabbar-item .tabbar-icon {
  color: var(--color-text-secondary);
}
</style>
