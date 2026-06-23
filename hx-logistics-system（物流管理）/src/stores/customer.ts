import { create } from 'zustand'
import type { Customer, CustomerStatus } from '@/types/customer'
import { mockCustomers } from '@/mock/customer'

/** 客户导入单行（不带 id/createdAt） */
export interface CustomerImportRow {
  name: string
  address: string
  contact?: string
  phone?: string
  status?: CustomerStatus
  remark?: string
}

/** 导入结果统计 */
export interface ImportResult {
  imported: number
  overwritten: number
  skipped: number
}

interface CustomerState {
  list: Customer[]
  loading: boolean

  loadList: () => Promise<void>
  search: (keyword: string) => Customer[]
  getById: (id: string) => Customer | undefined
  getByName: (name: string) => Customer | undefined
  create: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer
  update: (id: string, patch: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void
  toggleStatus: (id: string) => void

  /**
   * 批量导入客户
   * @param rows 待导入行
   * @param mode 'overwrite' 同名覆盖；'skip' 同名跳过
   * @returns 导入统计
   */
  importBatch: (rows: CustomerImportRow[], mode: 'overwrite' | 'skip') => ImportResult
}

let customerCounter = 8  // mock 已用 1-8
function genCustomerId(): string {
  const year = new Date().getFullYear()
  customerCounter += 1
  return `CUS-${year}-${String(customerCounter).padStart(3, '0')}`
}

export const useCustomerStore = create<CustomerState>((set, get) => ({
  list: [],
  loading: false,

  loadList: async () => {
    set({ loading: true })
    await new Promise((r) => setTimeout(r, 100))
    set({ list: mockCustomers, loading: false })
  },

  search: (keyword) => {
    const kw = keyword.trim().toLowerCase()
    if (!kw) return get().list
    return get().list.filter(
      (c) =>
        c.name.toLowerCase().includes(kw) ||
        (c.contact?.toLowerCase().includes(kw) ?? false) ||
        (c.phone?.includes(kw) ?? false)
    )
  },

  getById: (id) => get().list.find((c) => c.id === id),
  getByName: (name) => get().list.find((c) => c.name === name.trim()),

  create: (data) => {
    const customer: Customer = {
      ...data,
      id: genCustomerId(),
      createdAt: new Date().toISOString(),
    }
    set({ list: [customer, ...get().list] })
    return customer
  },

  update: (id, patch) => {
    set({
      list: get().list.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    })
  },

  toggleStatus: (id) => {
    set({
      list: get().list.map((c) =>
        c.id === id
          ? { ...c, status: c.status === 'active' ? 'inactive' : 'active' }
          : c
      ),
    })
  },

  importBatch: (rows, mode) => {
    let imported = 0
    let overwritten = 0
    let skipped = 0
    const next = [...get().list]

    rows.forEach((row) => {
      const idx = next.findIndex((c) => c.name === row.name.trim())
      if (idx >= 0) {
        if (mode === 'overwrite') {
          next[idx] = {
            ...next[idx],
            address: row.address,
            contact: row.contact,
            phone: row.phone,
            status: row.status ?? next[idx].status,
            remark: row.remark,
          }
          overwritten += 1
        } else {
          skipped += 1
        }
      } else {
        next.unshift({
          id: genCustomerId(),
          name: row.name.trim(),
          address: row.address,
          contact: row.contact,
          phone: row.phone,
          status: row.status ?? 'active',
          remark: row.remark,
          createdAt: new Date().toISOString(),
        })
        imported += 1
      }
    })

    set({ list: next })
    return { imported, overwritten, skipped }
  },
}))
