/**
 * 司机 mock 数据
 *
 * 真实阶段：GET /api/drivers?companyId=xxx
 * 当前 M1：硬编码 4 个测试司机
 *
 * v0.3-MVP 扩展：加 companyId 字段，让物流公司派车时按公司筛司机
 */

import type { Driver } from '@/types/driver'

interface DriverV3 extends Driver {
  /** v0.3-MVP 新增：所属物流公司 */
  companyId?: string
}

export const MOCK_DRIVERS: DriverV3[] = [
  { id: 'mock-driver-001', name: '陈大壮', phone: '13812345678', companyId: 'mock-co-002' }, // 华东快运
  { id: 'mock-driver-002', name: '李建国', phone: '13987654321', companyId: 'mock-co-001' }, // 北方通远
  { id: 'mock-driver-003', name: '赵铁柱', phone: '13611112222', companyId: 'mock-co-001' }, // 北方通远
  { id: 'mock-driver-004', name: '王大锤', phone: '13733334444', companyId: 'mock-co-002' }, // 华东快运
]

/** 按物流公司筛选司机 */
export function getDriversByCompany(companyId: string): DriverV3[] {
  return MOCK_DRIVERS.filter((d) => d.companyId === companyId)
}

/** 默认登录司机（M1 mock 默认值） */
export const DEFAULT_DRIVER: Driver = MOCK_DRIVERS[1] // 李建国

/** 兼容老代码：去掉 companyId 字段返回 Driver 类型 */
export function toPlainDriver(d: DriverV3): Driver {
  const { companyId, ...rest } = d
  return rest
}