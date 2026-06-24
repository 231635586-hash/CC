import { create } from 'zustand'
import type {
  Inventory,
  ValidatedRow,
} from '@/types/inventory'
import { mockInventory } from '@/mock/inventory'
import { useCustomerStore } from './customer'

interface InventoryState {
  list: Inventory[]
  loading: boolean

  loadList: () => Promise<void>
  getById: (id: string) => Inventory | undefined
  getByBarcode: (barcode: string) => Inventory | undefined
  getDispatchable: () => Inventory[]
  getByCustomer: (customerId: string) => Inventory[]

  create: (data: Omit<Inventory, 'id' | 'importDate'>) => Inventory
  update: (id: string, patch: Partial<Inventory>) => void

  /** 物理删除（仅 in_stock 可删），替代作废 */
  removeInventory: (id: string) => void

  /** 锁定（in_stock → locked），支持单 ID 或多 ID；已锁的会静默跳过 */
  lock: (input: string | string[]) => void
  /** 多 ID 锁定（显式入口） */
  lockMany: (ids: string[]) => void
  /** 解锁（locked → in_stock），用于 Drawer 取消回滚 */
  unlock: (input: string | string[]) => void

  /** 标记已发货（locked → shipped），保留供未来联动 */
  markShipped: (id: string) => void

  importBatch: (rows: ValidatedRow[], onConflict: 'overwrite' | 'skip') => {
    imported: number
    overwritten: number
    skipped: number
  }
}

// 系统编号：INV-YYYYMMDD-XXXX（按天流水）
const dailyCounter: Record<string, number> = {}
function genInventoryId(): string {
  const now = new Date()
  const dateStr =
    now.getFullYear().toString() +
    String(now.getMonth() + 1).padStart(2, '0') +
    String(now.getDate()).padStart(2, '0')
  dailyCounter[dateStr] = (dailyCounter[dateStr] || 0) + 1
  return `INV-${dateStr}-${String(dailyCounter[dateStr]).padStart(4, '0')}`
}

export const useInventoryStore = create<InventoryState>((set, get) => ({
  list: [],
  loading: false,

  loadList: async () => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 100))
    set({ list: mockInventory, loading: false })
  },

  getById: (id) => get().list.find((i) => i.id === id),

  getByBarcode: (barcode) => get().list.find((i) => i.barcode === barcode),

  getDispatchable: () => get().list.filter((i) => i.status === 'in_stock'),

  getByCustomer: (customerId) => get().list.filter((i) => i.customerId === customerId),

  create: (data) => {
    const inv: Inventory = {
      ...data,
      id: genInventoryId(),
      importDate: new Date().toISOString(),
    }
    set({ list: [inv, ...get().list] })
    return inv
  },

  update: (id, patch) => {
    set({
      list: get().list.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    })
  },

  removeInventory: (id) => {
    set({ list: get().list.filter((i) => !(i.id === id && i.status === 'in_stock')) })
  },

  lock: (input) => {
    const ids = Array.isArray(input) ? input : [input]
    const idSet = new Set(ids)
    set({
      list: get().list.map((i) =>
        idSet.has(i.id) && i.status === 'in_stock' ? { ...i, status: 'locked' } : i
      ),
    })
  },

  lockMany: (ids) => {
    const idSet = new Set(ids)
    set({
      list: get().list.map((i) =>
        idSet.has(i.id) && i.status === 'in_stock' ? { ...i, status: 'locked' } : i
      ),
    })
  },

  unlock: (input) => {
    const ids = Array.isArray(input) ? input : [input]
    const idSet = new Set(ids)
    set({
      list: get().list.map((i) =>
        idSet.has(i.id) && i.status === 'locked' ? { ...i, status: 'in_stock' } : i
      ),
    })
  },

  markShipped: (id) => {
    set({
      list: get().list.map((i) =>
        i.id === id && i.status === 'locked' ? { ...i, status: 'shipped' } : i
      ),
    })
  },

  importBatch: (rows, onConflict) => {
    let imported = 0
    let overwritten = 0
    let skipped = 0
    const now = new Date().toISOString()
    const batchId = `BATCH-${Date.now()}`
    const newList = [...get().list]
    // 从 customerStore 查找客户（用于新增行的 customerId 映射）
    const customerLookup = (name: string) =>
      useCustomerStore.getState().list.find((c) => c.name === name)

    for (const row of rows) {
      if (row.status !== 'valid' && row.status !== 'duplicate') continue

      const existingIndex = newList.findIndex((i) => i.barcode === row.raw.barcode)

      if (existingIndex >= 0) {
        // 重复行
        if (onConflict === 'overwrite') {
          newList[existingIndex] = {
            ...newList[existingIndex],
            // ===== 物料基础 =====
            productionNo: row.raw.productionNo,
            materialCode: row.raw.materialCode,
            materialName: row.raw.materialName,
            productName: row.raw.productName,
            drawingNo: row.raw.drawingNo,
            // ===== 归属/类别 =====
            yardName: row.raw.yardName,
            category: row.raw.category,
            // ===== 客户 =====
            customerCode: row.raw.customerCode,
            shippingFrom: row.raw.shippingFrom,
            customerMaterialCode: row.raw.customerMaterialCode,
            // ===== 业务 =====
            orderType: row.raw.orderType,
            netWeightPerPiece: row.raw.netWeightPerPiece,
            weightPerBox: row.raw.weightPerBox,
            quantity: row.raw.quantity,
            quantityPerBox: row.raw.quantityPerBox,
            totalQuantity: row.raw.totalQuantity,
            unitWeight: row.raw.unitWeight,
            boxWeight: row.raw.boxWeight,
            netWeight: row.raw.netWeight,
            partitionWeightPerBox: row.raw.partitionWeightPerBox,
            partitionTotalWeight: row.raw.partitionTotalWeight,
            tonnagePerVehicle: row.raw.tonnagePerVehicle,
            stockType: row.raw.stockType,
            packaging: row.raw.packaging,
            age: row.raw.age,
            remark: row.raw.remark,
            importBatchId: batchId,
          }
          overwritten += 1
        } else {
          skipped += 1
        }
      } else {
        // 新增行 - 通过 customerName 查 customerId
        const customer = customerLookup(row.raw.customerName)

        const inv: Inventory = {
          id: genInventoryId(),
          barcode: row.raw.barcode,
          productionNo: row.raw.productionNo,
          // ===== 物料基础 =====
          materialCode: row.raw.materialCode,
          materialName: row.raw.materialName,
          productName: row.raw.productName,
          drawingNo: row.raw.drawingNo,
          // ===== 归属/类别 =====
          yardName: row.raw.yardName,
          category: row.raw.category,
          // ===== 客户 =====
          customerId: customer?.id ?? '',
          customerCode: row.raw.customerCode,
          customerName: customer?.name ?? row.raw.customerName,
          customerAddress: customer?.address ?? '',
          shippingFrom: row.raw.shippingFrom,
          customerMaterialCode: row.raw.customerMaterialCode,
          // ===== 业务 =====
          orderType: row.raw.orderType,
          netWeightPerPiece: row.raw.netWeightPerPiece,
          weightPerBox: row.raw.weightPerBox,
          quantity: row.raw.quantity,
          quantityPerBox: row.raw.quantityPerBox,
          totalQuantity: row.raw.totalQuantity,
          unitWeight: row.raw.unitWeight,
          boxWeight: row.raw.boxWeight,
          netWeight: row.raw.netWeight,
          partitionWeightPerBox: row.raw.partitionWeightPerBox,
          partitionTotalWeight: row.raw.partitionTotalWeight,
          tonnagePerVehicle: row.raw.tonnagePerVehicle,
          stockType: row.raw.stockType,
          packaging: row.raw.packaging,
          status: 'in_stock',
          age: row.raw.age,
          importDate: now,
          importBatchId: batchId,
          remark: row.raw.remark,
        }
        newList.unshift(inv)
        imported += 1
      }
    }

    set({ list: newList })
    return { imported, overwritten, skipped }
  },
}))
