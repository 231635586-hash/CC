/**
 * 调车单状态字典（v0.2.0-M2 集中定义）
 *
 * 用于 StatusTag 组件注入的 {label, color} 映射。
 *
 * 替代此前在 OrderBoardPage / OrderDetailPage / WarehouseQueuePage 各自重复定义的 DISPATCH_STATUS_MAP。
 *
 * @example
 *   import { DISPATCH_STATUS_MAP } from '@/components/dispatch/dispatchStatusMap'
 *   <StatusTag value={d.status} map={DISPATCH_STATUS_MAP} />
 */

import { DISPATCH_STATUS_OPTIONS } from '@/types'
import type { DispatchStatus } from '@/types/dispatch'

export const DISPATCH_STATUS_MAP = Object.fromEntries(
  DISPATCH_STATUS_OPTIONS.map((o) => [o.value, { label: o.label, color: o.color }]),
) as Record<DispatchStatus, { label: string; color: string }>