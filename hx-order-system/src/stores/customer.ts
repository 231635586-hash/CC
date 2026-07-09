import { create } from 'zustand'
import type { Customer, CustomerStatus } from '@/types/customer'
import { mockCustomers } from '@/mock/customer'
import { FALLBACK_CREATOR_USER } from '@/mock/constants'
import { useAuthStore } from './auth'

/** 客户导入单行（不带 id/createdAt/添加人） */
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
  getById: (id: string) => Customer | undefined
  getByName: (name: string) => Customer | undefined
  create: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer
  update: (id: string, patch: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void
  toggleStatus: (id: string) => void
  /** 软删（status → inactive），保留记录以便审计 */
  remove: (id: string) => void

  /**
   * 批量导入客户
   * @param rows 待导入行
   * @param mode 'overwrite' 同名覆盖；'skip' 同名跳过
   * @returns 导入统计
   */
  importBatch: (rows: CustomerImportRow[], mode: 'overwrite' | 'skip') => ImportResult
}

/** 当前登录用户（添加人）；无登录态时降级为「未知用户」 */
function getCurrentCreator(): { creatorId: string; creatorName: string } {
  const u = useAuthStore.getState().currentUser
  return {
    creatorId: u?.id || 'unknown',
    creatorName: u?.realName || '未知用户',
  }
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
    // 兜底：历史客户（无添加人字段）统一回填为 FALLBACK_CREATOR_USER（mock-user-005 李欣）
    const safe = mockCustomers.map((c) =>
      c.creatorName
        ? c
        : { ...c, creatorId: FALLBACK_CREATOR_USER.id, creatorName: FALLBACK_CREATOR_USER.name },
    )
    set({ list: safe, loading: false })
  },

  getById: (id) => get().list.find((c) => c.id === id),
  getByName: (name) => get().list.find((c) => c.name === name.trim()),

  create: (data) => {
    const creator = getCurrentCreator()
    const customer: Customer = {
      ...data,
      id: genCustomerId(),
      createdAt: new Date().toISOString(),
      creatorId: data.creatorId || creator.creatorId,
      creatorName: data.creatorName || creator.creatorName,
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

  /** 软删：active → inactive（保留记录，便于审计与恢复） */
  remove: (id) => {
    set({
      list: get().list.map((c) =>
        c.id === id && c.status === 'active' ? { ...c, status: 'inactive' } : c,
      ),
    })
  },

  importBatch: (rows, mode) => {
    let imported = 0
    let overwritten = 0
    let skipped = 0
    const next = [...get().list]
    const creator = getCurrentCreator()

    rows.forEach((row) => {
      const idx = next.findIndex((c) => c.name === row.name.trim())
      if (idx >= 0) {
        if (mode === 'overwrite') {
          // 覆盖模式：不修改添加人（保持原录入人）
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
        // 新增行：自动填入当前登录用户为添加人
        next.unshift({
          id: genCustomerId(),
          name: row.name.trim(),
          address: row.address,
          contact: row.contact,
          phone: row.phone,
          status: row.status ?? 'active',
          remark: row.remark,
          createdAt: new Date().toISOString(),
          creatorId: creator.creatorId,
          creatorName: creator.creatorName,
        })
        imported += 1
      }
    })

    set({ list: next })
    return { imported, overwritten, skipped }
  },
}))
