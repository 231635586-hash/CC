/**
 * 用户角色 store（v0.3-MVP：H5 全员化）
 *
 * 设计动机：
 *  - H5 不再只是司机端，要支持 4 角色：driver / salesperson / company / customer
 *  - 不同角色看到不同的 TabBar 和功能
 *  - 客户（customer）通过 URL ?token= 进入签收页，不需要 TabBar 切换
 *  - 当前 H5 主要承担 3 个有 TabBar 的角色：driver / salesperson / company
 *
 * 持久化策略：
 *  - 当前角色存 localStorage（'hx_user_role'），重启保留
 *  - 切换角色不丢失已登录身份（M3+ 接统一账户体系）
 */

import { defineStore } from 'pinia'
import type { UserRole } from '@/types/driver'

const STORAGE_KEY = 'hx_user_role'

interface RoleState {
  currentRole: UserRole
  /** 当前登录身份标识（mock 阶段用 driver.id / salesperson.id / company.id） */
  currentUserId: string | null
}

function loadFromStorage(): Partial<RoleState> {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function saveToStorage(state: RoleState) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('[roleStore] save failed:', e)
  }
}

export const useRoleStore = defineStore('role', {
  state: (): RoleState => ({
    currentRole: 'driver',
    currentUserId: null,
    ...loadFromStorage(),
  }),

  getters: {
    /** 是否在司机模式 */
    isDriver: (s) => s.currentRole === 'driver',
    /** 是否在业务员模式 */
    isSalesperson: (s) => s.currentRole === 'salesperson',
    /** 是否在物流公司模式 */
    isCompany: (s) => s.currentRole === 'company',
    /** 是否有 TabBar 角色（customer 走 URL，不算） */
    hasTabBar: (s) => s.currentRole !== 'customer',
  },

  actions: {
    setRole(role: UserRole, userId?: string) {
      this.currentRole = role
      if (userId !== undefined) this.currentUserId = userId
      saveToStorage(this.$state)
    },

    /** 重置回默认（debug 用） */
    reset() {
      this.currentRole = 'driver'
      this.currentUserId = null
      uni.removeStorageSync(STORAGE_KEY)
    },
  },
})