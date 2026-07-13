<script setup lang="ts">
/**
 * 我的 Tab（v0.2.x Plan B 抽出 + v0.3 加角色切换）
 *
 * 内容：司机信息 + 切换司机 + 切换角色(v0.3) + 设置/帮助/关于（占位）
 * 依赖：driverStore (currentDriver) + roleStore (currentRole)
 */

import { useDriverStore } from '@/stores/driver'
import { useRoleStore } from '@/stores/role'

const driverStore = useDriverStore()
const roleStore = useRoleStore()

const emit = defineEmits<{
  (e: 'switchDriver'): void
  (e: 'toast', msg: string): void
}>()

const ROLE_LABEL_MAP: Record<string, string> = {
  driver: '司机',
  salesperson: '营销业务员',
  company: '物流公司',
  customer: '客户',
}

function switchRole() {
  uni.reLaunch({ url: '/pages/role-select/index' })
}
</script>

<template>
  <view class="tab-pane">
    <view class="me-profile">
      <view class="me-avatar">
        <text>{{ driverStore.currentDriver?.name?.charAt(0) || '司' }}</text>
      </view>
      <view class="me-info">
        <text class="me-name">{{ driverStore.currentDriver?.name || '未设置' }}</text>
        <text class="me-phone">{{ driverStore.currentDriver?.phone || '-' }}</text>
        <text class="me-role">当前角色：{{ ROLE_LABEL_MAP[roleStore.currentRole] || '司机' }}</text>
      </view>
    </view>

    <view class="me-list">
      <view class="me-item" @click="switchRole">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/user.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">切换角色</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="emit('switchDriver')">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/refresh.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">切换司机</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="emit('toast', '设置 - 待实现')">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/settings.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">设置</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="emit('toast', '帮助 - 待实现')">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/bell.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">帮助与反馈</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="emit('toast', '关于 - v0.1.0')">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/info.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">关于</text>
        <text class="me-item-arrow">›</text>
      </view>
    </view>
  </view>
</template>

<style scoped>
.tab-pane { padding: 0; }

.me-profile {
  background: var(--color-card);
  margin: var(--space-md);
  border-radius: var(--radius-lg);
  padding: var(--space-xl) var(--space-md);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  box-shadow: var(--shadow-sm);
}
.me-avatar {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  background: var(--gradient-brand);
  color: var(--color-text-on-brand);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 60rpx;
  font-weight: var(--font-weight-semibold);
  flex-shrink: 0;
}
.me-info { flex: 1; }
.me-name {
  display: block;
  font-size: var(--font-size-card-title);
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.me-phone {
  display: block;
  font-size: var(--font-size-sub);
  color: var(--color-text-secondary);
}
.me-role {
  display: inline-block;
  margin-top: 8rpx;
  padding: 4rpx 12rpx;
  font-size: var(--font-size-mini);
  color: var(--color-brand);
  background: var(--color-brand-bg);
  border-radius: var(--radius-pill);
}

.me-list {
  background: var(--color-card);
  margin: 0 var(--space-md);
  border-radius: var(--radius-lg);
  overflow: hidden;
  box-shadow: var(--shadow-sm);
}
.me-item {
  display: flex;
  align-items: center;
  padding: var(--space-md);
  border-bottom: 1rpx solid var(--color-divider);
}
.me-item:last-child { border-bottom: none; }
.me-item-icon {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}
.me-svg {
  width: 36rpx;
  height: 36rpx;
  color: var(--color-text-regular);
}
.me-item-label {
  flex: 1;
  font-size: var(--font-size-body);
  color: var(--color-text-primary);
  margin-left: var(--space-sm);
}
.me-item-arrow {
  font-size: 32rpx;
  color: var(--color-text-placeholder);
  font-weight: var(--font-weight-regular);
}
</style>