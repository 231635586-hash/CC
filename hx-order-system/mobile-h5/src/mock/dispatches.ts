/**
 * 司机端 H5 - 派车单 mock 数据（M3 演示用）
 *
 * 数据来源说明：
 *  - 当前阶段：从 seed.ts 抄一份子集（避免 localStorage 跨 origin 问题）
 *  - 真实阶段：API GET /api/dispatch?driverId={id}
 *
 * 字段对齐 types/dispatch.ts（hx-order-system/src/types/dispatch.ts）
 *
 * v0.3.0-M2.2（P0-1 重构）：
 *   - DispatchStatus / DispatchMock 抽到 @/types/shared/dispatch
 *   - 此处保留 re-export 以兼容既有 import 路径
 *   - 新代码请直接 import 自 @/types/shared/dispatch
 *
 * v0.3.0-M2.2 + P0-2：
 *   - MOCK_DISPATCHES_RAW 保留纯数据（无 customerSite 字段）
 *   - MOCK_DISPATCHES 通过 .map() 注入 customerSite（GPS 自动到货需要）
 *   - customerSiteOf('苏州') 返回秦壁附近兜底坐标（让 in_transit 派车单演示触发）
 */

import type { DispatchStatus, DispatchMock, CustomerSite } from '@/types/shared/dispatch'

// P0-1：再 export 保持向后兼容（老代码 from '@/mock/dispatches' 仍可用）
export type { DispatchStatus, DispatchMock }

/**
 * 秦壁附近兜底坐标（P0-2 GPS 演示用）
 *
 * Why：getCurrentPosition 在浏览器拒绝 Geolocation 时返回秦壁附近（111.513, 36.081）
 *      把 in_transit 派车单的 customerSite 也设这里，距离 ≈ 0m，无 GPS 也能立即触发 arrived
 */
const QINBI_FALLBACK: CustomerSite = {
  lng: 111.513,
  lat: 36.081,
  radiusM: 200,
  contactName: '现场联系人',
  contactPhone: '13987654321',
}

/** mock 阶段城市→客户坐标映射（演示不同距离场景） */
const CITY_SITES: Record<string, CustomerSite> = {
  杭州: { lng: 120.13, lat: 30.27, radiusM: 200, contactName: '周婷', contactPhone: '13566778899' },
  苏州: { lng: 120.62, lat: 31.32, radiusM: 200, contactName: '王芳', contactPhone: '13755667788' },
  上海: { lng: 121.47, lat: 31.23, radiusM: 200, contactName: '李强', contactPhone: '13811223344' },
  北京: { lng: 116.40, lat: 39.90, radiusM: 200, contactName: '张伟', contactPhone: '13900112233' },
  广州: { lng: 113.26, lat: 23.13, radiusM: 200, contactName: '陈刚', contactPhone: '13622334455' },
  深圳: { lng: 113.95, lat: 22.55, radiusM: 200, contactName: '刘洋', contactPhone: '13533445566' },
  无锡: { lng: 120.30, lat: 31.57, radiusM: 200, contactName: '赵敏', contactPhone: '13744556677' },
  青岛: { lng: 120.38, lat: 36.07, radiusM: 200, contactName: '孙磊', contactPhone: '13855667788' },
  天津: { lng: 117.20, lat: 39.13, radiusM: 200, contactName: '周华', contactPhone: '13966778899' },
  东莞: { lng: 113.75, lat: 22.95, radiusM: 200, contactName: '吴军', contactPhone: '13677889900' },
}

/**
 * 根据 direction 推导 customerSite
 *  - in_transit 派车单强制用秦壁兜底（让演示立即触发 arrived）
 *  - 其他状态用城市代表性坐标（不影响演示）
 */
function customerSiteOf(direction: string, status: DispatchStatus): CustomerSite {
  if (status === 'in_transit') return QINBI_FALLBACK
  return CITY_SITES[direction] ?? QINBI_FALLBACK
}

/** 纯数据（无 customerSite 注入，便于阅读和维护） */
const MOCK_DISPATCHES_RAW: Omit<DispatchMock, 'customerSite'>[] = [
  {
    id: 'mock-dispatch-012',
    dispatchNo: 'DC20260627012',
    status: 'loading',
    direction: '杭州',
    expectedLoadTime: '2026-06-27 16:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '杭州智能装备',
    customerAddress: '杭州市余杭区文一西路 1818 号',
    companyName: '北方通远运输股份有限公司',
    vehicleNo: '沪A23456',
    driverName: '李建国',
    goodsSummary: '大型设备配件 80 箱 / 3.2 吨',
  },
  {
    id: 'mock-dispatch-006',
    dispatchNo: 'DC20260626006',
    status: 'dispatched',
    direction: '上海',
    expectedLoadTime: '2026-06-26 14:30:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '华东机械制造有限公司',
    customerAddress: '苏州市工业园区星湖街 128 号',
    companyName: '华东快运物流有限公司',
    vehicleNo: '沪A12345',
    driverName: '陈大壮',
    goodsSummary: '精密齿轮组件 50 箱 / 1.4 吨',
  },
  {
    id: 'mock-dispatch-008',
    dispatchNo: 'DC20260625008',
    status: 'leaving',
    direction: '无锡',
    expectedLoadTime: '2026-06-25 14:00:00',
    yardIds: ['mock-yard-002'],
    yardNames: ['甘亭'],
    customerName: '青岛海尔智造',
    customerAddress: '青岛市崂山区海尔路 1 号',
    companyName: '北方通远运输股份有限公司',
    vehicleNo: '沪A23456',
    driverName: '李建国',
    goodsSummary: '家电配件 60 箱 / 2.1 吨',
  },
  {
    id: 'mock-dispatch-005',
    dispatchNo: 'DC20260624005',
    status: 'entering',
    direction: '广州',
    expectedLoadTime: '2026-06-24 16:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '东莞五金制品厂',
    customerAddress: '东莞市长安镇振安路 88 号',
    companyName: '华南华运供应链管理有限公司',
    vehicleNo: '浙C45678',
    driverName: '王大锤',
    goodsSummary: '五金配件 35 箱 / 1.2 吨',
  },
  {
    id: 'mock-dispatch-007',
    dispatchNo: 'DC20260625007',
    status: 'completed',
    direction: '苏州',
    expectedLoadTime: '2026-06-25 10:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '深圳精密科技',
    customerAddress: '深圳市南山区科技园南区高新南一道',
    companyName: '华东快运物流有限公司',
    vehicleNo: '沪A12345',
    driverName: '陈大壮',
    goodsSummary: '电子元器件 40 箱 / 0.8 吨',
  },
  {
    id: 'mock-dispatch-003',
    dispatchNo: 'DC20260622003',
    status: 'completed',
    direction: '北京',
    expectedLoadTime: '2026-06-22 09:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '天津北方重工',
    customerAddress: '天津市东丽区军粮城工业园',
    companyName: '北方通远运输股份有限公司',
    vehicleNo: '沪A23456',
    driverName: '李建国',
    goodsSummary: '机械配件 70 箱 / 2.8 吨',
  },
  {
    id: 'mock-dispatch-001',
    dispatchNo: 'DC20260622001',
    status: 'cancelled',
    direction: '上海',
    expectedLoadTime: '2026-06-22 16:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '华东机械制造有限公司',
    customerAddress: '苏州市工业园区星湖街 128 号',
    companyName: '华东快运物流有限公司',
    vehicleNo: '-',
    driverName: '-',
    goodsSummary: '精密齿轮组件 60 箱 / 1.7 吨',
  },

  // ===== v0.2.0-M2：到货处理 4 步状态演示样本 =====

  // M2-01：in_transit（装货完成，在途）— P0-2 演示 GPS 自动到货用
  {
    id: 'mock-dispatch-m2-001',
    dispatchNo: 'DC20260709001',
    status: 'in_transit',
    direction: '苏州',
    expectedLoadTime: '2026-07-09 14:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '华东机械制造有限公司',
    customerAddress: '江苏省苏州市工业园区星湖街 128 号',
    companyName: '华东快运物流有限公司',
    vehicleNo: '沪A12345',
    driverName: '陈大壮',
    goodsSummary: '精密齿轮组件 80 箱 / 2.2 吨',
  },

  // v0.3.0-M2.2 v2：arrived_by_gps 已下线，迁移到 queued（GPS 检测 = 统一入场）
  {
    id: 'mock-dispatch-m2-002',
    dispatchNo: 'DC20260709002',
    status: 'queued',
    direction: '杭州',
    expectedLoadTime: '2026-07-09 11:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '杭州智能装备',
    customerAddress: '浙江省杭州市余杭区文一西路 1818 号',
    companyName: '北方通远运输股份有限公司',
    vehicleNo: '沪A23456',
    driverName: '李建国',
    goodsSummary: '大型设备配件 60 箱 / 2.5 吨',
  },

  // M2-03：driver_confirmed（司机已确认，待客户签收）
  {
    id: 'mock-dispatch-m2-003',
    dispatchNo: 'DC20260709003',
    status: 'driver_confirmed',
    direction: '深圳',
    expectedLoadTime: '2026-07-09 09:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '深圳精密科技',
    customerAddress: '广东省深圳市南山区科技园南区高新南一道',
    companyName: '华东快运物流有限公司',
    vehicleNo: '浙C45678',
    driverName: '王大锤',
    goodsSummary: '电子元器件 45 箱 / 1.5 吨',
  },

  // v0.3.0-M2.2 v2：customer_signed 已下线，统一迁移到 completed
  {
    id: 'mock-dispatch-m2-004',
    dispatchNo: 'DC20260709004',
    status: 'completed',
    direction: '青岛',
    expectedLoadTime: '2026-07-09 07:00:00',
    yardIds: ['mock-yard-002'],
    yardNames: ['甘亭'],
    customerName: '青岛海尔智造',
    customerAddress: '山东省青岛市崂山区海尔路 1 号',
    companyName: '北方通远运输股份有限公司',
    vehicleNo: '苏B34567',
    driverName: '赵铁柱',
    goodsSummary: '家电配件 35 箱 / 1.2 吨',
  },

  // M2-05：draft（草稿，业务员录入中，未受理）
  {
    id: 'mock-dispatch-m2-005',
    dispatchNo: 'DC20260709005',
    status: 'draft',
    direction: '广州',
    expectedLoadTime: '2026-07-10 10:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '东莞五金制品厂',
    customerAddress: '广东省东莞市长安镇振安路 88 号',
    companyName: '华南华运供应链管理有限公司',
    vehicleNo: '-',
    driverName: '-',
    goodsSummary: '电子元器件 60 箱 / 1.5 吨',
  },

  // v0.3.0-M2.2 v2：customer_signed 已下线，统一迁移到 completed
  {
    id: 'mock-dispatch-m2-006',
    dispatchNo: 'DC20260709006',
    status: 'completed',
    direction: '杭州',
    expectedLoadTime: '2026-07-09 08:00:00',
    yardIds: ['mock-yard-001'],
    yardNames: ['秦壁'],
    customerName: '杭州智能装备',
    customerAddress: '浙江省杭州市余杭区文一西路 1818 号',
    companyName: '华东快运物流有限公司',
    vehicleNo: '沪A12345',
    driverName: '陈大壮',
    goodsSummary: '服装鞋帽 150 箱 / 3.0 吨（已签收 3 张照片）',
  },
]

/**
 * 注入 customerSite 后的最终 mock 数组
 *
 * Why 用 .map()：
 *   - 纯数据 MOCK_DISPATCHES_RAW 保持可读，不重复 customerSite 字段
 *   - 注入逻辑集中在 customerSiteOf，便于将来调整坐标映射
 */
export const MOCK_DISPATCHES: DispatchMock[] = MOCK_DISPATCHES_RAW.map((d) => ({
  ...d,
  customerSite: customerSiteOf(d.direction, d.status),
}))