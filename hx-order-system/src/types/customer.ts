// 客户档案类型定义

export type CustomerStatus = 'active' | 'inactive'

/**
 * 客户园区坐标（M2 新增）
 *
 * 用于 GPS 自动判定"车辆已到达客户园区"，触发 arrived_by_gps 状态
 * mock 阶段硬编码；真实阶段由 CRM 录入（高德地图选点）
 */
export interface CustomerSite {
  /** 园区中心经度（GCJ-02） */
  lng: number
  /** 园区中心纬度 */
  lat: number
  /** 入园判定半径（米），默认 200m */
  radiusM: number
  /** 签收联系人姓名 */
  contactName?: string
  /** 签收联系人电话 */
  contactPhone?: string
}

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

  // ===== 添加人（CRM 业务员）=====
  /** 添加人用户 id（关联 users.id） */
  creatorId?: string
  /** 添加人姓名（与 users.realName 对应；自动取当前登录用户） */
  creatorName?: string

  // ===== M2：客户园区 GPS 坐标 =====
  /** 客户园区坐标（mock 阶段硬编码；真实阶段录入） */
  site?: CustomerSite
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
