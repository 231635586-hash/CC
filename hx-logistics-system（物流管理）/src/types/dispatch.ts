import type { DispatchStatus, Timestamp } from './index'

/** 发运方式 */
export type ShippingMethod =
  | 'big_truck'    // 大车
  | 'small_truck'  // 小车
  | 'air'          // 空运
  | 'self_pickup'  // 自提
  | 'highway'      // 全程高速
  | 'internal'     // 内部调车

/** 车型（按车长） */
export type TruckSize = '4.2m' | '6.8m' | '13m' | '13.75m' | '17.5m'

export const SHIPPING_METHOD_LABEL: Record<ShippingMethod, string> = {
  big_truck: '大车',
  small_truck: '小车',
  air: '空运',
  self_pickup: '自提',
  highway: '全程高速',
  internal: '内部调车',
}

export const SHIPPING_METHOD_COLOR: Record<ShippingMethod, string> = {
  big_truck: 'red',
  small_truck: 'orange',
  air: 'cyan',
  self_pickup: 'green',
  highway: 'blue',
  internal: 'purple',
}

export const SHIPPING_METHOD_OPTIONS = (
  Object.keys(SHIPPING_METHOD_LABEL) as ShippingMethod[]
).map((v) => ({ label: SHIPPING_METHOD_LABEL[v], value: v }))

export const TRUCK_SIZE_LABEL: Record<TruckSize, string> = {
  '4.2m': '4.2 米',
  '6.8m': '6.8 米',
  '13m': '13 米',
  '13.75m': '13.75 米',
  '17.5m': '17.5 米',
}

export const TRUCK_SIZE_OPTIONS = (Object.keys(TRUCK_SIZE_LABEL) as TruckSize[]).map(
  (v) => ({ label: TRUCK_SIZE_LABEL[v], value: v })
)

/** 大车 / 小车车型分组（按车长划分） */
export const BIG_TRUCK_SIZES: TruckSize[] = ['13m', '13.75m', '17.5m']
export const SMALL_TRUCK_SIZES: TruckSize[] = ['4.2m', '6.8m']

/** 调车单 */
export interface Dispatch {
  id: string
  dispatchNo: string // 调车编号（预生成）
  status: DispatchStatus
  direction: string // 城市字符串，如 "上海" / "杭州"
  expectedLoadTime: Timestamp // 期望装货时间 = 需求到场时间
  remark?: string
  creatorId: string
  creatorName: string
  companyId: string // 物流公司 ID
  companyName: string
  /** 园区 ID 列表（允许多选） */
  yardIds: string[]
  /** 优先入场园区（从 yardIds 中选一个） */
  primaryYardId: string
  /** 发运方式（必填） */
  shippingMethod: ShippingMethod
  /** 车型（仅大车/小车必填） */
  truckSize?: TruckSize
  /** 是否拼车（true = 跨业务员库存） */
  isCarpool: boolean
  /** 是否紧急调车（仅系统管理员角色可勾选） */
  isUrgent: boolean
  vehicleId?: string
  vehicleNo?: string
  driverId?: string
  driverName?: string
  dispatcherId?: string // 调车员 ID
  dispatcherName?: string
  goods: DispatchGoods[] // 货物列表（1:N）
  createdAt: Timestamp
  updatedAt: Timestamp
  confirmedAt?: Timestamp
  dispatchedAt?: Timestamp
  enterYardAt?: Timestamp
  leaveYardAt?: Timestamp
  completedAt?: Timestamp
}

/** 调车单货物 */
export interface DispatchGoods {
  id: string
  dispatchId: string
  goodsName: string
  quantity: number
  unit: string
  weight?: number
  customerName?: string
  destination?: string
  remark?: string
  /** 来源库存 id（手工添加则为 undefined） */
  inventoryId?: string
}
