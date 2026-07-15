/**
 * 业务通用类型定义 + 聚合导出
 */

/** 通用启用/停用 */
export type EnableStatus = 'enabled' | 'disabled'

/** 时间戳 */
export type Timestamp = string

/** 业务状态枚举：调车单状态 */
export type DispatchStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'dispatching'
  | 'dispatched'
  // —— M2.2 v2 状态机:GPS / 扫码统一入场,新增排队中状态
  | 'queued'           // 排队中(GPS 检测或扫码登记,等待道闸放行)
  | 'entering'
  | 'loading'
  | 'leaving'
  // —— M2 到货处理:在途 → 司机手动确认 → 完成
  | 'in_transit'         // 车辆出厂/在途
  | 'driver_confirmed'  // 司机手动确认到达
  // —— 终态 ——
  | 'completed'
  | 'cancelled'

/** 调车单状态选项 */
export const DISPATCH_STATUS_OPTIONS: { value: DispatchStatus; label: string; color: string }[] = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'pending_confirm', label: '待确认', color: 'orange' },
  { value: 'confirmed', label: '已确认', color: 'blue' },
  { value: 'dispatching', label: '派车中', color: 'processing' },
  { value: 'dispatched', label: '已派车', color: 'cyan' },
  // —— M2.2 v2 新状态:排队中(GPS / 扫码统一入场)
  { value: 'queued', label: '排队中', color: 'gold' },
  { value: 'entering', label: '入园中', color: 'geekblue' },
  { value: 'loading', label: '装货中', color: 'purple' },
  { value: 'leaving', label: '出场中', color: 'magenta' },
  // —— M2 到货处理流程
  { value: 'in_transit', label: '在途中', color: 'gold' },
  { value: 'driver_confirmed', label: '司机确认', color: 'cyan' },
  // —— 终态 ——
  { value: 'completed', label: '已完成', color: 'success' },
  { value: 'cancelled', label: '已取消', color: 'error' },
]

/** 通用分页参数 */
export interface PageParams {
  pageNum: number
  pageSize: number
  keyword?: string
}

/** 通用分页响应 */
export interface PageResult<T> {
  list: T[]
  total: number
  pageNum: number
  pageSize: number
}

// 聚合导出所有子模块类型
export * from './dispatch'
export * from './archives'
export * from './system'
