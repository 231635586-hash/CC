import { create } from 'zustand'
import { mockDB } from '@/mock/db'
import type {
  LogisticsCompany,
  Vehicle,
  Driver,
  VehicleLocation,
  User,
  Role,
  DingtalkBot,
  DingtalkTemplate,
  Yard,
} from '@/types'

interface DictState {
  companies: LogisticsCompany[]
  yards: Yard[]
  vehicles: Vehicle[]
  drivers: Driver[]
  vehicleLocations: VehicleLocation[]
  users: User[]
  roles: Role[]
  dingtalkBots: DingtalkBot[]
  dingtalkTemplates: DingtalkTemplate[]

  loadCompanies: () => Promise<void>
  loadYards: () => Promise<void>
  loadVehicles: () => Promise<void>
  loadDrivers: () => Promise<void>
  loadUsers: () => Promise<void>
  loadRoles: () => Promise<void>
  loadDingtalkBots: () => Promise<void>
  loadDingtalkTemplates: () => Promise<void>
  loadVehicleLocations: () => Promise<void>

  loadAll: () => Promise<void>
}

/** 全局字典 Store（用于下拉选项） */
export const useDictStore = create<DictState>((set) => ({
  companies: [],
  yards: [],
  vehicles: [],
  drivers: [],
  vehicleLocations: [],
  users: [],
  roles: [],
  dingtalkBots: [],
  dingtalkTemplates: [],

  loadCompanies: async () => set({ companies: await mockDB.listCompanies() }),
  loadYards: async () => set({ yards: await mockDB.listYards() }),
  loadVehicles: async () => set({ vehicles: await mockDB.listVehicles() }),
  loadDrivers: async () => set({ drivers: await mockDB.listDrivers() }),
  loadUsers: async () => set({ users: await mockDB.listUsers() }),
  loadRoles: async () => set({ roles: await mockDB.listRoles() }),
  loadDingtalkBots: async () => set({ dingtalkBots: await mockDB.listDingtalkBots() }),
  loadDingtalkTemplates: async () => set({ dingtalkTemplates: await mockDB.listDingtalkTemplates() }),
  loadVehicleLocations: async () => set({ vehicleLocations: await mockDB.listVehicleLocations() }),

  loadAll: async () => {
    const [companies, yards, vehicles, drivers, vehicleLocations, users, roles, dingtalkBots, dingtalkTemplates] = await Promise.all([
      mockDB.listCompanies(),
      mockDB.listYards(),
      mockDB.listVehicles(),
      mockDB.listDrivers(),
      mockDB.listVehicleLocations(),
      mockDB.listUsers(),
      mockDB.listRoles(),
      mockDB.listDingtalkBots(),
      mockDB.listDingtalkTemplates(),
    ])
    set({
      companies,
      yards,
      vehicles,
      drivers,
      vehicleLocations,
      users,
      roles,
      dingtalkBots,
      dingtalkTemplates,
    })
  },
}))