<script setup lang="ts">
/**
 * 空态组件
 * @example
 *   <EmptyState icon="/static/icons/list.svg" title="暂无派车单" desc="派车单会显示在这里" />
 */
interface Props {
  icon?: string
  title: string
  desc?: string
}

withDefaults(defineProps<Props>(), {
  icon: '/static/icons/list.svg',
})
</script>

<template>
  <view class="empty">
    <image class="empty-icon" :src="icon" mode="aspectFit" />
    <text class="empty-title">{{ title }}</text>
    <text v-if="desc" class="empty-desc">{{ desc }}</text>
  </view>
</template>

<style scoped>
.empty {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: 120rpx var(--space-lg);
  text-align: center;
  margin-top: var(--space-xl);
}
.empty-icon {
  display: block;
  width: 120rpx;
  height: 120rpx;
  margin: 0 auto var(--space-md);
  color: var(--color-text-placeholder);
}
.empty-title {
  display: block;
  font-size: var(--font-size-card-title);
  color: var(--color-text-regular);
  margin-bottom: var(--space-xs);
}
.empty-desc {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
  line-height: 1.5;
}
</style>