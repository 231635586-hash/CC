/**
 * Mock 数据存储（localStorage 持久化）
 * 用于前端开发时的数据模拟，便于演示和测试
 */

import {
  mockDispatches,
  mockCompanies,
  mockYards,
  mockVehicles,
  mockVehicleLocations,
  mockUsers,
  mockRoles,
  mockDingtalkBots,
  mockDingtalkTemplates,
} from './seed'
import type { Dispatch } from '@/types/dispatch'
import type {
  LogisticsCompany,
  Vehicle,
  VehicleLocation,
  User,
  Role,
  DingtalkBot,
  DingtalkTemplate,
  Yard,
} from '@/types'

const STORAGE_KEY = 'HX_LOGISTICS_MOCK_DB'

interface MockDB {
  dispatches: Dispatch[]
  companies: LogisticsCompany[]
  yards: Yard[]
  vehicles: Vehicle[]
  vehicleLocations: VehicleLocation[]
  users: User[]
  roles: Role[]
  dingtalkBots: DingtalkBot[]
  dingtalkTemplates: DingtalkTemplate[]
}

const initialDB: MockDB = {
  dispatches: mockDispatches,
  companies: mockCompanies,
  yards: mockYards,
  vehicles: mockVehicles,
  vehicleLocations: mockVehicleLocations,
  users: mockUsers,
  roles: mockRoles,
  dingtalkBots: mockDingtalkBots,
  dingtalkTemplates: mockDingtalkTemplates,
}

/**
 * 数据迁移：兼容旧版本 localStorage
 * - 自动补齐新增字段（如 yards）
 * - 修复旧 dispatch 数据中 yardName 错位（华翔上海/苏州园区 → 秦壁/甘亭）
 */
function migrateDB(db: MockDB): MockDB {
  let dirty = false

  // 1. 补齐 yards 字段
  if (!db.yards || db.yards.length === 0) {
    db.yards = mockYards
    dirty = true
  }

  // 2. 修复旧 dispatch 数据中的 yardName（基于 yardId 重新匹配）
  const yardMap = new Map(db.yards.map((y) => [y.id, y.name]))
  db.dispatches.forEach((d) => {
    if (d.yardId && yardMap.has(d.yardId)) {
      const correctName = yardMap.get(d.yardId)!
      if (d.yardName !== correctName) {
        d.yardName = correctName
        dirty = true
      }
    }
  })

  // 3. 修复钉钉群机器人的 yardName
  db.dingtalkBots.forEach((b) => {
    if (b.yardId && yardMap.has(b.yardId)) {
      const correctName = yardMap.get(b.yardId)!
      if (b.yardName !== correctName) {
        b.yardName = correctName
        dirty = true
      }
    }
  })

  if (dirty) writeDB(db)
  return db
}

/** 读取 DB（无则初始化，自动迁移） */
function readDB(): MockDB {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB))
      return initialDB
    }
    const parsed = JSON.parse(raw) as MockDB
    return migrateDB(parsed)
  } catch {
    return initialDB
  }
}

/** 写入 DB */
function writeDB(db: MockDB) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(db))
}

/** 重置 DB */
export function resetMockDB() {
  localStorage.removeItem(STORAGE_KEY)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(initialDB))
}

/** 模拟接口延迟（毫秒） */
const MOCK_DELAY = 300

function delay<T>(data: T): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(data), MOCK_DELAY))
}

// ============== 通用 CRUD ==============

export const mockDB = {
  // ----- 调车单 -----
  listDispatches: async (): Promise<Dispatch[]> => {
    const db = readDB()
    // 出口兜底：无论 localStorage 中存什么 yardName，都按 yardId 重新匹配
    const yardMap = new Map(db.yards.map((y) => [y.id, y.name]))
    const dispatches = db.dispatches.map((d) => {
      if (d.yardId && yardMap.has(d.yardId) && d.yardName !== yardMap.get(d.yardId)) {
        return { ...d, yardName: yardMap.get(d.yardId)! }
      }
      return d
    })
    return delay(dispatches)
  },
  saveDispatch: async (dispatch: Dispatch): Promise<Dispatch> => {
    const db = readDB()
    const idx = db.dispatches.findIndex((d) => d.id === dispatch.id)
    if (idx >= 0) db.dispatches[idx] = dispatch
    else db.dispatches.unshift(dispatch)
    writeDB(db)
    return delay(dispatch)
  },
  deleteDispatch: async (id: string): Promise<void> => {
    const db = readDB()
    db.dispatches = db.dispatches.filter((d) => d.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 物流公司 -----
  listCompanies: async (): Promise<LogisticsCompany[]> => delay(readDB().companies),
  saveCompany: async (item: LogisticsCompany): Promise<LogisticsCompany> => {
    const db = readDB()
    const idx = db.companies.findIndex((c) => c.id === item.id)
    if (idx >= 0) db.companies[idx] = item
    else db.companies.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteCompany: async (id: string): Promise<void> => {
    const db = readDB()
    db.companies = db.companies.filter((c) => c.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 园区 -----
  listYards: async (): Promise<Yard[]> => delay(readDB().yards),
  saveYard: async (item: Yard): Promise<Yard> => {
    const db = readDB()
    const idx = db.yards.findIndex((y) => y.id === item.id)
    if (idx >= 0) db.yards[idx] = item
    else db.yards.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteYard: async (id: string): Promise<void> => {
    const db = readDB()
    db.yards = db.yards.filter((y) => y.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 车辆 -----
  listVehicles: async (): Promise<Vehicle[]> => delay(readDB().vehicles),
  saveVehicle: async (item: Vehicle): Promise<Vehicle> => {
    const db = readDB()
    const idx = db.vehicles.findIndex((v) => v.id === item.id)
    if (idx >= 0) db.vehicles[idx] = item
    else db.vehicles.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteVehicle: async (id: string): Promise<void> => {
    const db = readDB()
    db.vehicles = db.vehicles.filter((v) => v.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 车辆位置 -----
  listVehicleLocations: async (): Promise<VehicleLocation[]> => delay(readDB().vehicleLocations),

  // ----- 用户 -----
  listUsers: async (): Promise<User[]> => delay(readDB().users),
  saveUser: async (item: User): Promise<User> => {
    const db = readDB()
    const idx = db.users.findIndex((u) => u.id === item.id)
    if (idx >= 0) db.users[idx] = item
    else db.users.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteUser: async (id: string): Promise<void> => {
    const db = readDB()
    db.users = db.users.filter((u) => u.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 角色 -----
  listRoles: async (): Promise<Role[]> => delay(readDB().roles),
  saveRole: async (item: Role): Promise<Role> => {
    const db = readDB()
    const idx = db.roles.findIndex((r) => r.id === item.id)
    if (idx >= 0) db.roles[idx] = item
    else db.roles.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteRole: async (id: string): Promise<void> => {
    const db = readDB()
    db.roles = db.roles.filter((r) => r.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 钉钉群机器人 -----
  listDingtalkBots: async (): Promise<DingtalkBot[]> => {
    const db = readDB()
    // 出口兜底：按 yardId 实时修正 yardName
    const yardMap = new Map(db.yards.map((y) => [y.id, y.name]))
    const bots = db.dingtalkBots.map((b) => {
      if (b.yardId && yardMap.has(b.yardId) && b.yardName !== yardMap.get(b.yardId)) {
        return { ...b, yardName: yardMap.get(b.yardId)! }
      }
      return b
    })
    return delay(bots)
  },
  saveDingtalkBot: async (item: DingtalkBot): Promise<DingtalkBot> => {
    const db = readDB()
    const idx = db.dingtalkBots.findIndex((b) => b.id === item.id)
    if (idx >= 0) db.dingtalkBots[idx] = item
    else db.dingtalkBots.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteDingtalkBot: async (id: string): Promise<void> => {
    const db = readDB()
    db.dingtalkBots = db.dingtalkBots.filter((b) => b.id !== id)
    writeDB(db)
    return delay(undefined)
  },

  // ----- 钉钉消息模板 -----
  listDingtalkTemplates: async (): Promise<DingtalkTemplate[]> => delay(readDB().dingtalkTemplates),
  saveDingtalkTemplate: async (item: DingtalkTemplate): Promise<DingtalkTemplate> => {
    const db = readDB()
    const idx = db.dingtalkTemplates.findIndex((t) => t.id === item.id)
    if (idx >= 0) db.dingtalkTemplates[idx] = item
    else db.dingtalkTemplates.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteDingtalkTemplate: async (id: string): Promise<void> => {
    const db = readDB()
    db.dingtalkTemplates = db.dingtalkTemplates.filter((t) => t.id !== id)
    writeDB(db)
    return delay(undefined)
  },
}