/**
 * 司机端 H5 - 通用类型定义
 *
 * 设计原则：
 *   - 页面级 Tab / 状态枚举统一在此处定义，避免页面间类型重复
 *   - 真后端接入时此处类型与 `@/mock/*` 解耦（mock 关心数据形状，type 关心业务形状）
 */

/** 工作台 5 大 Tab 路由键 */
export type TabKey = 'workbench' | 'orders' | 'messages' | 'gps' | 'me'

/** 派车单 Tab 内部子 Tab（进行中 / 待出发 / 已完成） */
export type OrderSubTab = 'active' | 'pending' | 'done'

/** GPS Tab 内部子 Tab（入园 / 离厂） */
export type GpsSubTab = 'in' | 'out'

/** 消息中心 3 种筛选 */
export type MessageFilter = 'all' | 'unread' | 'yard'

/** 消息通知 5 种类型（与图标映射） */
export type NotificationType = 'depart' | 'loading' | 'arrive' | 'complete' | 'cancel'

/** 司机信息（前端 mock / 真实 API 返回统一形状） */
export interface Driver {
  id: string
  name: string
  phone: string
}

/** 消息通知完整结构（前端 mock） */
export interface NotificationItem {
  id: string
  type: NotificationType
  title: string
  content: string
  time: string
  timestamp: number
  read: boolean
  dispatchId?: string
}

/** 园区基础信息（GPS 距离判定用） */
export interface Yard {
  id: string
  name: string
  lng: number
  lat: number
  /** 触发"入园"的半径（米），默认 300m */
  radiusM: number
}

/* ============================================
 * v0.3-MVP：4 角色模型（H5 全员化）
 * ============================================ */

/** H5 用户角色
 *  - driver     司机：看单 / GPS / 消息（现状保留）
 *  - salesperson 营销业务员：创建调车单
 *  - company    物流公司：确认 + 派车
 *  - customer   客户：通过 URL token 进入签收流程（无 TabBar）
 */
export type UserRole = 'driver' | 'salesperson' | 'company' | 'customer'

/** 营销业务员 */
export interface Salesperson {
  id: string
  name: string
  phone: string
  /** 所属业务区域/部门（M3+ 接 HR 系统） */
  department?: string
}

/** 物流公司 */
export interface LogisticsCompany {
  id: string
  name: string
  /** 承接的方向（用于业务员创建调车单时按方向筛选） */
  directions: string[]
  phone: string
}

/** 车辆 */
export interface Vehicle {
  id: string
  plateNo: string
  /** 所属物流公司 */
  companyId: string
  /** 车型（如 "重型半挂车"） */
  type?: string
  /** 载重(吨) */
  capacityTon?: number
}