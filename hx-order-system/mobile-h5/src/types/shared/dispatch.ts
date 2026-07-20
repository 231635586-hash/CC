/**
 * 共享派车单类型定义（P0-1 F1 状态字典统一）
 *
 * 来源：mobile-h5 内部抽取，对齐 Web 端 hx-order-system/src/types/dispatch.ts
 *
 * 设计原则：
 *   - 只取 mobile-h5 所需字段子集（Web 端字段更丰富，含 ShippingMethod / YardTimeline[] / DispatchGoods[]）
 *   - 不引入 monorepo / 跨端别名，仅 mobile-h5 内部共享
 *   - 与 Web 端字段命名严格对齐（特别是 YardTimeline.arrivedByGpsAt）
 *   - 后续 F2（API 统一）/ F3（实时同步）阶段再考虑抽到 packages/shared/
 *
 * Why this exists（2026-07-20 P0-1 复盘）：
 *   - 此前 DispatchMock 定义在 mock/dispatches.ts，类型字段与 Web 端命名不一致
 *   - DispatchStatus 在 mock 与 constants 中分散维护，缺乏单一信息源
 *   - types/driver.ts 的 NotificationType 5 值 vs stores/driver.ts 的 6 值不一致
 *
 * How to apply：
 *   - 所有页面/组件 import 统一指向 @/types/shared/dispatch
 *   - mock/dispatches.ts 仅保留 MOCK_DISPATCHES 数据，类型再 export
 *   - constants/dispatchStatus.ts 仅保留 DISPATCH_STATUS_MAP，类型 import 自此
 */

import type { Yard } from './driver'

/**
 * 派车单状态机枚举（与 Web 端 src/types/index.ts 对齐，13 态）
 *
 * 状态流转（mobile-h5 当前真实路径）：
 *   draft → pending_confirm → confirmed → dispatched → queued → entering
 *        → loading → leaving → in_transit → driver_confirmed → completed
 *   任意态 → cancelled
 *
 * 字段语义：
 *   - draft             草稿（业务员录入中）
 *   - pending_confirm   待物流公司确认
 *   - confirmed         已确认（待派车）
 *   - dispatching       派车中（兼容历史）
 *   - dispatched        已派车（司机可看单）
 *   - queued            排队中（M2.2 v2 入场）
 *   - entering          入园中
 *   - loading           装货中
 *   - leaving           出场中
 *   - in_transit        在途中
 *   - driver_confirmed  司机已确认到达
 *   - completed         已完成（终态）
 *   - cancelled         已取消（终态）
 */
export type DispatchStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'dispatching'
  | 'dispatched'
  | 'queued'
  | 'entering'
  | 'loading'
  | 'leaving'
  | 'in_transit'
  | 'driver_confirmed'
  | 'completed'
  | 'cancelled'

/**
 * 客户收货点 GPS 信息（参考 Web 端 Customer.site）
 *
 * Why: 移动端 H5 需要根据客户坐标判断"司机是否到达客户地址附近"
 *      Web 端 Customer.site 是 M2 新增字段，本类型保持命名一致
 */
export interface CustomerSite {
  /** 经度（WGS84） */
  lng: number
  /** 纬度（WGS84） */
  lat: number
  /** 触发"到达"的半径（米），默认 200m */
  radiusM: number
  /** 现场联系人（P0 暂未启用，预留） */
  contactName?: string
  /** 现场联系电话（P0 暂未启用，预留） */
  contactPhone?: string
}

/**
 * 完单照片（P0-3 拍照留痕引入）
 *
 * Why: 司机手动确认到货时强制拍照，照片作为送达凭证
 *      mock 阶段图片转 base64 存 localStorage，真实阶段预留 uni.uploadFile
 */
export interface DispatchPhoto {
  /** base64 字符串或 CDN URL（mock 阶段用 data URL） */
  data: string
  /** 拍摄时间（ISO 字符串） */
  capturedAt: string
  /** 拍摄时的 GPS 坐标（可选，预留 P0-3+） */
  location?: { lng: number; lat: number }
}

/**
 * 派车单 mock 类型（与 Web 端 Dispatch 子集对齐）
 *
 * Why: mobile-h5 不需要 Web 端全部字段（ShippingMethod/YardTimeline[]/Goods[]）
 *      抽精简版即可，后续 F2 阶段如需完整字段再补
 *
 * 字段对齐：
 *   - 已对齐：id / dispatchNo / status / direction / expectedLoadTime / yardIds /
 *             customerName / customerAddress / companyName
 *   - 新增：salespersonId（mobile-h5 此前运行时挂载未声明，P0-1 补）/ customerSite /
 *          arrivedByGpsAt / arrivedByGpsLocation / completionPhotos /
 *          driverConfirmedAt / completedAt
 *   - 暂未对齐：yardNames（Web 端无此字段，mobile-h5 内部使用）/ vehicleNo / driverName /
 *              goodsSummary（mobile-h5 简化展示，不引入 DispatchGoods）
 */
export interface DispatchMock {
  id: string
  dispatchNo: string
  status: DispatchStatus
  direction: string
  expectedLoadTime: string
  yardIds: string[]
  yardNames: string[]
  customerName: string
  customerAddress: string
  companyName: string
  /** 营销业务员 ID（P0-1 补声明，CreateDispatchForm 运行时已挂载） */
  salespersonId?: string
  vehicleNo?: string
  driverName?: string
  goodsSummary?: string
  /** 客户收货点 GPS 信息（P0-2 GPS 自动到货引入，可选兼容老数据） */
  customerSite?: CustomerSite
  /** GPS 触达客户地址时间（P0-2 写入，ISO 字符串，对齐 Web 端 YardTimeline.arrivedByGpsAt） */
  arrivedByGpsAt?: string
  /** GPS 触达客户地址坐标（凭证） */
  arrivedByGpsLocation?: { lng: number; lat: number }
  /** 司机手动确认到达时间（P0-3 写入） */
  driverConfirmedAt?: string
  /** 完单时间（P0-3 写入） */
  completedAt?: string
  /** 完单照片（P0-3 拍照留痕写入） */
  completionPhotos?: DispatchPhoto[]
}

/** Yard 类型再 export（mobile-h5 内部多处复用，源头在本目录的 driver.ts） */
export type { Yard }