/**
 * 调车单状态字典（label + Tag CSS class）
 *
 * 用途：所有 H5 页面统一状态显示规则
 * 设计：CSS class 名以 `tag-` 开头，对应全局样式
 */

import type { DispatchStatus } from '@/mock/dispatches'

export interface StatusOption {
  label: string
  /** CSS class 名（不带前缀 tag-） */
  cssClass: 'pending' | 'entering' | 'loading' | 'leaving' | 'completed' | 'cancelled' | 'transit'
}

export const DISPATCH_STATUS_MAP: Record<DispatchStatus, StatusOption> = {
  draft:              { label: '草稿',     cssClass: 'cancelled' },
  pending_confirm:    { label: '待确认',   cssClass: 'cancelled' },
  confirmed:          { label: '已确认',   cssClass: 'cancelled' },
  dispatching:        { label: '派车中',   cssClass: 'cancelled' },
  // ❗ FIX(2026-07-14): 修正与 Web 端文案不一致
  //   Web (src/types/index.ts:36) 显示「已派车」,H5 历史显示「待出发」
  //   跨端演示时司机(H5)与库房员(Web)口径错位,统一改回「已派车」
  //   cssClass 'pending' 保持不变(状态机语义未改)
  dispatched:         { label: '已派车',   cssClass: 'pending' },
  // —— v0.3.0-M2.2 v2：GPS / 扫码统一入场 ——
  queued:             { label: '排队中',   cssClass: 'pending' },
  entering:           { label: '入园中',   cssClass: 'entering' },
  loading:            { label: '装货中',   cssClass: 'loading' },
  leaving:            { label: '出场中',   cssClass: 'leaving' },
  // —— M2 新增 ——
  in_transit:         { label: '在途中',   cssClass: 'transit' },
  driver_confirmed:   { label: '已确认',   cssClass: 'pending' },
  // —— 终态 ——
  completed:          { label: '已完成',   cssClass: 'completed' },
  cancelled:          { label: '已取消',   cssClass: 'cancelled' },
}

/** 用于 Tab 分组的关键状态 */
export const ACTIVE_STATUSES: DispatchStatus[] = [
  'dispatching',
  'dispatched',
  // v0.3.0-M2.2：新增 queued 到「进行中」分组(司机可扫码排队)
  'queued',
  'entering',
  'loading',
  'leaving',
  // M2 简化后:只保留 in_transit + driver_confirmed
  'in_transit',
  'driver_confirmed',
]
export const PENDING_STATUSES: DispatchStatus[] = ['pending_confirm', 'confirmed', 'draft']
export const DONE_STATUSES: DispatchStatus[] = ['completed', 'cancelled']

/**
 * 派车单状态时间线顺序（用于详情页 timeline 节点的「done」判断）
 *
 * 设计：ordered list,index 越大 = 越靠后
 * - 用 indexOf 比较避免重复枚举每一步之后的「已完成状态数组」
 * - 终态 cancelled / 初始 draft 不在列表内 → indexOf 返回 -1 → 所有步骤都判定为「未完成」(符合预期)
 */
export const TIMELINE_ORDER: DispatchStatus[] = [
  'pending_confirm',
  'confirmed',
  'dispatching',
  'dispatched',
  // v0.3.0-M2.2:在 dispatched 与 entering 之间插入 queued
  'queued',
  'entering',
  'loading',
  'leaving',
  'in_transit',
  'driver_confirmed',
  'completed',
]

/** 判断指定状态步骤是否已经到达（当前状态 index ≥ 步骤状态 index） */
export function isStepReached(step: DispatchStatus, current: DispatchStatus): boolean {
  return TIMELINE_ORDER.indexOf(current) >= TIMELINE_ORDER.indexOf(step)
}