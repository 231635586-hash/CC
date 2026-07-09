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
  /** @deprecated M2 起由 yardTimelines 推导；保留字段做向后兼容 */
  enterYardAt?: Timestamp
  /** @deprecated M2 起由 yardTimelines 推导；保留字段做向后兼容 */
  leaveYardAt?: Timestamp
  completedAt?: Timestamp
  // —— 作废字段（仅 confirmed → cancelled 流转时记录）——
  voidedAt?: Timestamp
  voidedById?: string
  voidedByName?: string
  voidReason?: string
  // —— M2 多园区时间线 ——
  yardTimelines: YardTimeline[]
}

/**
 * 单园区时间线（M3 GPS 自动打卡）
 *
 * 完整流程：
 *  排队登记 → 库房通知出发 → 车辆 GPS 入园（自动） → 库房通知装货 → 装货完成 → 车辆 GPS 离厂（自动）
 *
 * 多园区时，按 yardIds 顺序排列；总装货离场时间 = 最后一条 leftAt；
 * 总等待时长 = 各园区 (enteredAt - queuedAt) 累加。
 */
export interface YardTimeline {
  yardId: string
  yardName?: string
  /** 司机排队登记时间 */
  queuedAt?: Timestamp
  /** 库房"通知出发"时间 */
  notifyDepartAt?: Timestamp
  /** 库房"通知装货"时间（loading 中间态触发器） */
  loadingNotifiedAt?: Timestamp
  /** GPS 入场时间 */
  enteredAt?: Timestamp
  /** 装货完成时间（库房人员勾选"装货完成"） */
  loadingCompletedAt?: Timestamp
  /** GPS 离场时间 */
  leftAt?: Timestamp
  /** 入场方式：'gps'（车辆硬件 GPS）| 'manual'（人工补录） */
  enteredVia?: 'gps' | 'manual'
  leftVia?: 'gps' | 'manual'
}

/**
 * 单园区调度时效指标（M2：调度时效分析模块核心数据结构）
 *
 * 业务规则（详见 utils/efficiencyAnalysis.ts）：
 *  1. queueDiffMin       - 排队与要求差异 = queuedAt - expectedLoadTime（多园区只算 primaryYardId）
 *  2. enterToLoadRawMin  - 装车耗时（原始差值，含禁行时段）
 *  3. effectiveLoadMin   - 装货用时（有效工作时间 = enterToLoadRawMin - restrictedMin）
 *  4. isOvertime / overtimeMin - 标准 4h 基准
 *  5. overtimeReasons    - 超时原因（多选，静态预设）
 *  6. overtimeDepartment - 超时责任部门（单选，静态预设）
 *  7. factoryOutTime     - 出厂时间（fallback: leftAt 或 loadingCompletedAt + 2h）
 */
export interface YardEfficiency {
  yardId: string
  yardName?: string
  /** 排队与要求差异（分钟；负=提前到达，正=迟到） */
  queueDiffMin: number
  /** 装车耗时（原始差值，含禁行时段，分钟） */
  enterToLoadRawMin: number
  /** 时间段内落入禁行时段的总时长（分钟） */
  restrictedMin: number
  /** 装货用时 = enterToLoadRawMin - restrictedMin（分钟） */
  effectiveLoadMin: number
  /** 标准用时基准（分钟）— 来自配置 */
  standardMin: number
  /** 是否超时（effectiveLoadMin > standardMin） */
  isOvertime: boolean
  /** 超时分钟数（0=未超时） */
  overtimeMin: number
  /** 超时原因（多选；isOvertime=false 时为空数组） */
  overtimeReasons: string[]
  /** 超时责任部门（单选；isOvertime=false 时为 undefined） */
  overtimeDepartment?: string
  /** 出厂时间（fallback 链：leftAt → loadingCompletedAt + 2h） */
  factoryOutTime?: Timestamp
  /** 是否多园区中的第一个园区（用于规则 3 的 ① 判断） */
  isFirstYard: boolean
}

/**
 * 调车单级调度时效汇总（M2）
 *
 * 多园区调车单的汇总指标：
 *  - totalEffectiveLoadMin = 累加每园区 effectiveLoadMin
 *  - totalOvertimeMin = 累加每园区 overtimeMin
 *  - finalExitTime = 最后园区 leftAt（规则 8）
 */
export interface DispatchEfficiency {
  dispatchId: string
  dispatchNo: string
  companyId: string
  companyName: string
  vehicleNo: string
  driverName: string
  yardCount: number
  yards: YardEfficiency[]
  totalEffectiveLoadMin: number
  totalOvertimeMin: number
  isOvertime: boolean
  finalExitTime?: Timestamp
  generatedAt: Timestamp
}
export const VOID_REASON_LABEL: Record<string, string> = {
  order_error: '订单信息错误',
  customer_cancel: '客户取消',
  qty_change: '数量变更',
  yard_change: '园区/装货点调整',
  schedule_change: '时间计划调整',
  other: '其他',
}

export const VOID_REASON_OPTIONS = (
  Object.keys(VOID_REASON_LABEL) as (keyof typeof VOID_REASON_LABEL)[]
).map((v) => ({ value: v, label: VOID_REASON_LABEL[v] }))

/** 超时原因选项（M2：调度时效分析 - 多选） */
export const OVERTIME_REASON_LABEL: Record<string, string> = {
  traffic: '路况拥堵',
  weather: '天气原因',
  customer_delay: '客户延迟',
  slow_loading: '装货慢',
  equipment_fault: '设备故障',
  driver_absent: '司机未到',
  yard_congestion: '园区拥堵',
  other: '其他',
}

export const OVERTIME_REASON_OPTIONS = (
  Object.keys(OVERTIME_REASON_LABEL) as (keyof typeof OVERTIME_REASON_LABEL)[]
).map((v) => ({ value: v, label: OVERTIME_REASON_LABEL[v] }))

/** 超时责任部门选项（M2：调度时效分析 - 单选） */
export const OVERTIME_DEPARTMENT_LABEL: Record<string, string> = {
  warehouse: '成品库',
  driver: '司机',
  customer: '客户',
  logistics_company: '物流公司',
  system: '系统',
}

export const OVERTIME_DEPARTMENT_OPTIONS = (
  Object.keys(OVERTIME_DEPARTMENT_LABEL) as (keyof typeof OVERTIME_DEPARTMENT_LABEL)[]
).map((v) => ({ value: v, label: OVERTIME_DEPARTMENT_LABEL[v] }))

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
  /** 业务员 id（从来源库存带入；手工录入时为当前用户） */
  salesPersonId?: string
  /** 业务员姓名（与 inventory.salesPersonName 一致） */
  salesPersonName?: string
}
