import type {
  Department,
  DepartmentTreeNode,
  MindMapNode,
  Position,
  Establishment,
  EstablishmentMatrixRow,
  EstablishmentMatrixCell,
  EstablishmentHistory,
  Rank,
} from '../types';

// 部门 Mock 数据
export const mockDepartments: Department[] = [
  //根节点 - 华翔集团
  {
    id: 'root-hxjt',
    name: '华翔集团',
    code: 'HXJT',
    parentId: null,
    level: 0,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 华翔科技
  {
    id: 'dept-hxkj',
    name: '华翔科技',
    code: 'HXKJ',
    parentId: 'root-hxjt',
    level: 1,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 华翔制造
  {
    id: 'dept-hxzz',
    name: '华翔制造',
    code: 'HXZZ',
    parentId: 'root-hxjt',
    level: 1,
    sort: 1,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 研发部
  {
    id: 'dept-yfb',
    name: '研发部',
    code: 'YFB',
    parentId: 'dept-hxkj',
    level: 2,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 产品部
  {
    id: 'dept-cpb',
    name: '产品部',
    code: 'CPB',
    parentId: 'dept-hxkj',
    level: 2,
    sort: 1,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 销售部
  {
    id: 'dept-xsb',
    name: '销售部',
    code: 'XSB',
    parentId: 'dept-hxkj',
    level: 2,
    sort: 2,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 生产部
  {
    id: 'dept-scb',
    name: '生产部',
    code: 'SCB',
    parentId: 'dept-hxzz',
    level: 2,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 质量部
  {
    id: 'dept-zlb',
    name: '质量部',
    code: 'ZLB',
    parentId: 'dept-hxzz',
    level: 2,
    sort: 1,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 前端组
  {
    id: 'dept-qdz',
    name: '前端组',
    code: 'QDZ',
    parentId: 'dept-yfb',
    level: 3,
    sort: 0,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  // 后端组
  {
    id: 'dept-bdz',
    name: '后端组',
    code: 'BDZ',
    parentId: 'dept-yfb',
    level: 3,
    sort: 1,
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
];

// 职位 Mock 数据
export const mockPositions: Position[] = [
  {
    id: 'pos-001',
    name: '前端开发工程师',
    code: 'QDKF',
    departmentId: 'dept-qdz',
    employeeCount: 2,
    description: '负责公司前端开发工作，包括Web页面开发和移动端适配',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'pos-002',
    name: '后端开发工程师',
    code: 'HDKF',
    departmentId: 'dept-bdz',
    employeeCount: 2,
    description: '负责公司后端服务开发和API接口设计',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'pos-003',
    name: '产品经理',
    code: 'CPJL',
    departmentId: 'dept-cpb',
    employeeCount: 2,
    description: '负责产品规划、需求分析和产品设计',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'pos-004',
    name: '销售经理',
    code: 'XSJL',
    departmentId: 'dept-xsb',
    employeeCount: 1,
    description: '负责销售团队管理和客户拓展',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'pos-005',
    name: '生产主管',
    code: 'SCZG',
    departmentId: 'dept-scb',
    employeeCount: 1,
    description: '负责生产车间日常管理和生产计划执行',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
  {
    id: 'pos-006',
    name: '质检工程师',
    code: 'ZJGC',
    departmentId: 'dept-zlb',
    tenantId: 'tenant-001',
    createdAt: '2024-01-01 00:00:00',
    updatedAt: '2024-01-01 00:00:00',
  },
];

// 编制 Mock 数据 - 按月计算
const currentYear = new Date().getFullYear();

// 存储已占用数的Map
const establishmentOccupiedMap = new Map<string, number>();

export const mockEstablishments: Establishment[] = [
  // 2026年1-6月的编制数据
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 1, 10, 7),
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 2, 10, 7),
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 3, 12, 7),
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 4, 12, 7),
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 5, 12, 9),
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 6, 12, 9),

  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 1, 8, 6),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 2, 8, 6),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 3, 8, 6),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 4, 10, 8),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 5, 10, 8),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 6, 10, 8),

  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 1, 3, 2),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 2, 3, 2),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 3, 3, 2),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 4, 4, 3),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 5, 4, 3),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 6, 4, 3),

  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 1, 5, 4),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 2, 5, 4),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 3, 5, 4),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 4, 5, 4),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 5, 6, 5),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 6, 6, 5),

  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 1, 20, 18),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 2, 20, 18),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 3, 22, 20),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 4, 22, 20),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 5, 22, 21),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 6, 22, 21),

  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 1, 6, 4),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 2, 6, 4),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 3, 6, 5),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 4, 6, 5),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 5, 8, 6),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 6, 8, 6),

  // 满编示例：quota=5, occupied=5 (已满编)
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 1, 5, 5),
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 2, 5, 5),
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 3, 5, 5),
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 4, 5, 5),
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 5, 5, 5),
  ...generateEstablishmentData('dept-yfb', 'pos-001', currentYear, 6, 5, 5),

  // ========== 2026年7月 - 已审批通过的数据 ==========
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 7, 15, 10),
  ...generateEstablishmentData('dept-bdz', 'pos-002', currentYear, 7, 12, 9),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 7, 5, 4),
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 7, 8, 6),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 7, 25, 20),
  ...generateEstablishmentData('dept-zlb', 'pos-006', currentYear, 7, 10, 7),

  // ========== 2026年8月 - 待审批/已驳回的数据（仅记录，不在矩阵显示） ==========
  // 待审批的申请（establishmentId 存在但 history 是 pending，矩阵不显示）
  ...generateEstablishmentData('dept-qdz', 'pos-001', currentYear, 8, 18, 10),
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 8, 6, 4),
  // 已驳回的申请
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 8, 8, 6),
  ...generateEstablishmentData('dept-scb', 'pos-005', currentYear, 8, 25, 20),

  // ========== 锁定功能测试数据 ==========
  // 锁定中：前端组-前端开发工程师 2026/07（锁定申请待审批）
  ...generateEstablishmentDataWithLock('dept-qdz', 'pos-001', currentYear, 7, 15, 10, 'locking', '年度编制管控', '2026-12-31'),

  // 已锁定：后端组-后端开发工程师 2026/08（锁定审批通过）
  ...generateEstablishmentDataWithLock('dept-bdz', 'pos-002', currentYear, 8, 12, 8, 'locked', '部门重组锁定', '2026-09-30'),

  // 正常-充足：产品部-产品经理 2026/07（充足状态，用于对比）
  ...generateEstablishmentData('dept-cpb', 'pos-003', currentYear, 7, 5, 2),

  // 正常-紧张：销售部-销售经理 2026/07（紧张状态，用于对比）
  ...generateEstablishmentData('dept-xsb', 'pos-004', currentYear, 7, 6, 5),
];

function generateEstablishmentData(
  departmentId: string,
  positionId: string,
  year: number,
  month: number,
  quota: number,
  occupied: number
): Establishment[] {
  const id = `est-${departmentId}-${positionId}-${year}-${month}`;
  establishmentOccupiedMap.set(id, occupied);

  return [
    {
      id,
      departmentId,
      positionId,
      year,
      month,
      quota,
      tenantId: 'tenant-001',
      createdAt: '2024-01-01 00:00:00',
      updatedAt: '2024-01-01 00:00:00',
      lockStatus: 'none',
    },
  ];
}

// 生成带锁定状态的编制数据
function generateEstablishmentDataWithLock(
  departmentId: string,
  positionId: string,
  year: number,
  month: number,
  quota: number,
  occupied: number,
  lockStatus: 'locking' | 'locked',
  lockReason?: string,
  lockExpiredAt?: string
): Establishment[] {
  const id = `est-${departmentId}-${positionId}-${year}-${month}`;
  establishmentOccupiedMap.set(id, occupied);

  return [
    {
      id,
      departmentId,
      positionId,
      year,
      month,
      quota,
      tenantId: 'tenant-001',
      createdAt: '2024-01-01 00:00:00',
      updatedAt: '2024-01-01 00:00:00',
      lockStatus,
      lockReason,
      lockExpiredAt,
    },
  ];
}

// 获取已占用数
export const getEstablishmentOccupied = (establishmentId: string): number => {
  return establishmentOccupiedMap.get(establishmentId) || 0;
};

// 编制调整历史 Mock 数据
// 场景说明：
// - approved: 已审批通过，矩阵图中显示
// - pending: 待审批中，矩阵图中不显示（需要等审批）
// - rejected: 已驳回，矩阵图中不显示（维持原状态）
export const mockEstablishmentHistories: EstablishmentHistory[] = [
  // ========== 1-6月数据（已审批通过，矩阵图中显示）==========

  // 前端部-前端开发工程师 1-6月
  { id: 'hist-101', establishmentId: 'est-dept-qdz-pos-001-2026-1', oldQuota: 0, newQuota: 10, reason: 'business_expansion', remark: '年度招聘计划', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-102', establishmentId: 'est-dept-qdz-pos-001-2026-2', oldQuota: 10, newQuota: 10, reason: 'natural_turnover', remark: '编制保持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-103', establishmentId: 'est-dept-qdz-pos-001-2026-3', oldQuota: 10, newQuota: 12, reason: 'business_expansion', remark: 'Q1扩编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-20 09:00:00', approvedAt: '2026-02-20 11:00:00' },
  { id: 'hist-104', establishmentId: 'est-dept-qdz-pos-001-2026-4', oldQuota: 12, newQuota: 12, reason: 'natural_turnover', remark: '编制稳定', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-25 09:00:00', approvedAt: '2026-03-25 10:00:00' },
  { id: 'hist-105', establishmentId: 'est-dept-qdz-pos-001-2026-5', oldQuota: 12, newQuota: 12, reason: 'business_expansion', remark: '维持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-25 09:00:00', approvedAt: '2026-04-25 10:00:00' },
  { id: 'hist-106', establishmentId: 'est-dept-qdz-pos-001-2026-6', oldQuota: 12, newQuota: 12, reason: 'natural_turnover', remark: '编制维持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 后端部-后端开发工程师 1-6月
  { id: 'hist-201', establishmentId: 'est-dept-bdz-pos-002-2026-1', oldQuota: 0, newQuota: 8, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-202', establishmentId: 'est-dept-bdz-pos-002-2026-2', oldQuota: 8, newQuota: 8, reason: 'natural_turnover', remark: '维持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-203', establishmentId: 'est-dept-bdz-pos-002-2026-3', oldQuota: 8, newQuota: 8, reason: 'business_expansion', remark: '维持编制', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-25 09:00:00', approvedAt: '2026-02-25 10:00:00' },
  { id: 'hist-204', establishmentId: 'est-dept-bdz-pos-002-2026-4', oldQuota: 8, newQuota: 10, reason: 'business_expansion', remark: 'Q2扩编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-20 09:00:00', approvedAt: '2026-03-20 11:00:00' },
  { id: 'hist-205', establishmentId: 'est-dept-bdz-pos-002-2026-5', oldQuota: 10, newQuota: 10, reason: 'natural_turnover', remark: '维持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-25 09:00:00', approvedAt: '2026-04-25 10:00:00' },
  { id: 'hist-206', establishmentId: 'est-dept-bdz-pos-002-2026-6', oldQuota: 10, newQuota: 10, reason: 'natural_turnover', remark: '维持', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 产品部-产品经理 1-6月
  { id: 'hist-301', establishmentId: 'est-dept-cpb-pos-003-2026-1', oldQuota: 0, newQuota: 3, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-302', establishmentId: 'est-dept-cpb-pos-003-2026-2', oldQuota: 3, newQuota: 3, reason: 'natural_turnover', remark: '维持', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-303', establishmentId: 'est-dept-cpb-pos-003-2026-3', oldQuota: 3, newQuota: 3, reason: 'natural_turnover', remark: '维持', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-25 09:00:00', approvedAt: '2026-02-25 10:00:00' },
  { id: 'hist-304', establishmentId: 'est-dept-cpb-pos-003-2026-4', oldQuota: 3, newQuota: 4, reason: 'business_expansion', remark: 'Q2产品扩张', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-20 09:00:00', approvedAt: '2026-03-20 11:00:00' },
  { id: 'hist-305', establishmentId: 'est-dept-cpb-pos-003-2026-5', oldQuota: 4, newQuota: 4, reason: 'natural_turnover', remark: '维持', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-25 09:00:00', approvedAt: '2026-04-25 10:00:00' },
  { id: 'hist-306', establishmentId: 'est-dept-cpb-pos-003-2026-6', oldQuota: 4, newQuota: 4, reason: 'natural_turnover', remark: '维持', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 销售部-销售经理 1-6月
  { id: 'hist-401', establishmentId: 'est-dept-xsb-pos-004-2026-1', oldQuota: 0, newQuota: 5, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-402', establishmentId: 'est-dept-xsb-pos-004-2026-2', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '维持', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-403', establishmentId: 'est-dept-xsb-pos-004-2026-3', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '维持', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-25 09:00:00', approvedAt: '2026-02-25 10:00:00' },
  { id: 'hist-404', establishmentId: 'est-dept-xsb-pos-004-2026-4', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '维持', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-25 09:00:00', approvedAt: '2026-03-25 10:00:00' },
  { id: 'hist-405', establishmentId: 'est-dept-xsb-pos-004-2026-5', oldQuota: 5, newQuota: 6, reason: 'business_expansion', remark: 'Q2扩张', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-20 09:00:00', approvedAt: '2026-04-20 11:00:00' },
  { id: 'hist-406', establishmentId: 'est-dept-xsb-pos-004-2026-6', oldQuota: 6, newQuota: 6, reason: 'natural_turnover', remark: '满编状态', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 市场部-市场专员 1-6月
  { id: 'hist-501', establishmentId: 'est-dept-scb-pos-005-2026-1', oldQuota: 0, newQuota: 20, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-502', establishmentId: 'est-dept-scb-pos-005-2026-2', oldQuota: 20, newQuota: 20, reason: 'natural_turnover', remark: '维持', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-503', establishmentId: 'est-dept-scb-pos-005-2026-3', oldQuota: 20, newQuota: 22, reason: 'business_expansion', remark: 'Q1扩编', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-15 09:00:00', approvedAt: '2026-02-15 11:00:00' },
  { id: 'hist-504', establishmentId: 'est-dept-scb-pos-005-2026-4', oldQuota: 22, newQuota: 22, reason: 'natural_turnover', remark: '维持', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-25 09:00:00', approvedAt: '2026-03-25 10:00:00' },
  { id: 'hist-505', establishmentId: 'est-dept-scb-pos-005-2026-5', oldQuota: 22, newQuota: 22, reason: 'natural_turnover', remark: '紧张', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-25 09:00:00', approvedAt: '2026-04-25 10:00:00' },
  { id: 'hist-506', establishmentId: 'est-dept-scb-pos-005-2026-6', oldQuota: 22, newQuota: 22, reason: 'natural_turnover', remark: '紧张状态', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 质量管理部-质量工程师 1-6月
  { id: 'hist-601', establishmentId: 'est-dept-zlb-pos-006-2026-1', oldQuota: 0, newQuota: 6, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-602', establishmentId: 'est-dept-zlb-pos-006-2026-2', oldQuota: 6, newQuota: 6, reason: 'natural_turnover', remark: '维持', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-603', establishmentId: 'est-dept-zlb-pos-006-2026-3', oldQuota: 6, newQuota: 6, reason: 'natural_turnover', remark: '接近满编', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-25 09:00:00', approvedAt: '2026-02-25 10:00:00' },
  { id: 'hist-604', establishmentId: 'est-dept-zlb-pos-006-2026-4', oldQuota: 6, newQuota: 6, reason: 'natural_turnover', remark: '紧张', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-25 09:00:00', approvedAt: '2026-03-25 10:00:00' },
  { id: 'hist-605', establishmentId: 'est-dept-zlb-pos-006-2026-5', oldQuota: 6, newQuota: 8, reason: 'business_expansion', remark: 'Q2扩编', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-20 09:00:00', approvedAt: '2026-04-20 11:00:00' },
  { id: 'hist-606', establishmentId: 'est-dept-zlb-pos-006-2026-6', oldQuota: 8, newQuota: 8, reason: 'natural_turnover', remark: '接近满编', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // 研发一部-前端开发工程师 1-6月（满编状态）
  { id: 'hist-701', establishmentId: 'est-dept-yfb-pos-001-2026-1', oldQuota: 0, newQuota: 5, reason: 'business_expansion', remark: '年度计划', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2025-12-15 09:00:00', approvedAt: '2025-12-20 10:00:00' },
  { id: 'hist-702', establishmentId: 'est-dept-yfb-pos-001-2026-2', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '满编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-01-25 09:00:00', approvedAt: '2026-01-25 10:00:00' },
  { id: 'hist-703', establishmentId: 'est-dept-yfb-pos-001-2026-3', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '满编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-02-25 09:00:00', approvedAt: '2026-02-25 10:00:00' },
  { id: 'hist-704', establishmentId: 'est-dept-yfb-pos-001-2026-4', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '满编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-03-25 09:00:00', approvedAt: '2026-03-25 10:00:00' },
  { id: 'hist-705', establishmentId: 'est-dept-yfb-pos-001-2026-5', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '满编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-04-25 09:00:00', approvedAt: '2026-04-25 10:00:00' },
  { id: 'hist-706', establishmentId: 'est-dept-yfb-pos-001-2026-6', oldQuota: 5, newQuota: 5, reason: 'natural_turnover', remark: '满编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-05-25 09:00:00', approvedAt: '2026-05-25 10:00:00' },

  // ========== 7月数据（已审批通过）==========
  { id: 'hist-010', establishmentId: 'est-dept-qdz-pos-001-2026-7', oldQuota: 0, newQuota: 15, reason: 'business_expansion', remark: 'Q3业务扩张', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-01 09:00:00', approvedAt: '2026-06-01 10:00:00' },
  { id: 'hist-011', establishmentId: 'est-dept-bdz-pos-002-2026-7', oldQuota: 0, newQuota: 12, reason: 'business_expansion', remark: '后端团队扩编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-05 09:00:00', approvedAt: '2026-06-05 11:00:00' },
  { id: 'hist-012', establishmentId: 'est-dept-cpb-pos-003-2026-7', oldQuota: 0, newQuota: 5, reason: 'business_expansion', remark: '产品线扩张', applicantId: 'user-003', applicantName: '王五', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-08 14:00:00', approvedAt: '2026-06-08 16:00:00' },
  { id: 'hist-013', establishmentId: 'est-dept-xsb-pos-004-2026-7', oldQuota: 0, newQuota: 8, reason: 'business_expansion', remark: '销售扩张', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-10 09:00:00', approvedAt: '2026-06-10 11:00:00' },
  { id: 'hist-014', establishmentId: 'est-dept-scb-pos-005-2026-7', oldQuota: 0, newQuota: 25, reason: 'natural_turnover', remark: '市场团队补充', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-12 10:00:00', approvedAt: '2026-06-12 14:00:00' },
  { id: 'hist-015', establishmentId: 'est-dept-zlb-pos-006-2026-7', oldQuota: 0, newQuota: 10, reason: 'other', remark: '新增质量工程师', applicantId: 'user-006', applicantName: '周八', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-14 09:00:00', approvedAt: '2026-06-14 11:00:00' },

  // ========== 8月数据（待审批/已驳回，矩阵图不显示）==========
  { id: 'hist-020', establishmentId: 'est-dept-qdz-pos-001-2026-8', oldQuota: 0, newQuota: 18, reason: 'business_expansion', remark: '8月追加招聘', applicantId: 'user-001', applicantName: '张三', status: 'pending', tenantId: 'tenant-001', createdAt: '2026-06-15 09:00:00' },
  { id: 'hist-021', establishmentId: 'est-dept-cpb-pos-003-2026-8', oldQuota: 5, newQuota: 6, reason: 'business_expansion', remark: '产品线扩张', applicantId: 'user-003', applicantName: '王五', status: 'pending', tenantId: 'tenant-001', createdAt: '2026-06-15 10:00:00' },
  { id: 'hist-030', establishmentId: 'est-dept-xsb-pos-004-2026-8', oldQuota: 8, newQuota: 15, reason: 'business_expansion', remark: '销售大幅扩张', applicantId: 'user-004', applicantName: '赵六', approverId: 'user-002', approverName: '李四', status: 'rejected', tenantId: 'tenant-001', createdAt: '2026-06-12 09:00:00', approvedAt: '2026-06-12 15:00:00' },
  { id: 'hist-031', establishmentId: 'est-dept-scb-pos-005-2026-8', oldQuota: 25, newQuota: 30, reason: 'business_expansion', remark: '市场预算增加', applicantId: 'user-005', applicantName: '孙七', approverId: 'user-002', approverName: '李四', status: 'rejected', tenantId: 'tenant-001', createdAt: '2026-06-13 09:00:00', approvedAt: '2026-06-13 16:00:00' },

  // ========== 锁定功能测试数据的历史记录 ==========
  // 前端组-前端开发工程师 2026/07（锁定中，需要先有approved记录才能显示）
  { id: 'hist-040', establishmentId: 'est-dept-qdz-pos-001-2026-7', oldQuota: 12, newQuota: 15, reason: 'business_expansion', remark: 'Q3前端扩编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-01 09:00:00', approvedAt: '2026-06-01 10:00:00' },

  // 后端组-后端开发工程师 2026/08（已锁定，需要先有approved记录才能显示）
  { id: 'hist-041', establishmentId: 'est-dept-bdz-pos-002-2026-8', oldQuota: 10, newQuota: 12, reason: 'business_expansion', remark: '8月后端扩编', applicantId: 'user-001', applicantName: '张三', approverId: 'user-002', approverName: '李四', status: 'approved', tenantId: 'tenant-001', createdAt: '2026-06-01 09:00:00', approvedAt: '2026-06-01 10:00:00' },
];

// 将部门列表转换为树形结构
export const buildDepartmentTree = (departments: Department[]): DepartmentTreeNode[] => {
  const map = new Map<string, DepartmentTreeNode>();
  const roots: DepartmentTreeNode[] = [];

  // 先将所有部门转换为节点
  departments.forEach((dept) => {
    map.set(dept.id, { ...dept, children: [] });
  });

  // 再构建树形结构
  departments.forEach((dept) => {
    const node = map.get(dept.id)!;
    if (dept.parentId === null) {
      roots.push(node);
    } else {
      const parent = map.get(dept.parentId);
      if (parent) {
        parent.children = parent.children || [];
        parent.children.push(node);
      }
    }
  });

  // 按 sort 排序
  const sortChildren = (nodes: DepartmentTreeNode[]) => {
    nodes.sort((a, b) => a.sort - b.sort);
    nodes.forEach((node) => {
      if (node.children && node.children.length > 0) {
        sortChildren(node.children);
      }
    });
  };

  sortChildren(roots);
  return roots;
};

// 构建思维导图数据
export const buildMindMapData = (departments: Department[]): MindMapNode[] => {
  const tree = buildDepartmentTree(departments);
  const convertToMindMap = (nodes: DepartmentTreeNode[]): MindMapNode[] => {
    return nodes.map((node) => ({
      id: node.id,
      name: node.name,
      parentId: node.parentId,
      children: node.children ? convertToMindMap(node.children) : undefined,
    }));
  };
  return convertToMindMap(tree);
};

// 获取思维导图节点位置（初始横向布局）
export const calculateMindMapPositions = (
  nodes: MindMapNode[],
  startX: number = 400,
  startY: number = 50,
  levelGap: number = 150,
  nodeGap: number = 60
): MindMapNode[] => {
  let currentY = startY;

  const layoutLevel = (node: MindMapNode, x: number, y: number): MindMapNode => {
    const children = node.children || [];
    const totalHeight = (children.length - 1) * nodeGap;
    let childY = y - totalHeight / 2;

    const result: MindMapNode = {
      ...node,
      position: { x, y },
      children: children.map((child) => {
        const layouted = layoutLevel(child, x + levelGap, childY);
        childY += nodeGap;
        return layouted;
      }),
    };

    return result;
  };

  return nodes.map((node) => layoutLevel(node, startX, currentY + nodes.length * nodeGap / 2));
};

// 获取职位名称
export const getPositionName = (positionId: string, positionsOverride?: Position[]): string => {
  const list = positionsOverride || mockPositions;
  const position = list.find((p) => p.id === positionId);
  return position?.name || '';
};

// 获取部门名称
export const getDepartmentName = (departmentId: string, departmentsOverride?: Department[]): string => {
  const list = departmentsOverride || mockDepartments;
  const department = list.find((d) => d.id === departmentId);
  return department?.name || '';
};

// 获取部门完整路径（从根到当前节点）
export const getDepartmentFullPath = (departmentId: string, departmentsOverride?: Department[]): string => {
  const list = departmentsOverride || mockDepartments;
  const path: string[] = [];
  let current = list.find((d) => d.id === departmentId);

  while (current) {
    path.unshift(current.name);
    if (current.parentId) {
      current = list.find((d) => d.id === current!.parentId);
    } else {
      break;
    }
  }

  return path.join('-');
};

// 根据路径获取部门ID
export const getDepartmentIdByPath = (pathStr: string): string | null => {
  // pathStr 格式：华翔集团-华翔科技-研发部
  const pathParts = pathStr.split('-');

  // 从根节点开始查找
  let currentDept = mockDepartments.find((d) => d.parentId === null);

  for (const part of pathParts) {
    if (!currentDept) return null;

    if (currentDept.name === part) {
      // 已经是最后一个节点
      if (pathParts.indexOf(part) === pathParts.length - 1) {
        return currentDept.id;
      }
      // 继续往下找子部门
      const children = mockDepartments.filter((d) => d.parentId === currentDept!.id);
      currentDept = children.find((c) => pathParts.includes(c.name));
    } else {
      return null;
    }
  }

  return currentDept?.id || null;
};

// 获取所有部门
export const getAllDepartments = (): Department[] => {
  return [...mockDepartments];
};

// 递归获取部门及其所有子部门的ID列表
export const getDepartmentAndDescendantIds = (departmentId: string): string[] => {
  const ids = [departmentId];
  const children = mockDepartments.filter((d) => d.parentId === departmentId);
  children.forEach((child) => {
    ids.push(...getDepartmentAndDescendantIds(child.id));
  });
  return ids;
};

// 获取部门树（扁平化所有节点，包含层级信息）
export const getDepartmentTreeFlat = (): DepartmentTreeNode[] => {
  return buildDepartmentTree(mockDepartments);
};

// 获取部门及子部门的总职位数量
export const getDepartmentPositionCount = (departmentId: string): number => {
  const allDeptIds = getDepartmentAndDescendantIds(departmentId);
  return mockPositions.filter((p) => p.departmentId && allDeptIds.includes(p.departmentId)).length;
};

// 计算过滤后树的职位数量（基于给定的部门列表）
export const calculatePositionCountsForTree = (
  tree: DepartmentTreeNode[],
  positions: Position[]
): Record<string, number> => {
  const counts: Record<string, number> = {};

  // 递归计算某个节点及其子部门的职位数
  const calcCount = (nodeId: string): number => {
    // 获取该部门及所有子部门的ID
    const getDescendantIds = (deptId: string): string[] => {
      const ids = [deptId];
      const children = tree.filter((d) => d.parentId === deptId);
      children.forEach((child) => {
        ids.push(...getDescendantIds(child.id));
      });
      return ids;
    };

    const allDeptIds = getDescendantIds(nodeId);
    return positions.filter((p) => p.departmentId && allDeptIds.includes(p.departmentId)).length;
  };

  // 遍历树计算每个节点的职位数
  const traverse = (nodes: DepartmentTreeNode[]) => {
    nodes.forEach((node) => {
      counts[node.id] = calcCount(node.id);
      if (node.children) {
        traverse(node.children);
      }
    });
  };

  traverse(tree);
  return counts;
};

//模糊搜索部门（支持名称+职位名称）
export const searchDepartments = (keyword: string): DepartmentTreeNode[] => {
  if (!keyword.trim()) {
    return buildDepartmentTree(mockDepartments);
  }

  const lowerKeyword = keyword.toLowerCase();

  // 找出匹配关键字的部门及其祖先部门
  const matchedDeptIds = new Set<string>();

  // 检查部门名称
  mockDepartments.forEach((dept) => {
    if (dept.name.toLowerCase().includes(lowerKeyword)) {
      // 添加该部门及其所有祖先
      let current: Department | undefined = dept;
      while (current) {
        matchedDeptIds.add(current.id);
        current = current.parentId
          ? mockDepartments.find((d) => d.id === current!.parentId)
          : undefined;
      }
    }
  });

  // 检查职位名称
  mockPositions.forEach((pos) => {
    if (pos.name.toLowerCase().includes(lowerKeyword)) {
      // 添加该职位所属部门及其所有祖先
      let current: Department | undefined = mockDepartments.find(
        (d) => d.id === pos.departmentId
      );
      while (current) {
        matchedDeptIds.add(current.id);
        current = current.parentId
          ? mockDepartments.find((d) => d.id === current!.parentId)
          : undefined;
      }
    }
  });

  // 过滤出匹配的部门
  const matchedDepartments = mockDepartments.filter((d) =>
    matchedDeptIds.has(d.id)
  );

  return buildDepartmentTree(matchedDepartments);
};

// 生成编制矩阵数据
export const buildEstablishmentMatrix = (
  establishments: Establishment[],
  year: number,
  positionsOverride?: Position[],
  departmentsOverride?: Department[]
): { headers: string[]; rows: EstablishmentMatrixRow[] } => {
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
  const headers = months.map((m) => `${year}/${m.toString().padStart(2, '0')}`);

  // 按部门和职位分组
  const deptPosMap = new Map<string, EstablishmentMatrixRow>();

  establishments
    .filter((e) => e.year === year)
    .forEach((est) => {
      const key = `${est.departmentId}-${est.positionId}`;
      if (!deptPosMap.has(key)) {
        deptPosMap.set(key, {
          departmentId: est.departmentId,
          departmentName: getDepartmentFullPath(est.departmentId, departmentsOverride),
          positionId: est.positionId,
          positionName: getPositionName(est.positionId, positionsOverride),
          cells: [],
        });
      }
      const row = deptPosMap.get(key)!;
      const occupied = getEstablishmentOccupied(est.id);
      const remaining = est.quota - occupied;

      // 计算基础状态（基于配额占用情况）
      let baseStatus: 'normal' | 'warning' | 'danger' = 'normal';
      if (remaining <= 0) baseStatus = 'danger';
      else if (remaining <= est.quota * 0.2) baseStatus = 'warning';

      // 锁定状态优先级高于基础状态
      let status: 'normal' | 'warning' | 'danger' | 'locking' | 'locked' = baseStatus;
      if (est.lockStatus === 'locking') status = 'locking';
      else if (est.lockStatus === 'locked') status = 'locked';

      row.cells.push({
        establishmentId: est.id,
        year: est.year,
        month: est.month,
        quota: est.quota,
        occupied,
        remaining,
        status,
        lockStatus: est.lockStatus,
        lockReason: est.lockReason,
        lockExpiredAt: est.lockExpiredAt,
      });
    });

  // 填充所有月份（即使是空单元格也显示）
  const rows = Array.from(deptPosMap.values()).map((row) => {
    // 按月份排序
    row.cells.sort((a, b) => a.month - b.month);

    // 填充缺失的月份
    const filledCells: EstablishmentMatrixCell[] = [];
    let cellIndex = 0;
    for (let m = 1; m <= 12; m++) {
      if (cellIndex < row.cells.length && row.cells[cellIndex].month === m) {
        filledCells.push(row.cells[cellIndex]);
        cellIndex++;
      } else {
        // 填充空单元格
        filledCells.push({
          establishmentId: '',
          year,
          month: m,
          quota: 0,
          occupied: 0,
          remaining: 0,
          status: 'empty',
          lockStatus: 'none',
        });
      }
    }
    row.cells = filledCells;
    return row;
  });

  return { headers, rows };
};

// ==================== 职级 Mock 数据 ====================

// 职能部门职级（显式指定 track: 'admin'）
const adminRanks: Rank[] = [
  { id: 'rank-m13', code: 'M13', name: '董事长', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m12', code: 'M12', name: '总裁', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m11', code: 'M11', name: '副总裁', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m10', code: 'M10', name: '总经理/总监', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m9', code: 'M9', name: '副总经理/副总监/产品公司总经理/分公司总经理/总裁助理', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m8', code: 'M8', name: '产品公司副总经理/分公司副总经理/事业部总经理助理/平台总监助理', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m7', code: 'M7', name: '产品公司总经理助理/部长', track: 'admin', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m6', code: 'M6', name: '副部长', track: 'admin', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m5', code: 'M5', name: '主管', track: 'admin', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p4', code: 'P4', name: '主任专员', track: 'admin', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p3', code: 'P3', name: '专员', track: 'admin', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-o2', code: 'O2', name: '熟练辅助工', track: 'admin', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-o1', code: 'O1', name: '辅助工', track: 'admin', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
];

// 技术部门职级（显式指定 track: 'tech'）
const techRanks: Rank[] = [
  { id: 'rank-p11', code: 'P11', name: '总工程师', track: 'tech', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p10', code: 'P10', name: '副总工程师', track: 'tech', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p8', code: 'P8', name: '专家级工程师', track: 'tech', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p7', code: 'P7', name: '高级工程师/高级精益教练', track: 'tech', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p6', code: 'P6', name: '中级工程师/中级精益教练', track: 'tech', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p6a', code: 'P6', name: '工程师/精益教练', track: 'tech', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p4a', code: 'P4', name: '助理工程师/精益主任专员', track: 'tech', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p3a', code: 'P3', name: '技术员/精益专员', track: 'tech', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p2', code: 'P2', name: '见习专员/见习精益专员', track: 'tech', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
];

// 工厂职级（显式指定 track: 'factory'）
const factoryRanks: Rank[] = [
  { id: 'rank-m7a', code: 'M7', name: '厂长', track: 'factory', level: 'high', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m6a', code: 'M6', name: '副厂长', track: 'factory', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m5a', code: 'M5', name: '主任/副主任', track: 'factory', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-m4', code: 'M4', name: '班长/副班长', track: 'factory', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-p3b', code: 'P3', name: '多能工', track: 'factory', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-o2a', code: 'O2', name: '熟练操作工', track: 'factory', level: 'middle', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
  { id: 'rank-o1a', code: 'O1', name: '操作工', track: 'factory', level: 'low', tenantId: 'tenant-001', createdAt: '2024-01-01 00:00:00', updatedAt: '2024-01-01 00:00:00' },
];

export const mockRanks: Rank[] = [...adminRanks, ...techRanks, ...factoryRanks];