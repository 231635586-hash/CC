import { create } from 'zustand'
import type { Customer } from '@/types/customer'
import { mockCustomers } from '@/mock/customer'

interface CustomerState {
  list: Customer[]
  loading: boolean

  loadList: () => Promise<void>
  search: (keyword: string) => Customer[]
  getById: (id: string) => Customer | undefined
  create: (data: Omit<Customer, 'id' | 'createdAt'>) => Customer
  update: (id: string, patch: Partial<Omit<Customer, 'id' | 'createdAt'>>) => void
  toggleStatus: (id: string) => void
}

// 系统编号生成：CUS-YYYY-XXX（按年流水）
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
}))
