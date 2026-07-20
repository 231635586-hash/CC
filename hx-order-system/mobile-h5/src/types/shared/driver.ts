/**
 * 共享司机端类型定义（P0-1 F1 状态字典统一）
 *
 * 与 types/shared/dispatch.ts 同源，集中管理：
 *   - NotificationType 6 值（与 stores/driver.ts 注释一致）
 *   - NotificationItem / Yard
 *
 * Why this exists（2026-07-20 P0-1 复盘）：
 *   - types/driver.ts 此前定义 5 值 NotificationType（缺 arrived_prompt）
 *   - stores/driver.ts 注释里提到 6 值（多 arrived_prompt）但类型 union 是 5 值
 *   - 两处不一致，store 实际使用 'arrived_prompt' 字面量时会绕过类型检查
 *
 * How to apply：
 *   - 页面/组件 import 自 @/types/shared/driver
 *   - types/driver.ts 删除内联 NotificationType / NotificationItem / Yard，改为再 export
 *   - stores/driver.ts 改为 import 自此处
 */

/**
 * 消息通知类型（6 值，与 stores/driver.ts 一致）
 *
 * 字段语义：
 *   - depart         通知出发（库房通知司机可以走了）
 *   - loading        通知装货（库房已准备好，司机可以装货）
 *   - arrive         GPS 入园（车辆到达园区）
 *   - complete       装货完成（M2）
 *   - cancel         订单取消
 *   - arrived_prompt 已到达客户园区，请确认（M2 新增，P0-2 GPS 自动推送）
 */
export type NotificationType =
  | 'depart'
  | 'loading'
  | 'arrive'
  | 'complete'
  | 'cancel'
  | 'arrived_prompt'

/**
 * 消息通知完整结构（前端 mock / 真实 API 返回统一形状）
 *
 * Why: 此前 types/driver.ts 含 id 字段，stores/driver.ts 无 id 字段，两处不一致
 *      P0-1 统一为含 id 字段（采用 types/driver.ts 原版），store.markRead 改用 id 查找
 */
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

/**
 * 园区基础信息（GPS 距离判定用）
 */
export interface Yard {
  id: string
  name: string
  lng: number
  lat: number
  /** 触发"入园"的半径（米），默认 300m */
  radiusM: number
}