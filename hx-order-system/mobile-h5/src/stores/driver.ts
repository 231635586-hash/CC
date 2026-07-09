/**
 * 司机端 Pinia store（M3 阶段）
 *
 * 记录司机的本地状态：
 *  - currentDriver：当前登录司机身份（mock 阶段用"切换司机"下拉模拟）
 *  - queueHistory：排队登记历史（M2 兼容保留）
 *  - notifications：库房推送消息（"通知出发"/"通知装货"）
 *
 * 真实数据通过 postMessage 与 Web 端同步；这里仅做 UI 状态管理。
 *
 * 持久化策略：
 *  - 单一 storage key：'driver_state'
 *  - 启动时从 storage 加载，状态变更时自动同步
 *  - 封装在 store 内部，对外暴露 actions / getters 即可
 */

import { defineStore } from 'pinia'

export interface DriverInfo {
  id: string
  name: string
  phone: string
}

export interface NotificationItem {
  type: 'depart' | 'loading'
  title: string
  content: string
  time: string
  dispatchId: string
}

interface QueueRecord {
  yardId: string
  yardName: string
  queuedAt: string
  token: string
}

const STORAGE_KEY = 'driver_state'

interface DriverState {
  currentDriver: DriverInfo | null
  queueHistory: QueueRecord[]
  notifications: NotificationItem[]
}

/** 持久化读取（启动时一次性） */
function loadFromStorage(): Partial<DriverState> {
  try {
    const raw = uni.getStorageSync(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

/** 持久化写入 */
function saveToStorage(state: DriverState) {
  try {
    uni.setStorageSync(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('[driverStore] saveToStorage failed:', e)
  }
}

export const useDriverStore = defineStore('driver', {
  state: (): DriverState => ({
    currentDriver: null,
    queueHistory: [],
    notifications: [],
    ...loadFromStorage(),
  }),

  actions: {
    /** 设置当前司机身份 */
    setDriver(d: DriverInfo) {
      this.currentDriver = d
      saveToStorage(this.$state)
    },

    /** 推入一条库房消息（mock 阶段由 PC 端 postMessage 调；真实阶段同） */
    pushNotification(n: NotificationItem) {
      this.notifications.unshift(n)
      // 限 20 条
      if (this.notifications.length > 20) this.notifications.length = 20
      saveToStorage(this.$state)
    },

    /** 清空消息 */
    clearNotifications() {
      this.notifications = []
      saveToStorage(this.$state)
    },

    /** 记录排队登记（M2 兼容保留） */
    recordQueue(yardId: string, yardName: string, token: string) {
      this.queueHistory.push({
        yardId,
        yardName,
        queuedAt: new Date().toISOString(),
        token,
      })
      saveToStorage(this.$state)
    },

    /** 重置 store（debug 用） */
    reset() {
      this.currentDriver = null
      this.queueHistory = []
      this.notifications = []
      uni.removeStorageSync(STORAGE_KEY)
    },
  },
})