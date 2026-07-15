/**
 * 用户角色 store（v0.3.0-M2.2：3 角色模型）
 *
 * 设计动机：
 *  - H5 3 个角色:driver / salesperson / company
 *  - 不同角色看到不同的 TabBar 和功能
 *  - v0.3.0-M2.2 移除客户角色:
 *    状态机 v2 抛弃"客户签收"环节,司机 H5【确认到达】即触发 completed
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
    // ❌ v0.3.0-M2.2 删除:hasTabBar（customer 角色已下线，3 角色全有 TabBar）
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