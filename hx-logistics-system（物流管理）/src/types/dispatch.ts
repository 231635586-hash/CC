import type { DispatchStatus, Timestamp } from './index'

/** 调车单 */
export interface Dispatch {
  id: string
  dispatchNo: string // 调车编号（预生成）
  status: DispatchStatus
  direction: string // 城市字符串，如 "上海" / "杭州"
  expectedLoadTime: Timestamp // 期望装货时间
  remark?: string
  creatorId: string
  creatorName: string
  companyId: string // 物流公司 ID
  companyName: string
  yardId: string // 园区 ID
  yardName: string
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
