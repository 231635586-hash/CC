/**
 * Mock 数据存储（localStorage 持久化）
 * 用于前端开发时的数据模拟，便于演示和测试
 */

import {
  mockDispatches,
  mockCompanies,
  mockYards,
  mockVehicles,
  mockDrivers,
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
  Driver,
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
  drivers: Driver[]
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
  drivers: mockDrivers,
  vehicleLocations: mockVehicleLocations,
  users: mockUsers,
  roles: mockRoles,
  dingtalkBots: mockDingtalkBots,
  dingtalkTemplates: mockDingtalkTemplates,
}

/**
 * 数据迁移：兼容旧版本 localStorage
 * - 自动补齐新增字段
 * - 修复旧 dispatch 数据
 * - 同步公司名变更
 * - 按 companyId 兜底重算 vehicles/users/dispatches 的 companyName
 */
function migrateDB(db: MockDB): MockDB {
  let dirty = false

  // 1. 补齐 yards 字段
  if (!db.yards || db.yards.length === 0) {
    db.yards = mockYards
    dirty = true
  }

  // 2. 修复旧 dispatch 数据中的 yardName（基于 yardId 重新匹配）— 已迁移到 yardIds 后此段失效，跳过
  const yardMap = new Map(db.yards.map((y) => [y.id, y.name]))
  db.dispatches.forEach((d) => {
    const raw = safeRaw(d)
    const yardIds = Array.isArray(raw.yardIds) ? (raw.yardIds as string[]) : []
    yardIds.forEach((yid) => {
      if (yardMap.has(yid)) {
        // yardName 字段已移除，仅确保 yardIds 引用合法
      }
    })
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

  // 4. 兼容旧 dispatch.direction 字面量 → 城市字符串
  const DIR_MAP: Record<string, string> = {
    east: '上海',
    west: '苏州',
    north: '北京',
    south: '杭州',
  }
  db.dispatches.forEach((d) => {
    if (DIR_MAP[d.direction]) {
      d.direction = DIR_MAP[d.direction]
      dirty = true
    }
  })

  // 5. 物流公司新字段补齐
  db.companies.forEach((c) => {
    const raw = c as LogisticsCompany
    if (!Array.isArray(raw.vehicleTypes)) {
      raw.vehicleTypes = []
      dirty = true
    } else {
      // 老枚举 heavy/medium/light → TruckSize 映射
      const TRUCK_TYPE_MAP: Record<string, string> = {
        heavy: '13m,13.75m,17.5m', // 重型 → 全部大车尺寸
        medium: '6.8m', // 中型 → 6.8m
        light: '4.2m', // 轻型 → 4.2m
      }
      const migrated: string[] = []
      raw.vehicleTypes.forEach((t: string) => {
        if (TRUCK_TYPE_MAP[t]) {
          TRUCK_TYPE_MAP[t].split(',').forEach((s) => {
            if (!migrated.includes(s)) migrated.push(s)
          })
        } else if (
          ['4.2m', '6.8m', '13m', '13.75m', '17.5m'].includes(t)
        ) {
          // 已是新枚举，直接保留
          if (!migrated.includes(t)) migrated.push(t)
        }
      })
      if (
        migrated.length !== raw.vehicleTypes.length ||
        migrated.some((s, i) => s !== raw.vehicleTypes[i])
      ) {
        raw.vehicleTypes = migrated as LogisticsCompany['vehicleTypes']
        dirty = true
      }
    }
    if (typeof raw.directions !== 'string') {
      raw.directions = ''
      dirty = true
    }
    if (typeof raw.estimatedHours !== 'number') {
      raw.estimatedHours = 8
      dirty = true
    }
  })

  // 6. 公司名迁移（id → 新名称）
  const COMPANY_NAME_MAP: Record<string, string> = {
    'mock-company-001': '华东快运物流有限公司',
    'mock-company-002': '北方通远运输股份有限公司',
    'mock-company-003': '华南华运供应链管理有限公司',
  }
  db.companies.forEach((c) => {
    if (COMPANY_NAME_MAP[c.id] && c.name !== COMPANY_NAME_MAP[c.id]) {
      c.name = COMPANY_NAME_MAP[c.id]
      dirty = true
    }
  })

  // 7. 按 companyId 兜底重算 companyName（dispatches/vehicles/users）
  const companyMap = new Map(db.companies.map((c) => [c.id, c.name]))
  const repair = (id: string | undefined, fallback: string | undefined): string => {
    if (!id) return fallback || ''
    return companyMap.get(id) || fallback || ''
  }
  const repairArr = (arr: { companyId?: string; companyName?: string }[]) => {
    arr.forEach((x) => {
      const n = repair(x.companyId, x.companyName)
      if (n && x.companyName !== n) {
        x.companyName = n
        dirty = true
      }
    })
  }
  repairArr(db.dispatches as { companyId?: string; companyName?: string }[])
  repairArr(db.vehicles as { companyId?: string; companyName?: string }[])
  repairArr(db.users as { companyId?: string; companyName?: string }[])

  // 8) dispatches 新字段补齐（yardIds/primaryYardId/shippingMethod/truckSize/isCarpool/isUrgent）
  db.dispatches.forEach((d) => {
    const raw = safeRaw(d)
    if (!Array.isArray(raw.yardIds)) {
      const oldYardId = raw.yardId as string | undefined
      raw.yardIds = oldYardId ? [oldYardId] : []
      dirty = true
    }
    const yardIds = raw.yardIds as string[]
    if (typeof raw.primaryYardId !== 'string' && yardIds.length > 0) {
      raw.primaryYardId = yardIds[0]
      dirty = true
    }
    if (!raw.shippingMethod) {
      raw.shippingMethod = 'big_truck'
      dirty = true
    }
    if (!raw.truckSize) {
      raw.truckSize = '13m'
      dirty = true
    }
    if (typeof raw.isCarpool !== 'boolean') {
      raw.isCarpool = false
      dirty = true
    }
    if (typeof raw.isUrgent !== 'boolean') {
      raw.isUrgent = false
      dirty = true
    }
  })

  // 9) drivers 表兜底（老版本 localStorage 没有 drivers 字段）
  if (!Array.isArray(db.drivers)) {
    db.drivers = mockDrivers
    dirty = true
  } else {
    // 公司名同步
    db.drivers.forEach((dr) => {
      const n = repair(dr.companyId, dr.companyName)
      if (n && dr.companyName !== n) {
        dr.companyName = n
        dirty = true
      }
    })
  }

  // 10) vehicles.defaultDriverId 兜底（按种子映射）
  const driverMap = new Map(db.drivers.map((dr) => [dr.id, dr]))
  db.vehicles.forEach((v) => {
    const raw = safeRaw(v)
    if (raw.defaultDriverId && driverMap.has(raw.defaultDriverId as string)) {
      const dr = driverMap.get(raw.defaultDriverId as string)!
      // 兜底修正 defaultDriverId 关联的 driver.companyId/companyName
      if (v.companyId !== dr.companyId && dr.companyId) {
        // 允许司机与车属于不同公司（M1 简化：不强制一致），但保证 companyName 同步
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

/**
 * 把任意对象转为可读可写的 Record<string, unknown>
 * 替代 migrateDB 中重复的 `as unknown as Record<string, unknown>` 强转。
 */
function safeRaw<T extends object>(o: T): Record<string, unknown> {
  return o as unknown as Record<string, unknown>
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
    const dispatches = db.dispatches.map((d) => {
      const raw = safeRaw(d)
      const yardIds = Array.isArray(raw.yardIds)
        ? (raw.yardIds as string[])
        : raw.yardId
          ? [raw.yardId as string]
          : []
      return {
        ...d,
        yardIds,
        primaryYardId: (raw.primaryYardId as string) || (yardIds[0] ?? ''),
        shippingMethod: (raw.shippingMethod as Dispatch['shippingMethod']) || 'big_truck',
        truckSize: raw.truckSize as Dispatch['truckSize'] | undefined,
        isCarpool: Boolean(raw.isCarpool),
        isUrgent: Boolean(raw.isUrgent),
      } as Dispatch
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
  listCompanies: async (): Promise<LogisticsCompany[]> => {
    const db = readDB()
    const safe = db.companies.map((c) => ({
      ...c,
      vehicleTypes: Array.isArray(c.vehicleTypes) ? c.vehicleTypes : [],
      directions: typeof c.directions === 'string' ? c.directions : '',
      estimatedHours: typeof c.estimatedHours === 'number' ? c.estimatedHours : 8,
    })) as LogisticsCompany[]
    return delay(safe)
  },
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

  // ----- 司机 -----
  listDrivers: async (): Promise<Driver[]> => delay(readDB().drivers),
  saveDriver: async (item: Driver): Promise<Driver> => {
    const db = readDB()
    const idx = db.drivers.findIndex((dr) => dr.id === item.id)
    if (idx >= 0) db.drivers[idx] = item
    else db.drivers.unshift(item)
    writeDB(db)
    return delay(item)
  },
  deleteDriver: async (id: string): Promise<void> => {
    const db = readDB()
    db.drivers = db.drivers.filter((dr) => dr.id !== id)
    // 同步清除车辆上的 defaultDriverId 关联
    const db2 = readDB()
    db2.vehicles.forEach((v) => {
      if (v.defaultDriverId === id) v.defaultDriverId = undefined
    })
    writeDB(db2)
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