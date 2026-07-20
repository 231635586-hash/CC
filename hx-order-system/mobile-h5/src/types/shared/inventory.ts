/**
 * 库存共享类型定义（P1-3：业务员手动添加库存 E2 方案）
 *
 * 来源：mobile-h5 内部抽取，对齐 Web 端 hx-order-system/src/types/inventory.ts
 *
 * 设计原则：
 *  - mobile-h5 端只取核心字段子集（7-8 个），Web 端 30+ 字段不入库
 *  - 字段命名严格对齐 Web 端（materialCode/customerName/quantity/unit/stockType/status）
 *  - 真实阶段：F2 阶段从 Web 端 API 拉取完整字段
 */

export type InventoryStatus = 'in_stock' | 'locked' | 'shipped' | 'voided'

export type StockType = 'in_stock_now' | 'waiting'

export type Packaging = 'ton_bag' | 'zhongji_ub108' | 'wooden_box'

/**
 * 库存简化字段子集（mobile-h5）
 *
 * 字段对齐 Web 端 Inventory：
 *  - 核心：id / barcode / materialCode / materialName / customerName / quantity / unit / stockType / status
 *  - 选填：productionNo / productName / customerId / customerCode / packaging / expectedArrivalAt / importDate / remark
 *  - 业务：salesPersonId（mobile-h5 mock 阶段按 salesperson 过滤）
 */
export interface Inventory {
  id: string
  /** 条码 */
  barcode?: string
  /** 生产编号 */
  productionNo?: string
  /** 物料编码（必填） */
  materialCode: string
  /** 物料名称（必填） */
  materialName: string
  /** 产品名称 */
  productName?: string
  /** 客户 ID */
  customerId?: string
  /** 客户编码 */
  customerCode?: string
  /** 客户名称（必填） */
  customerName: string
  /** 库存数量（必填） */
  quantity: number
  /** 单位（如：箱/吨/件） */
  unit: string
  /** 库存类型：现货/等货 */
  stockType: StockType
  /** 库存状态：在库/已锁定/已发货/已作废 */
  status: InventoryStatus
  /** 包装方式 */
  packaging?: Packaging
  /** 预计到货时间（等货状态下使用） */
  expectedArrivalAt?: string
  /** 入库日期 */
  importDate?: string
  /** 业务员 ID（mobile-h5 用于过滤） */
  salesPersonId?: string
  /** 备注 */
  remark?: string
}