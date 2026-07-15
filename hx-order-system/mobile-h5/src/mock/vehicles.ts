/**
 * 车辆 mock 数据（v0.3-MVP）
 *
 * 真实阶段：GET /api/vehicles?companyId=xxx
 * 当前 M0：硬编码 4 辆车，按公司分组
 *
 * 物流公司派车时：选 company → 选该公司的车辆 → 选该公司的司机
 */

import type { Vehicle } from '@/types/driver'

export const MOCK_VEHICLES: Vehicle[] = [
  {
    id: 'mock-vh-001',
    plateNo: '沪A12345',
    companyId: 'mock-co-002', // 华东快运
    type: '重型半挂车',
    capacityTon: 30,
  },
  {
    id: 'mock-vh-002',
    plateNo: '沪A23456',
    companyId: 'mock-co-001', // 北方通远
    type: '重型半挂车',
    capacityTon: 30,
  },
  {
    id: 'mock-vh-003',
    plateNo: '浙C45678',
    companyId: 'mock-co-002', // 华东快运
    type: '中型货车',
    capacityTon: 15,
  },
  {
    id: 'mock-vh-004',
    plateNo: '苏B34567',
    companyId: 'mock-co-001', // 北方通远
    type: '中型货车',
    capacityTon: 15,
  },
]

/** 按物流公司筛选车辆 */
export function getVehiclesByCompany(companyId: string): Vehicle[] {
  return MOCK_VEHICLES.filter((v) => v.companyId === companyId)
}