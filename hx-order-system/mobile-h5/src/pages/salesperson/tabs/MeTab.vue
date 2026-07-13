<script setup lang="ts">
/**
 * 业务员 我的 Tab（v0.3-MVP）
 *
 * 内容：业务员身份 + 切换角色 + 设置/帮助/关于（占位）
 * 依赖：roleStore (currentRole) + DEFAULT_SALESPERSON
 */

import { useRoleStore } from '@/stores/role'
import { DEFAULT_SALESPERSON } from '@/mock/salespeople'

const roleStore = useRoleStore()
const sp = DEFAULT_SALESPERSON

function switchRole() {
  uni.reLaunch({ url: '/pages/role-select/index' })
}
</script>

<template>
  <view class="tab-pane">
    <view class="me-profile">
      <view class="me-avatar">
        <text>{{ sp.name.charAt(0) }}</text>
      </view>
      <view class="me-info">
        <text class="me-name">{{ sp.name }}</text>
        <text class="me-phone">{{ sp.phone }}</text>
        <text class="me-role">当前角色：营销业务员</text>
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
      <view class="me-item" @click="uni.showToast({ title: '设置 - 待实现', icon: 'none' })">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/settings.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">设置</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="uni.showToast({ title: '帮助 - 待实现', icon: 'none' })">
        <view class="me-item-icon">
          <image class="me-svg" src="/static/icons/bell.svg" mode="aspectFit" />
        </view>
        <text class="me-item-label">帮助与反馈</text>
        <text class="me-item-arrow">›</text>
      </view>
      <view class="me-item" @click="uni.showToast({ title: '关于 - v0.3.0-MVP', icon: 'none' })">
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
  background: #13c2c2;
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
  margin-bottom: 8rpx;
}
.me-role {
  display: inline-block;
  padding: 4rpx 12rpx;
  font-size: var(--font-size-mini);
  color: #13c2c2;
  background: rgba(19, 194, 194, 0.1);
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