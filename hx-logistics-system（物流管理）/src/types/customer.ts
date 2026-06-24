// 客户档案类型定义

export type CustomerStatus = 'active' | 'inactive'

export interface Customer {
  id: string                  // 系统编号：CUS-YYYY-XXXX
  code?: string               // 客户编号（业务编号）
  name: string
  address: string
  contact?: string
  phone?: string
  status: CustomerStatus
  remark?: string
  createdAt: string           // ISO 日期
}

export const CUSTOMER_STATUS_LABEL: Record<CustomerStatus, string> = {
  active: '启用',
  inactive: '停用',
}

export const CUSTOMER_STATUS_COLOR: Record<CustomerStatus, string> = {
  active: 'green',
  inactive: 'default',
}

export const CUSTOMER_STATUS_OPTIONS = (Object.keys(CUSTOMER_STATUS_LABEL) as CustomerStatus[]).map(
  (v) => ({ label: CUSTOMER_STATUS_LABEL[v], value: v })
)
