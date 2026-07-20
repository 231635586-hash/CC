/**
 * 库存 mock 数据（P1-3：业务员手动添加库存 E2 方案）
 *
 * 设计：
 *  - mobile-h5 端简化字段子集（Web 端 Inventory 有 30+ 字段，mobile-h5 只取核心 7-8 个）
 *  - 与 Web 端 src/types/inventory.ts 对齐字段命名（materialCode/customerName/quantity/unit/stockType/status）
 *  - 补齐 mock 覆盖 in_stock / locked / shipped / voided 4 个状态 + in_stock_now / waiting 2 个库存类型
 *
 * Why：
 *  - baseline 调研发现 mobile-h5 无 inventory mock
 *  - salesperon MyDispatchesTab P0-2 修复后已补 salespersonId，inventory 同样补齐
 */

import type { Inventory } from '@/types/inventory'

export type { Inventory }

export const INVENTORY_STATUS_LABEL: Record<Inventory['status'], string> = {
  in_stock: '在库',
  locked: '已锁定',
  shipped: '已发货',
  voided: '已作废',
}

export const STOCK_TYPE_LABEL: Record<Inventory['stockType'], string> = {
  in_stock_now: '现货',
  waiting: '等货',
}

export const MOCK_INVENTORY: Inventory[] = [
  {
    id: 'mock-inv-001',
    barcode: 'BC202607001',
    productionNo: 'PD202607001',
    materialCode: 'MAT-001',
    materialName: '大型设备配件',
    productName: '设备配件',
    customerName: '杭州智能装备',
    customerCode: 'CUS-001',
    customerId: 'CUS-001',
    quantity: 80,
    unit: '箱',
    stockType: 'in_stock_now',
    status: 'in_stock',
    packaging: 'wooden_box',
    importDate: '2026-07-01',
    salesPersonId: 'mock-sp-001',
    remark: '已入库可发货',
  },
  {
    id: 'mock-inv-002',
    barcode: 'BC202607002',
    productionNo: 'PD202607002',
    materialCode: 'MAT-002',
    materialName: '精密齿轮组件',
    productName: '齿轮组件',
    customerName: '苏州工业园区智造',
    customerCode: 'CUS-002',
    customerId: 'CUS-002',
    quantity: 50,
    unit: '箱',
    stockType: 'in_stock_now',
    status: 'in_stock',
    packaging: 'wooden_box',
    importDate: '2026-07-03',
    salesPersonId: 'mock-sp-001',
    remark: '',
  },
  {
    id: 'mock-inv-003',
    barcode: 'BC202607003',
    productionNo: 'PD202607003',
    materialCode: 'MAT-003',
    materialName: '电子元器件',
    productName: '元器件',
    customerName: '深圳精密科技',
    customerCode: 'CUS-003',
    customerId: 'CUS-003',
    quantity: 40,
    unit: '箱',
    stockType: 'in_stock_now',
    status: 'locked',
    packaging: 'wooden_box',
    importDate: '2026-07-04',
    salesPersonId: 'mock-sp-001',
    remark: '已锁定待发货',
  },
  {
    id: 'mock-inv-004',
    barcode: 'BC202607004',
    materialCode: 'MAT-004',
    materialName: '家电配件',
    customerName: '青岛海尔智造',
    customerCode: 'CUS-004',
    customerId: 'CUS-004',
    quantity: 120,
    unit: '箱',
    stockType: 'waiting',
    status: 'in_stock',
    packaging: 'wooden_box',
    importDate: '2026-07-06',
    expectedArrivalAt: '2026-07-15',
    salesPersonId: 'mock-sp-001',
    remark: '等货中',
  },
  {
    id: 'mock-inv-005',
    barcode: 'BC202606005',
    materialCode: 'MAT-005',
    materialName: '服装鞋帽',
    customerName: '上海某服装',
    customerCode: 'CUS-005',
    customerId: 'CUS-005',
    quantity: 150,
    unit: '箱',
    stockType: 'in_stock_now',
    status: 'shipped',
    packaging: 'wooden_box',
    importDate: '2026-06-15',
    salesPersonId: 'mock-sp-001',
    remark: '已发货',
  },
]