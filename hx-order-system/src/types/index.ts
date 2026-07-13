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
  | 'entering'
  | 'loading'
  | 'leaving'
  // —— v0.2.0-M2 新增：到货处理 4 步状态 ——
  | 'in_transit'         // 车辆出厂/在途
  | 'arrived_by_gps'    // GPS 入客户园区
  | 'driver_confirmed'  // 司机手动确认到达
  | 'customer_signed'    // 客户签收完成（中间过渡态，签收后即 completed）
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
  { value: 'entering', label: '入园中', color: 'geekblue' },
  { value: 'loading', label: '装货中', color: 'purple' },
  { value: 'leaving', label: '出场中', color: 'magenta' },
  // —— M2 新增 ——
  { value: 'in_transit', label: '在途中', color: 'gold' },
  { value: 'arrived_by_gps', label: '已到客户', color: 'lime' },
  { value: 'driver_confirmed', label: '司机确认', color: 'cyan' },
  { value: 'customer_signed', label: '客户签收', color: 'green' },
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
