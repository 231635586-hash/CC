/**
 * 司机端 H5 - 通用类型定义
 *
 * 设计原则：
 *   - 页面级 Tab / 状态枚举统一在此处定义，避免页面间类型重复
 *   - 真后端接入时此处类型与 `@/mock/*` 解耦（mock 关心数据形状，type 关心业务形状）
 *
 * v0.3.0-M2.2（P0-1 重构）：
 *   - NotificationType / NotificationItem / Yard 抽到 @/types/shared/driver
 *   - 此处保留 re-export 以兼容既有 import 路径（如 @/types/driver）
 *   - 新代码请直接 import 自 @/types/shared/driver
 */

// ============================================================
// P0-1：从 shared 模块 re-export（保持向后兼容）
// ============================================================

export type { NotificationType, NotificationItem, Yard } from '@/types/shared/driver'

// ============================================================
// 页面级 UI 状态（保留在此处）
// ============================================================

/** 工作台 5 大 Tab 路由键 */
export type TabKey = 'workbench' | 'orders' | 'messages' | 'gps' | 'me'

/** 派车单 Tab 内部子 Tab（进行中 / 待出发 / 已完成） */
export type OrderSubTab = 'active' | 'pending' | 'done'

/** GPS Tab 内部子 Tab（入园 / 离厂） */
export type GpsSubTab = 'in' | 'out'

/** 消息中心 3 种筛选 */
export type MessageFilter = 'all' | 'unread' | 'yard'

/** 司机信息（前端 mock / 真实 API 返回统一形状） */
export interface Driver {
  id: string
  name: string
  phone: string
}

/* ============================================
 * v0.3-MVP → v0.3.0-M2.2：3 角色模型（移除客户）
 * ============================================ */

/** H5 用户角色（v0.3.0-M2.2 移除客户角色）
 *  - driver     司机：看单 / GPS / 消息
 *  - salesperson 营销业务员：创建调车单
 *  - company    物流公司：确认 + 派车
 *
 * ❌ 删除 customer：v0.3.0-M2.2 状态机 v2 移除客户签收环节后,
 *     司机 H5 端【确认到达】即触发 completed,不再需要客户扫码页。
 */
export type UserRole = 'driver' | 'salesperson' | 'company'

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