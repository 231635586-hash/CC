<script setup lang="ts">
/**
 * 消息 Tab（v0.2.x Plan B 抽出）
 *
 * 内容：3 筛选（全部/未读/库房通知）+ 时间分组（今天/昨天/更早）+ 一键已读
 * 依赖：notifications (props) + uiStore (msgFilter 持久化)
 */

import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import type { NotificationItem, NotificationType, MessageFilter } from '@/types/driver'
import { useUiStore } from '@/stores/ui'
import EmptyState from '@/components/EmptyState.vue'

const props = defineProps<{
  notifications: NotificationItem[]
}>()

const emit = defineEmits<{
  (e: 'markRead', n: NotificationItem): void
  (e: 'markAllRead'): void
}>()

const uiStore = useUiStore()
const { msgFilter } = storeToRefs(uiStore)

const unreadCount = computed(() => props.notifications.filter((n) => !n.read).length)

const filteredMessages = computed(() => {
  if (msgFilter.value === 'unread') return props.notifications.filter((n) => !n.read)
  if (msgFilter.value === 'yard') return props.notifications.filter((n) =>
    ['depart', 'loading', 'arrive', 'complete'].includes(n.type),
  )
  return props.notifications
})

const groupedMessages = computed(() => {
  const groups: { label: string; items: NotificationItem[] }[] = [
    { label: '今天', items: [] },
    { label: '昨天', items: [] },
    { label: '更早', items: [] },
  ]
  const now = Date.now()
  const oneDay = 24 * 60 * 60 * 1000
  filteredMessages.value.forEach((n) => {
    const diff = now - n.timestamp
    if (diff < oneDay) groups[0].items.push(n)
    else if (diff < 2 * oneDay) groups[1].items.push(n)
    else groups[2].items.push(n)
  })
  return groups.filter((g) => g.items.length > 0)
})

const msgTypeIcon = (type: NotificationType): { icon: string; bg: string } => {
  const map: Record<NotificationType, { icon: string; bg: string }> = {
    depart: { icon: '/static/icons/depart.svg', bg: 'var(--color-status-pending-bg)' },
    loading: { icon: '/static/icons/package.svg', bg: 'var(--color-status-loading-bg)' },
    arrive: { icon: '/static/icons/arrived.svg', bg: 'var(--color-status-entering-bg)' },
    complete: { icon: '/static/icons/done.svg', bg: 'var(--color-status-completed-bg)' },
    cancel: { icon: '/static/icons/cancel.svg', bg: 'var(--color-status-cancelled-bg)' },
  }
  return map[type]
}

const filterTabs: { key: MessageFilter; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'yard', label: '库房通知' },
]
</script>

<template>
  <view class="tab-pane">
    <view class="msg-header">
      <view class="msg-filter-tabs">
        <view
          v-for="f in filterTabs"
          :key="f.key"
          class="msg-filter-tab"
          :class="{ active: msgFilter === f.key }"
          @click="uiStore.setMsgFilter(f.key)"
        >
          {{ f.label }}
        </view>
      </view>
      <text class="msg-mark-all" @click="emit('markAllRead')">全部已读</text>
    </view>

    <view class="list">
      <EmptyState v-if="filteredMessages.length === 0" icon="/static/icons/bell.svg" title="暂无消息" desc="库房推送会显示在这里" />

      <view v-for="group in groupedMessages" :key="group.label" class="msg-group">
        <view class="msg-group-header">
          <text class="msg-group-label">{{ group.label }}</text>
          <view class="msg-group-line"></view>
          <text class="msg-group-count">{{ group.items.length }}</text>
        </view>

        <view
          v-for="n in group.items"
          :key="n.id"
          class="msg-card"
          :class="{ unread: !n.read }"
          @click="emit('markRead', n)"
        >
          <view class="msg-icon-wrap" :style="{ background: msgTypeIcon(n.type).bg }">
            <image class="msg-icon-svg" :src="msgTypeIcon(n.type).icon" mode="aspectFit" />
          </view>
          <view class="msg-body">
            <view class="msg-top">
              <text class="msg-title">{{ n.title }}</text>
              <text class="msg-time">{{ n.time }}</text>
            </view>
            <text class="msg-content">{{ n.content }}</text>
            <view v-if="n.dispatchId" class="msg-meta">
              <text class="msg-dispatch">派车单：{{ n.dispatchId }}</text>
            </view>
          </view>
          <view v-if="!n.read" class="unread-dot"></view>
        </view>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

.msg-header {
  background: var(--color-card);
  padding: var(--space-md);
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.msg-filter-tabs { display: flex; gap: var(--space-md); }
.msg-filter-tab {
  font-size: var(--font-size-body);
  color: var(--color-text-regular);
  padding: var(--space-xs) 0;
  position: relative;
}
.msg-filter-tab.active {
  color: var(--color-brand);
  font-weight: var(--font-weight-semibold);
}
.msg-filter-tab.active::after {
  content: '';
  position: absolute;
  bottom: -8rpx;
  left: 50%;
  transform: translateX(-50%);
  width: 32rpx;
  height: 4rpx;
  background: var(--color-brand);
  border-radius: 2rpx;
}
.msg-mark-all {
  font-size: var(--font-size-caption);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: var(--space-xs) var(--space-sm);
  border-radius: var(--radius-pill);
}

.msg-group { margin-top: var(--space-md); }
.msg-group-header {
  display: flex;
  align-items: center;
  margin-bottom: var(--space-sm);
  padding: 0 var(--space-md);
  gap: var(--space-sm);
}
.msg-group-label {
  font-size: var(--font-size-sub);
  color: var(--color-text-regular);
  font-weight: var(--font-weight-medium);
}
.msg-group-line {
  flex: 1;
  height: 1rpx;
  background: var(--color-divider);
}
.msg-group-count {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
}

.msg-card {
  background: var(--color-card);
  border-radius: var(--radius-lg);
  padding: var(--space-md);
  margin: 0 var(--space-md) var(--space-sm);
  display: flex;
  align-items: flex-start;
  position: relative;
  border: 1rpx solid var(--color-divider);
}
.msg-card.unread {
  background: #f0f7ff;
  border-color: #d6e8ff;
}
.msg-icon-wrap {
  width: 80rpx;
  height: 80rpx;
  border-radius: var(--radius-lg);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: var(--space-sm);
  flex-shrink: 0;
  overflow: hidden;
}
.msg-icon-svg {
  width: 44rpx;
  height: 44rpx;
  color: var(--color-brand);
}
.msg-body { flex: 1; min-width: 0; }
.msg-top {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: var(--space-xs);
}
.msg-title {
  font-size: var(--font-size-card-title);
  color: var(--color-text-regular);
}
.msg-card.unread .msg-title {
  color: var(--color-text-primary);
  font-weight: var(--font-weight-semibold);
}
.msg-time {
  font-size: var(--font-size-mini);
  color: var(--color-text-secondary);
  flex-shrink: 0;
  margin-left: var(--space-sm);
}
.msg-content {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
  line-height: var(--line-height-base);
  margin-bottom: var(--space-xs);
}
.msg-card.unread .msg-content {
  color: var(--color-text-regular);
}
.msg-meta {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: var(--space-xs);
}
.msg-dispatch {
  font-size: var(--font-size-mini);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  padding: 4rpx 12rpx;
  border-radius: var(--radius-sm);
}
.unread-dot {
  position: absolute;
  top: var(--space-md);
  right: var(--space-md);
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background: #ff4d4f;
}
</style>