// 库存类型定义 + 枚举常量

export type InventoryStatus = 'in_stock' | 'locked' | 'shipped' | 'voided'
export type OrderType = 'rough_self_use' | 'normal' | 'sample' | 'return'
export type PackagingType = 'ton_bag' | 'zhongji_ub108' | 'wooden_box'

/** 货物类别（毛坯/加工件） */
export type MaterialCategory = 'rough' | 'processed'
/** 现货状态（现货/等货） */
export type StockType = 'in_stock_now' | 'waiting'

export interface Inventory {
  id: string                  // 系统单号：INV-YYYYMMDD-XXXX
  barcode: string             // 条码编号（外部导入，可能重复）
  productionNo?: string       // 生产编号

  // ===== 归属 / 类别 =====
  /** 归属园区 id（关联 yards.id） */
  yardId?: string
  /** 归属园区名称（冗余） */
  yardName?: string
  /** 类别 */
  category?: MaterialCategory

  // ===== 物料基础信息 =====
  materialCode: string        // 物料编码 *
  materialName: string        // 物料名称 *
  /** 产品名称（业务展示名，可能与 materialName 相同） */
  productName?: string
  /** 图号 */
  drawingNo?: string
  /** 旧字段保留：物料图号（同 drawingNo） */
  materialDrawingNo?: string

  // ===== 客户信息 =====
  customerId: string          // 关联客户档案 id
  customerCode?: string       // 客户编号
  customerName: string        // 冗余存储（快照）*
  customerAddress: string     // 冗余存储（快照）
  /** 发货地 */
  shippingFrom?: string
  /** 客户物料编码 */
  customerMaterialCode?: string

  orderType: OrderType
  netWeightPerPiece?: number  // 单件净重 (kg) — 旧字段保留

  // ===== 重量与数量（对齐"添加待调货明细"截图）=====
  /** 单箱数量（每箱装几件） */
  quantityPerBox?: number
  /** 箱数（即 quantity；保留双字段以便兼容旧逻辑） */
  quantity: number            // 数量（箱）*
  /** 总数（展示用 = quantityPerBox × quantity） */
  totalQuantity?: number
  /** 单重（单件重量 kg） */
  unitWeight?: number
  /** 箱重（单箱包装重 kg） */
  boxWeight?: number
  /** 净重（手动输入） */
  netWeight?: number
  /** 单箱隔板重 kg */
  partitionWeightPerBox?: number
  /** 隔板总重（手动输入） */
  partitionTotalWeight?: number

  /** 吨位/车（车辆载重吨位） */
  tonnagePerVehicle?: number
  /** 现货/等货 */
  stockType?: StockType

  /** 单箱货重（兼容旧字段） */
  weightPerBox?: number
  packaging?: PackagingType
  status: InventoryStatus
  age?: number                // 库龄（天，手动输入）
  importDate: string          // 导入日期 ISO
  importBatchId?: string      // 导入批次号

  // ===== 业务员（录入人）=====
  /** 业务员用户 id（关联 users.id，便于后续权限/统计） */
  salesPersonId?: string
  /** 业务员姓名（与 users.realName 对应，自动取当前登录用户） */
  salesPersonName?: string

  remark?: string
}

// 状态枚举的 label 映射
export const INVENTORY_STATUS_LABEL: Record<InventoryStatus, string> = {
  in_stock: '已入库',
  locked: '已锁定',
  shipped: '已发货',
  voided: '已作废',
}

export const INVENTORY_STATUS_COLOR: Record<InventoryStatus, string> = {
  in_stock: 'green',
  locked: 'gold',
  shipped: 'blue',
  voided: 'default',
}

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  rough_self_use: '毛坯自用',
  normal: '正常订单',
  sample: '样品订单',
  return: '退货入库',
}

export const PACKAGING_LABEL: Record<PackagingType, string> = {
  ton_bag: '吨袋',
  zhongji_ub108: '中集UB-108',
  wooden_box: '木箱',
}

/** 类别字典 */
export const MATERIAL_CATEGORY_LABEL: Record<MaterialCategory, string> = {
  rough: '毛坯',
  processed: '加工件',
}

/** 现货状态字典 */
export const STOCK_TYPE_LABEL: Record<StockType, string> = {
  in_stock_now: '现货',
  waiting: '等货',
}

export const ORDER_TYPE_OPTIONS = (Object.keys(ORDER_TYPE_LABEL) as OrderType[]).map(
  (v) => ({ label: ORDER_TYPE_LABEL[v], value: v })
)

export const PACKAGING_OPTIONS = (Object.keys(PACKAGING_LABEL) as PackagingType[]).map(
  (v) => ({ label: PACKAGING_LABEL[v], value: v })
)

export const MATERIAL_CATEGORY_OPTIONS = (Object.keys(MATERIAL_CATEGORY_LABEL) as MaterialCategory[]).map(
  (v) => ({ label: MATERIAL_CATEGORY_LABEL[v], value: v })
)

export const STOCK_TYPE_OPTIONS = (Object.keys(STOCK_TYPE_LABEL) as StockType[]).map(
  (v) => ({ label: STOCK_TYPE_LABEL[v], value: v })
)

export const INVENTORY_STATUS_OPTIONS = (Object.keys(INVENTORY_STATUS_LABEL) as InventoryStatus[])
  .filter((s) => s !== 'voided')
  .map((v) => ({ label: INVENTORY_STATUS_LABEL[v], value: v }))

// Excel 导入行类型（与 Inventory 区别：id/importDate 由系统生成）
export interface InventoryImportRow {
  barcode: string
  productionNo?: string
  yardName?: string           // 归属（园区名称）
  category?: MaterialCategory
  materialCode: string
  materialName: string
  productName?: string
  drawingNo?: string
  customerCode?: string
  customerName: string
  shippingFrom?: string
  customerMaterialCode?: string
  orderType: OrderType
  quantityPerBox?: number
  quantity: number
  totalQuantity?: number
  unitWeight?: number
  boxWeight?: number
  netWeight?: number
  partitionWeightPerBox?: number
  partitionTotalWeight?: number
  tonnagePerVehicle?: number
  stockType?: StockType
  netWeightPerPiece?: number  // 兼容旧
  weightPerBox?: number       // 兼容旧
  packaging?: PackagingType
  age?: number
  remark?: string
  /** 业务员姓名（导入时由调用方根据当前登录用户填入，Excel 不需要提供） */
  salesPersonName?: string
}

// Excel 校验结果
export type RowValidationStatus = 'valid' | 'invalid' | 'duplicate'

export interface ValidatedRow {
  rowIndex: number
  raw: InventoryImportRow
  status: RowValidationStatus
  errors: string[]                  // 错误信息
  existingRecordId?: string         // 重复时关联的现有记录 id
}