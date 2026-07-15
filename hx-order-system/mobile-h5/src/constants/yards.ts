/**
 * 园区 mock 坐标
 *
 * 真实阶段：GET /api/yards
 * 当前 M1：硬编码 2 个山西园区（秦壁 / 甘亭）
 */

import type { Yard } from '@/types/driver'

export const MOCK_YARDS: Yard[] = [
  { id: 'mock-yard-001', name: '秦壁', lng: 111.513, lat: 36.081, radiusM: 300 },
  { id: 'mock-yard-002', name: '甘亭', lng: 111.612, lat: 36.156, radiusM: 300 },
]