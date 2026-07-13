/**
 * 物流公司 mock 数据（v0.3-MVP）
 *
 * 真实阶段：GET /api/logistics-companies
 * 当前 M0：硬编码 3 家物流公司 + 各自承接的方向
 *
 * 设计动机：
 *  - 业务员创建调车单时，按方向(direction)筛选承接的物流公司
 *  - 跟 web 端一致：direction → company 是一对多
 */

import type { LogisticsCompany } from '@/types/driver'

export const MOCK_LOGISTICS_COMPANIES: LogisticsCompany[] = [
  {
    id: 'mock-co-001',
    name: '北方通远运输股份有限公司',
    directions: ['北京', '天津', '河北', '山东'],
    phone: '010-12345678',
  },
  {
    id: 'mock-co-002',
    name: '华东快运物流有限公司',
    directions: ['上海', '苏州', '杭州', '无锡', '南京'],
    phone: '021-87654321',
  },
  {
    id: 'mock-co-003',
    name: '华南华运供应链管理有限公司',
    directions: ['广州', '深圳', '东莞', '厦门', '福州'],
    phone: '020-99887766',
  },
]

/** 按方向筛选物流公司 */
export function getCompaniesByDirection(direction: string): LogisticsCompany[] {
  if (!direction) return MOCK_LOGISTICS_COMPANIES
  return MOCK_LOGISTICS_COMPANIES.filter((c) => c.directions.includes(direction))
}