/**
 * 司机端 Pinia store（v0.2.0-M2：到货处理）
 *
 * 记录司机的本地状态：
 *  - currentDriver：当前登录司机身份（mock 阶段用"切换司机"下拉模拟）
 *  - queueHistory：排队登记历史（M2 兼容保留）
 *  - notifications：库房推送消息
 *    * M3：depart（通知出发）/ loading（通知装货）/ arrive（GPS 入园）
 *    * M2：complete（装货完成）/ cancel（订单取消）
 *    * M2：arrived_prompt（已到达客户园区，请确认）
 *
 * 真实数据通过 postMessage 与 Web 端同步；这里仅做 UI 状态管理。
 *
 * 持久化策略：
 *  - 单一 storage key：'driver_state'
 *  - 启动时从 storage 加载，状态变更时自动同步
 *  - 封装在 store 内部，对外暴露 actions / getters 即可
 */

import { defineStore } from 'pinia'
import type { NotificationType, NotificationItem } from '@/types/shared/driver'
import type { DispatchPhoto } from '@/types/shared/dispatch'

/**
 * v0.3.0-M2.2（P0-1 重构）：
 *   - NotificationType / NotificationItem 抽到 @/types/shared/driver
 *   - 此处仅 import 引用，删除内联定义（修复 types 5 值 vs store 6 值不一致）
 *   - NotificationItem 统一含 id 字段（采用 types/driver.ts 原版）
 *   - markRead 内部查找从 dispatchId 改为 id 查找（与类型签名一致）
 *
 * v0.3.0-M2.2 + P0-3：新增 photos 状态 + addCompletionPhoto / getCompletionPhotos
 *   - mock 阶段 base64 存 localStorage；真实阶段预留 uni.uploadFile 改造点
 *   - 单派车单最多 5 张照片（防 localStorage 5MB 限制撑爆）
 */

export interface DriverInfo {
  id: string
  name: string
  phone: string
}

/** 单派车单照片上限（P0-3 mock 阶段保护 localStorage） */
const MAX_PHOTOS_PER_DISPATCH = 5

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
  /** P0-3：完单照片（dispatchId → DispatchPhoto[]），mock 阶段 base64 存 localStorage */
  photos: Record<string, DispatchPhoto[]>
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
    photos: {},
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
      // 限 30 条（M2 扩到 30）
      if (this.notifications.length > 30) this.notifications.length = 30
      saveToStorage(this.$state)
    },

    /** 标记单条已读 */
    markRead(id: string) {
      // P0-1 修复：改为按 NotificationItem.id 查找（统一字段，含 id 而非仅 dispatchId）
      const n = this.notifications.find((x) => x.id === id)
      if (n) n.read = true
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

    /**
     * P0-3：添加一张完单照片
     *  - base64 字符串（mock 阶段）或 CDN URL（真实阶段预留）
     *  - 单派车单最多 5 张，超出截断 + toast（消费方处理）
     *  - 自动持久化到 localStorage
     */
    addCompletionPhoto(dispatchId: string, data: string, capturedAt: string, location?: { lng: number; lat: number }) {
      if (!this.photos[dispatchId]) this.photos[dispatchId] = []
      const photo: DispatchPhoto = location
        ? { data, capturedAt, location }
        : { data, capturedAt }
      this.photos[dispatchId].push(photo)
      // 超出限制：截断（不抛错，避免阻塞完单流）
      if (this.photos[dispatchId].length > MAX_PHOTOS_PER_DISPATCH) {
        this.photos[dispatchId] = this.photos[dispatchId].slice(-MAX_PHOTOS_PER_DISPATCH)
      }
      saveToStorage(this.$state)
    },

    /**
     * P0-3：获取派车单的全部完单照片
     *  - 返回只读副本，避免消费方修改 store 内部 state
     */
    getCompletionPhotos(dispatchId: string): DispatchPhoto[] {
      return this.photos[dispatchId] ? [...this.photos[dispatchId]] : []
    },

    /** 重置 store（debug 用） */
    reset() {
      this.currentDriver = null
      this.queueHistory = []
      this.notifications = []
      this.photos = {}
      uni.removeStorageSync(STORAGE_KEY)
    },
  },
})