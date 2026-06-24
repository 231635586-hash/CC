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
