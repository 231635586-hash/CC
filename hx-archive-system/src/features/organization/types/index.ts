// 部门管理类型
export interface Department {
  id: string;
  name: string;
  code: string;
  parentId: string | null;
  level: number;
  sort: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentTreeNode extends Department {
  children?: DepartmentTreeNode[];
}

export interface MindMapNode {
  id: string;
  name: string;
  parentId: string | null;
  children?: MindMapNode[];
  position?: { x: number; y: number };
}

// 职位管理类型
export interface Position {
  id: string;
  name: string;
  code: string;
  departmentId?: string;
  employeeCount?: number; // 在职员工数
  description?: string; // 职位说明
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

// 编制管理类型
export interface Establishment {
  id: string;
  departmentId: string;
  positionId: string;
  year: number;
  month: number;
  quota: number;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  // 锁定相关字段
  lockStatus?: 'none' | 'locking' | 'locked';
  lockReason?: string;
  lockExpiredAt?: string;
  unlockReason?: string;
  unlockExpiredAt?: string;
}

export interface EstablishmentMatrixCell {
  establishmentId: string;
  year: number;
  month: number;
  quota: number;
  occupied: number;
  remaining: number;
  status: 'normal' | 'warning' | 'danger' | 'empty' | 'locking' | 'locked';
  lockStatus?: 'none' | 'locking' | 'locked'; // 锁定状态
  lockReason?: string; // 锁定原因
  lockExpiredAt?: string; // 锁定过期时间
}

export interface EstablishmentMatrixRow {
  departmentId: string;
  departmentName: string;
  positionId: string;
  positionName: string;
  cells: EstablishmentMatrixCell[];
}

export interface EstablishmentHistory {
  id: string;
  establishmentId: string;
  oldQuota: number;
  newQuota: number;
  reason: 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other';
  remark?: string;
  applicantId: string;
  applicantName: string;
  approverId?: string;
  approverName?: string;
  status: 'pending' | 'approved' | 'rejected';
  tenantId: string;
  createdAt: string;
  approvedAt?: string;
}

// 操作日志
export interface OperationLog {
  id: string;
  operatorId: string;
  module: 'department' | 'position' | 'establishment';
  action: 'create' | 'update' | 'delete' | 'import' | 'export' | 'sync' | 'submit_approval' | 'approve' | 'reject';
  targetId: string;
  detail?: Record<string, any>;
  ip?: string;
  tenantId: string;
  createdAt: string;
}

// API 请求/响应类型
export interface ApiResponse<T> {
  code: number;
  data?: T;
  message?: string;
}

export interface DepartmentFormData {
  name: string;
  parentId: string | null;
}

export interface EstablishmentFormData {
  newQuota: number;
  reason: 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other';
  remark?: string;
}

// ==================== 部门档案类型 ====================

export interface DepartmentArchiveSummary {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  parentDepartment: { id: string; name: string } | null;
  hierarchyPath: string;
  childDepartmentCount: number;
  positionCount: number;
  employeeCount: number;
  establishmentSummary: {
    totalQuota: number;
    totalOccupied: number;
    totalRemaining: number;
  };
  createdAt: string;
}

export type ChangeRecordType = '入职' | '转正' | '调岗' | '晋升' | '降职' | '离职';

export interface ChangeRecord {
  id: string;
  changeType: ChangeRecordType;
  employeeId: string;
  employeeName: string;
  employeeNo: string;
  changeDate: string;
  changeBefore: {
    departmentName?: string;
    positionName?: string;
    rankLevel?: string;
  };
  changeAfter: {
    departmentName?: string;
    positionName?: string;
    rankLevel?: string;
  };
  reason?: string;
}

export type EmployeeRosterStatus = 'all' | 'active' | 'probation' | 'archived';

export interface EmployeeRosterItem {
  id: string;
  employeeNo: string;
  name: string;
  positionName: string;
  rankLevelCode?: string; // 职级代码，如 M12, P8, O2
  entryDate: string;
  status: 'active' | 'archived';
  phone: string;
  departmentName: string;
}

// ==================== 职级管理类型 ====================

export type RankTrackType = 'admin' | 'tech' | 'factory'; // 序列：职能部门/技术部门/工厂
export type RankLevelType = 'high' | 'middle' | 'low'; // 职层：高层/中层/基层

export interface Rank {
  id: string;
  code: string; // 职级代码，如 M13, P11, O1
  name: string; // 职务名称，如 董事长, 总工程师
  track: RankTrackType; // 职务划分
  level: RankLevelType; // 职层
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}

export const RANK_TRACK_MAP: Record<RankTrackType, string> = {
  admin: '职能部门',
  tech: '技术部门',
  factory: '工厂',
};

export const RANK_LEVEL_MAP: Record<RankLevelType, string> = {
  high: '高层',
  middle: '中层',
  low: '基层',
};

// 职层范围定义：M13/M12/M11/M10/M9/M8/M7/P11/P10/P8=高层, M6/M5/M4/P7/P6/P5/P4/O2=中层, P3/P2/O1=基层
export const RANK_LEVEL_BY_CODE: Record<string, RankLevelType> = {
  // 高层
  M13: 'high',
  M12: 'high',
  M11: 'high',
  M10: 'high',
  M9: 'high',
  M8: 'high',
  M7: 'high',
  P11: 'high',
  P10: 'high',
  P8: 'high',
  // 中层
  M6: 'middle',
  M5: 'middle',
  M4: 'middle',
  P7: 'middle',
  P6: 'middle',
  P5: 'middle',
  P4: 'middle',
  O2: 'middle',
  // 基层
  P3: 'low',
  P2: 'low',
  O1: 'low',
};

// ==================== 审批记录类型 ====================

export interface ApprovalRecord {
  id: string;
  establishmentId: string;
  applicantId: string;
  applicantName: string;
  departmentName: string;
  positionName: string;
  oldQuota: number;
  newQuota: number;
  changeReason: string;
  remark?: string;
  dingtalkInstanceId?: string;
  dingtalkProcessCode?: string;
  status: 'pending' | 'approved' | 'rejected';
  approverName?: string;
  approvedAt?: string;
  rejectReason?: string;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
}