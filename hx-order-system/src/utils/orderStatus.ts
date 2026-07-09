import type { Dispatch } from '@/types/dispatch'
import { DISPATCH_STATUS_OPTIONS } from '@/types'
import {
  DISPATCH_TO_ORDER_STATUS,
  ORDER_STATUS_OPTIONS,
  type OrderStatus,
} from '@/types/order'

/**
 * 订单主状态派生工具（纯函数，不碰 store）
 *
 * 阶段一：一张调车单 ≈ 一次发货订单，直接由 `Dispatch.status` 派生订单主状态。
 */

/** 由调车单派生订单主状态 */
export function deriveOrderStatus(d: Dispatch): OrderStatus {
  return DISPATCH_TO_ORDER_STATUS[d.status] ?? 'draft'
}

/** 订单主状态展示配置 */
export function orderStatusOption(status: OrderStatus) {
  return ORDER_STATUS_OPTIONS.find((o) => o.value === status)
}

/** 当前子状态中文标签（现场操作精度，复用 DISPATCH_STATUS_OPTIONS） */
export function orderSubStatusLabel(d: Dispatch): string {
  return DISPATCH_STATUS_OPTIONS.find((o) => o.value === d.status)?.label ?? d.status
}

/** 当前子状态色板 */
export function orderSubStatusColor(d: Dispatch): string {
  return DISPATCH_STATUS_OPTIONS.find((o) => o.value === d.status)?.color ?? 'default'
}
