/**
 * 通用状态 Tag
 * 统一所有表格/详情中"按枚举值显示带颜色的 Tag"的渲染模式
 */
import { Tag } from 'antd'

export interface StatusOption {
  label: string
  color: string
}

interface Props<T extends string> {
  /** 当前状态值 */
  value: T | undefined
  /** label/color 字典 */
  map: Record<T, StatusOption>
  /** 自定义 fallback（value 不在字典内时） */
  fallback?: string
}

/**
 * 状态 Tag：根据枚举值显示对应颜色和文字
 *
 * @example
 *   <StatusTag value="active" map={CUSTOMER_STATUS_RECORD} />
 *   <StatusTag value={status} map={SHIPPING_METHOD_LABEL_COLOR} />
 */
export function StatusTag<T extends string>({ value, map, fallback = '-' }: Props<T>) {
  if (!value) return <span style={{ color: '#ccc' }}>{fallback}</span>
  const opt = map[value]
  if (!opt) return <span style={{ color: '#ccc' }}>{value}</span>
  return <Tag color={opt.color}>{opt.label}</Tag>
}
