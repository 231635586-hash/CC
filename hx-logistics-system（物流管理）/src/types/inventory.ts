// 库存类型定义 + 枚举常量

export type InventoryStatus = 'in_stock' | 'locked' | 'shipped' | 'voided'
export type OrderType = 'rough_self_use' | 'normal' | 'sample' | 'return'
export type PackagingType = 'ton_bag' | 'zhongji_ub108' | 'wooden_box'

export interface Inventory {
  id: string                  // 系统单号：INV-YYYYMMDD-XXXX
  barcode: string             // 条码编号（外部导入，可能重复）
  productionNo?: string       // 生产编号
  materialCode: string        // 物料编码
  materialName: string        // 物料名称
  materialDrawingNo?: string  // 物料图号
  customerId: string          // 关联客户档案 id
  customerName: string        // 冗余存储（快照）
  customerAddress: string     // 冗余存储（快照）
  orderType: OrderType
  netWeightPerPiece?: number  // 单件净重 (kg)
  weightPerBox?: number       // 单箱货重 (kg)
  quantity: number            // 数量（箱）
  packaging?: PackagingType
  status: InventoryStatus
  age?: number                // 库龄（天，手动输入）
  importDate: string          // 导入日期 ISO
  importBatchId?: string      // 导入批次号
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

export const ORDER_TYPE_OPTIONS = (Object.keys(ORDER_TYPE_LABEL) as OrderType[]).map(
  (v) => ({ label: ORDER_TYPE_LABEL[v], value: v })
)

export const PACKAGING_OPTIONS = (Object.keys(PACKAGING_LABEL) as PackagingType[]).map(
  (v) => ({ label: PACKAGING_LABEL[v], value: v })
)

export const INVENTORY_STATUS_OPTIONS = (Object.keys(INVENTORY_STATUS_LABEL) as InventoryStatus[]).map(
  (v) => ({ label: INVENTORY_STATUS_LABEL[v], value: v })
)

// Excel 导入行类型（与 Inventory 区别：id/importDate 由系统生成）
export interface InventoryImportRow {
  barcode: string
  productionNo?: string
  materialCode: string
  materialName: string
  materialDrawingNo?: string
  customerName: string
  orderType: OrderType
  netWeightPerPiece?: number
  weightPerBox?: number
  quantity: number
  packaging?: PackagingType
  age?: number
  remark?: string
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
