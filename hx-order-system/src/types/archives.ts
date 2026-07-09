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
  /** 默认司机 id（关联 Driver，可空） */
  defaultDriverId?: string
  status: EnableStatus
  remark?: string
  createdAt: Timestamp
}

/** 司机 */
export interface Driver {
  id: string
  /** 司机姓名 */
  name: string
  /** 手机号（车辆位置/调度用） */
  phone: string
  /** 关联物流公司 id */
  companyId: string
  /** 关联物流公司名（denormalized 便于展示） */
  companyName: string
  /** 身份证号 */
  idCardNo?: string
  /** 驾驶证号 */
  licenseNo?: string
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
  /**
   * 距秦壁园区 km（演示字段，由 mock 注入；GPS 流 tick 时实时计算）
   * 便于销售/调度在演示时直接报"这车距园区 X 公里，Y 分钟到"
   */
  distanceToQinbiKm?: number
  /** 距甘亭园区 km（演示字段，由 mock 注入；GPS 流 tick 时实时计算） */
  distanceToGantingKm?: number
}