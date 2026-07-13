<script setup lang="ts">
/**
 * 状态徽章 — 统一所有 H5 页面显示派车单/物流状态
 *
 * 用法：<StatusTag :status="dispatch.status" />
 *
 * 设计原则：
 *   - 单文件单职责：只负责渲染 + 颜色映射
 *   - CSS 走 scoped,避免污染
 *   - status 字段为强类型 DispatchStatus,IDE 自动补全
 */

import { computed } from 'vue'
import { DISPATCH_STATUS_MAP } from '@/constants/dispatchStatus'
import type { DispatchStatus } from '@/mock/dispatches'

interface Props {
  status: DispatchStatus
}
const props = defineProps<Props>()

const info = computed(() => DISPATCH_STATUS_MAP[props.status])
</script>

<template>
  <view :class="['status-tag', 'tag-' + info.cssClass]">
    {{ info.label }}
  </view>
</template>

<style scoped>
.status-tag {
  font-size: var(--font-size-mini);
  padding: 4rpx 16rpx;
  border-radius: var(--radius-sm);
  font-weight: 500;
  display: inline-block;
  line-height: 1.4;
  white-space: nowrap;
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
.tag-transit {
  color: #1d39c4;
  background: #f0f5ff;
}
</style>
