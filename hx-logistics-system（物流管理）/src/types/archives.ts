import type { EnableStatus, Timestamp } from './index'
import type { TruckSize } from './dispatch'

/** 物流公司 */
export interface LogisticsCompany {
  id: string
  name: string
  code: string
  contactName: string
  contactPhone: string
  address: string
  businessLicense: string // 营业执照号
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
  // —— 业务扩展字段 ——
  /** 可提供车型（按车长枚举，与调车单 truckSize 保持一致） */
  vehicleTypes: TruckSize[]
  directions: string // 服务方向，逗号分隔城市，如 "杭州 / 上海"
  estimatedHours: number // 预计时长（小时，公司级单一时长）
}

/** 车辆 */
export interface Vehicle {
  id: string
  plateNo: string // 车牌号
  companyId: string
  companyName: string
  vehicleType: 'heavy' | 'medium' | 'light' // 重型/中型/轻型
  maxLoad: number // 最大载重（吨）
  length: number // 车长（米）
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
}

/** 车辆位置 */
export interface VehicleLocation {
  id: string
  vehicleId: string
  plateNo: string
  longitude: number
  latitude: number
  address?: string
  speed: number // km/h
  direction?: number // 0-360
  updatedAt: Timestamp
}