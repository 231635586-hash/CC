import type { DispatchStatus } from './index'

/**
 * 订单主状态机（部门逻辑 → 订单逻辑 改造核心）
 *
 * 现有系统按 `DispatchStatus`（10 个细粒度子状态）驱动，且散落在营销/物流/库房
 * 各部门页面。订单逻辑在其之上派生「订单主状态」：4 个可协作主状态 + 2 个旁路，
 * 让营销/物流/库房在同一条订单状态线上协作，子状态（DispatchStatus）保留做现场精度。
 *
 * 注：这是纯派生层，不改动 `DispatchStatus` 原枚举与 store 流转逻辑。
 */
export type OrderStatus =
  | 'pending_accept' // 待受理（营销下单 → 物流确认）
  | 'scheduling'     // 调度中（确认 → 派车 → 已派车/待入场）
  | 'fulfilling'     // 履约中（入园 → 装货 → 出场）
  | 'completed'      // 已完成
  | 'cancelled'      // 已取消（旁路，不上看板）
  | 'draft'          // 草稿（仅列表可见，不上看板）

/** 订单主状态展示配置（label / 色板 / emoji，风格复刻 DISPATCH_STATUS_OPTIONS） */
export const ORDER_STATUS_OPTIONS: {
  value: OrderStatus
  label: string
  color: string
  emoji: string
  /** 推进该状态的部门（演示用，说明谁在这一环节操作） */
  dept: string
}[] = [
  { value: 'pending_accept', label: '待受理', color: 'orange', emoji: '🟠', dept: '营销 → 物流' },
  { value: 'scheduling', label: '调度中', color: 'blue', emoji: '🔵', dept: '物流调度' },
  { value: 'fulfilling', label: '履约中', color: 'purple', emoji: '🟣', dept: '库房 + 司机' },
  { value: 'completed', label: '已完成', color: 'success', emoji: '🟢', dept: '—' },
  { value: 'cancelled', label: '已取消', color: 'error', emoji: '⚪', dept: '—' },
  { value: 'draft', label: '草稿', color: 'default', emoji: '📝', dept: '营销' },
]

/** 看板列顺序（草稿 / 已取消不占看板，进「全部订单」列表） */
export const ORDER_BOARD_COLUMNS: OrderStatus[] = [
  'pending_accept',
  'scheduling',
  'fulfilling',
  'completed',
]

/** DispatchStatus（子状态） → OrderStatus（主状态）映射 */
export const DISPATCH_TO_ORDER_STATUS: Record<DispatchStatus, OrderStatus> = {
  draft: 'draft',
  pending_confirm: 'pending_accept',
  confirmed: 'scheduling',
  dispatching: 'scheduling',
  dispatched: 'scheduling',
  // —— 库房段（M3）：GPS 入园 → 装货 → 离厂 ——
  entering: 'fulfilling',
  loading: 'fulfilling',
  leaving: 'fulfilling',
  // —— v0.2.0-M2：到货处理 4 步（全归「履约中」列，子状态细化）——
  in_transit: 'fulfilling',
  arrived_by_gps: 'fulfilling',
  driver_confirmed: 'fulfilling',
  customer_signed: 'fulfilling',
  // —— 终态 ——
  completed: 'completed',
  cancelled: 'cancelled',
}
