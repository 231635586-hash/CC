/**
 * 司机端 UI 状态 store（v0.2.x 重构抽出 + D-Fix-9 默认路由修复）
 *
 * 收纳 Tab 级别的 UI 状态（D-Fix-9/11 后）：
 *  - activeTab：当前 派车单 / 消息 / 我的（默认 orders）
 *  - orderSubTab：派车单内子 Tab（进行中/待出发/已完成）
 *  - msgFilter：消息筛选（全部/未读/库房通知）
 *  - gpsSubTab：GPS 子 Tab（入园/离厂，D-Fix-6 后 UI 移除但 state 保留）
 *
 * D-Fix-9 修复：
 *  - 默认 activeTab 从 'workbench' 改为 'orders'
 *  - 原因：D-Fix-6 移除 WorkbenchTab 后,司机端默认进入空白内容
 *  - 修复：resetForRole('driver') 重置为 'orders',直接显示派车单列表
 *
 * D-Fix-11 修复：
 *  - 公司端默认 activeTab 从 'orders' 改为 'assign'
 *  - 原因：D-Fix-8 移除 ToConfirmTab（待确认）后,'orders' 在公司端已无对应渲染
 *  - 修复：resetForRole('company') 重置为 'assign',直接显示待派车列表
 *
 * 设计动机（v0.2.x Plan B 拆 5 Tab 组件）：
 *  - 这些状态原本散在 orders/index.vue 的 5 个 ref
 *  - 用 v-if 切换 Tab 时 ref 会被销毁，导致：
 *    · 用户在 Orders 选了"待出发"，切到 GPS 再切回来 → 重置为"进行中"
 *    · 用户在 Messages 选了"未读"，切到 Me 再切回来 → 重置为"全部"
 *  - 提到 pinia 后，所有 Tab 共享同一份 state，切换不重置
 *
 * 不持久化：跨页面导航（H5 stack push/pop）pinia 实例不变，无需 storage；
 *           真要跨"重新打开浏览器"保留，再加 STORAGE_KEY。
 */

import { defineStore } from 'pinia'
import type { TabKey, UserRole, OrderSubTab, GpsSubTab, MessageFilter } from '@/types/driver'

interface UiState {
  activeTab: TabKey
  orderSubTab: OrderSubTab
  msgFilter: MessageFilter
  gpsSubTab: GpsSubTab
}

/** 按角色给定 activeTab 默认值（D-Fix-11）
 *  - driver：派车单（D-Fix-9 修复）
 *  - salesperson：调车单（orders）
 *  - company：待派车（assign，D-Fix-11 修复）
 */
function defaultActiveTabForRole(role: UserRole): TabKey {
  switch (role) {
    case 'driver': return 'orders'
    case 'salesperson': return 'orders'
    case 'company': return 'assign'  // D-Fix-11：公司端默认进入【待派车】Tab
  }
}

export const useUiStore = defineStore('ui', {
  state: (): UiState => ({
    activeTab: 'orders',
    orderSubTab: 'active',
    msgFilter: 'all',
    gpsSubTab: 'in',
  }),

  actions: {
    setActiveTab(tab: TabKey) {
      this.activeTab = tab
    },
    setOrderSubTab(tab: OrderSubTab) {
      this.orderSubTab = tab
    },
    setMsgFilter(f: MessageFilter) {
      this.msgFilter = f
    },
    setGpsSubTab(t: GpsSubTab) {
      this.gpsSubTab = t
    },
    /**
     * 按角色重置 activeTab（解决角色切换后 activeTab 残留导致内容空白）
     * 调用时机：salesperson/index.vue + company/index.vue + driver/orders/index.vue onLoad
     * 不重置 orderSubTab / msgFilter / gpsSubTab（用户在这些 Tab 内的子 Tab 选择是有意义的本地状态）
     */
    resetForRole(role: UserRole) {
      this.activeTab = defaultActiveTabForRole(role)
    },
  },
})