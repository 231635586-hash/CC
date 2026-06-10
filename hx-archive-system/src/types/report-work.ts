// 报工记录相关类型

export interface ReportRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  date: string; // 格式：YYYY-MM-DD
  shiftType: ShiftType;
  reportPoint: string; // 报工点
  reportTime?: string; // 报工时间，格式：YYYY-MM-DD HH:mm
  reportMethod: '扫码' | '补报';
  status: ReportStatus;
  createdAt: string;
  updatedAt: string;
}

export type ShiftType = '白班' | '夜班' | '白倒夜18' | '夜倒白18' | '白倒夜24' | '夜倒白24';

export type ReportStatus = '已完成' | '未完成' | '已补报';

export interface SupplementApplication {
  id: string;
  employeeId: string;
  employeeName: string;
  departmentName: string;
  supplementDate: string; // 补报的日期
  shiftType: ShiftType;
  reportPoint: string;
  approverId: string;
  approverName: string; // 审批班长姓名
  reason?: string; // 补报原因
  status: SupplementStatus;
  applyTime: string;
  approveTime?: string;
  rejectReason?: string;
}

export type SupplementStatus = '待审批' | '已通过' | '已驳回';

export interface ReportPoint {
  id: string;
  name: string; // 如：车间A-入口
}

export interface Approver {
  id: string;
  name: string;
  department: string; // 班组/部门
  role: '班长' | '人事' | '车间主任' | '厂长';
}

export interface OperationLog {
  id: string;
  recordId: string;
  operationTime: string;
  operatorName: string;
  operationType: '新增' | '修改' | '补报' | '审批';
  operationContent: string;
}

// 筛选参数
export interface ReportFilters {
  dateRange?: [string, string]; // 开始日期, 结束日期
  status?: ReportStatus | '';
  searchText?: string;
}

export interface SupplementFilters {
  status?: SupplementStatus | '';
  dateRange?: [string, string];
}