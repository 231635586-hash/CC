<script setup lang="ts">
/**
 * 角色选择页（v0.3.0-M2.2：3 角色）
 *
 * 入口：
 *  - 启动 APP → 默认进这里（M3+ 接统一账户后改成登录后跳转）
 *  - 各 TabBar "我的" 页 → 点 [切换角色]
 *
 * 3 角色入口：
 *  - 司机     → /pages/driver/orders/index
 *  - 业务员   → /pages/salesperson/index
 *  - 物流公司 → /pages/company/index
 *
 * ❌ v0.3.0-M2.2 删除：客户入口（已下线客户签收全链路）
 */

import { ref } from 'vue'
import { useRoleStore } from '@/stores/role'
import { MOCK_SALESPEOPLE, DEFAULT_SALESPERSON } from '@/mock/salespeople'
import { MOCK_LOGISTICS_COMPANIES } from '@/mock/companies'
import { DEFAULT_DRIVER } from '@/mock/drivers'
import type { UserRole } from '@/types/driver'

const roleStore = useRoleStore()

interface RoleOption {
  role: UserRole
  icon: string
  title: string
  desc: string
  bg: string
}

const roles: RoleOption[] = [
  {
    role: 'driver',
    icon: '/static/icons/dashboard.svg',
    title: '司机',
    desc: '查看派车单 / GPS 入园离厂 / 接收消息',
    bg: 'linear-gradient(135deg, #1677ff 0%, #4096ff 100%)',
  },
  {
    role: 'salesperson',
    icon: '/static/icons/list.svg',
    title: '营销业务员',
    desc: '创建调车单 / 管理客户需求',
    bg: 'linear-gradient(135deg, #13c2c2 0%, #36cfc9 100%)',
  },
  {
    role: 'company',
    icon: '/static/icons/truck.svg',
    title: '物流公司',
    desc: '确认调车单 / 派车给司机和车辆',
    bg: 'linear-gradient(135deg, #fa8c16 0%, #ffa940 100%)',
  },
]

const selectedId = ref<string>('')

function pickDefaultUserId(role: UserRole): string {
  if (role === 'driver') return DEFAULT_DRIVER.id
  if (role === 'salesperson') return DEFAULT_SALESPERSON.id
  if (role === 'company') return MOCK_LOGISTICS_COMPANIES[0].id
  return ''
}

function enterRole(role: UserRole) {
  const userId = pickDefaultUserId(role)
  roleStore.setRole(role, userId)

  if (role === 'driver') {
    uni.reLaunch({ url: '/pages/driver/orders/index' })
  } else if (role === 'salesperson') {
    uni.reLaunch({ url: '/pages/salesperson/index' })
  } else if (role === 'company') {
    uni.reLaunch({ url: '/pages/company/index' })
  }
}
</script>

<template>
  <view class="page">
    <!-- 顶部欢迎语 -->
    <view class="hero">
      <text class="hero-title">华翔物流</text>
      <text class="hero-sub">v0.3.0-M2.2 · 3 角色协作</text>
    </view>

    <!-- 角色卡片 -->
    <view class="role-list">
      <view
        v-for="r in roles"
        :key="r.role"
        class="role-card"
        :style="{ background: r.bg }"
        @click="enterRole(r.role)"
      >
        <image class="role-icon" :src="r.icon" mode="aspectFit" />
        <view class="role-text">
          <text class="role-title">{{ r.title }}</text>
          <text class="role-desc">{{ r.desc }}</text>
        </view>
        <text class="role-arrow">›</text>
      </view>
    </view>

    <!-- ❌ v0.3.0-M2.2 删除：客户入口 -->
  </view>
</template>

<style scoped>
.page {
  min-height: 100vh;
  background: var(--color-bg);
  padding: var(--space-xl) var(--space-md);
}

.hero {
  text-align: center;
  margin-bottom: var(--space-xl);
}
.hero-title {
  display: block;
  font-size: 56rpx;
  font-weight: var(--font-weight-bold);
  color: var(--color-text-primary);
  margin-bottom: var(--space-xs);
}
.hero-sub {
  display: block;
  font-size: var(--font-size-caption);
  color: var(--color-text-secondary);
}

.role-list {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.role-card {
  display: flex;
  align-items: center;
  padding: var(--space-lg);
  border-radius: var(--radius-lg);
  color: var(--color-text-on-brand);
  gap: var(--space-md);
}
.role-icon {
  width: 80rpx;
  height: 80rpx;
  flex-shrink: 0;
}
.role-text {
  flex: 1;
  display: flex;
  flex-direction: column;
}
.role-title {
  font-size: var(--font-size-title);
  font-weight: var(--font-weight-bold);
  margin-bottom: 4rpx;
}
.role-desc {
  font-size: var(--font-size-caption);
  opacity: 0.9;
}
.role-arrow {
  font-size: 48rpx;
  font-weight: var(--font-weight-regular);
}

/* Frame 模式适配 */
html.hx-frame-on .page {
  min-height: 100% !important;
  height: 100%;
}
</style>