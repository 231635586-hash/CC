/**
 * 司机端 H5 - 派车单 mock 数据（M3 演示用）
 *
 * 数据来源说明：
 *  - 当前阶段：从 seed.ts 抄一份子集（避免 localStorage 跨 origin 问题）
 *  - 真实阶段：API GET /api/dispatch?driverId={id}
 *
 * 字段对齐 types/dispatch.ts（hx-order-system/src/types/dispatch.ts）
 */

export interface DispatchMock {
  id: string
  dispatchNo: string
  status: DispatchStatus
  direction: string
  expectedLoadTime: string
  yardIds: string[]
  yardNames: string[]
  customerName: string
  customerAddress: string
  companyName: string
  vehicleNo?: string
  driverName?: string
  goodsSummary?: string
}

export type DispatchStatus =
  | 'draft'
  | 'pending_confirm'
  | 'confirmed'
  | 'dispatching'
  | 'dispatched'
  // —— v0.3.0-M2.2 v2：GPS/扫码统一入场 ——
  | 'queued'
  | 'entering'
  | 'loading'
  | 'leaving'
  // —— 到货处理（在途 → 司机确认 → 完成）——
  | 'in_transit'
  | 'driver_confirmed'
  // —— 终态 ——
  | 'completed'
  | 'cancelled'

export const MOCK_DISPATCHES: DispatchMock[] = [
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

  // M2-01：in_transit（装货完成，在途）
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