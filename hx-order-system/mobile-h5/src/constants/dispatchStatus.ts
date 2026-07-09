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
  cssClass: 'pending' | 'entering' | 'loading' | 'leaving' | 'completed' | 'cancelled'
}

export const DISPATCH_STATUS_MAP: Record<DispatchStatus, StatusOption> = {
  draft:            { label: '草稿',   cssClass: 'cancelled' },
  pending_confirm:  { label: '待确认', cssClass: 'cancelled' },
  confirmed:        { label: '已确认', cssClass: 'cancelled' },
  dispatching:      { label: '派车中', cssClass: 'cancelled' },
  dispatched:       { label: '待出发', cssClass: 'pending' },
  entering:         { label: '入园中', cssClass: 'entering' },
  loading:          { label: '装货中', cssClass: 'loading' },
  leaving:          { label: '出场中', cssClass: 'leaving' },
  completed:        { label: '已完成', cssClass: 'completed' },
  cancelled:        { label: '已取消', cssClass: 'cancelled' },
}

/** 用于 Tab 分组的关键状态 */
export const ACTIVE_STATUSES: DispatchStatus[] = ['dispatching', 'dispatched', 'entering', 'loading', 'leaving']
export const PENDING_STATUSES: DispatchStatus[] = ['pending_confirm', 'confirmed', 'draft']
export const DONE_STATUSES: DispatchStatus[] = ['completed', 'cancelled']