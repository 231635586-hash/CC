/**
 * 营销业务员 mock 数据（v0.3-MVP）
 *
 * 真实阶段：GET /api/salespeople
 * 当前 M0：硬编码 2 个测试业务员
 */

import type { Salesperson } from '@/types/driver'

export const MOCK_SALESPEOPLE: Salesperson[] = [
  { id: 'mock-sp-001', name: '王晓东', phone: '13511112222', department: '华东业务一部' },
  { id: 'mock-sp-002', name: '陈丽娟', phone: '13533334444', department: '华南业务二部' },
]

export const DEFAULT_SALESPERSON: Salesperson = MOCK_SALESPEOPLE[0] // 王晓东