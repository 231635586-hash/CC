import type { PageResult, ReportRecord, SupplementApplication, ReportFilters, SupplementFilters } from '@/types';
import { mockReportRecords, mockSupplementApplications } from './mockData';

// 模拟延迟
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// 报工记录相关API

export async function fetchReportList(params: {
  page: number;
  pageSize: number;
  filters?: ReportFilters;
}): Promise<PageResult<ReportRecord>> {
  await delay(500);

  let filtered = [...mockReportRecords];

  // 应用筛选
  if (params.filters?.status) {
    filtered = filtered.filter(r => r.status === params.filters?.status);
  }
  if (params.filters?.dateRange) {
    const [start, end] = params.filters.dateRange;
    filtered = filtered.filter(r => r.date >= start && r.date <= end);
  }
  if (params.filters?.searchText) {
    const text = params.filters.searchText.toLowerCase();
    filtered = filtered.filter(r =>
      r.employeeName.toLowerCase().includes(text) ||
      r.departmentName.toLowerCase().includes(text)
    );
  }

  // 分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const list = filtered.slice(start, end);

  return {
    list,
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function fetchReportById(id: string): Promise<ReportRecord | null> {
  await delay(300);
  return mockReportRecords.find(r => r.id === id) || null;
}

// 补报申请相关API

export async function fetchSupplementList(params: {
  page: number;
  pageSize: number;
  filters?: SupplementFilters;
}): Promise<PageResult<SupplementApplication>> {
  await delay(500);

  let filtered = [...mockSupplementApplications];

  // 应用筛选
  if (params.filters?.status) {
    filtered = filtered.filter(s => s.status === params.filters?.status);
  }
  if (params.filters?.dateRange) {
    const [start, end] = params.filters.dateRange;
    filtered = filtered.filter(s => s.supplementDate >= start && s.supplementDate <= end);
  }

  // 分页
  const start = (params.page - 1) * params.pageSize;
  const end = start + params.pageSize;
  const list = filtered.slice(start, end);

  return {
    list,
    total: filtered.length,
    page: params.page,
    pageSize: params.pageSize,
  };
}

export async function fetchSupplementById(id: string): Promise<SupplementApplication | null> {
  await delay(300);
  return mockSupplementApplications.find(s => s.id === id) || null;
}

export async function createSupplementApplication(data: {
  supplementDate: string;
  shiftType: string;
  reportPoint: string;
  approverId: string;
  reason?: string;
}): Promise<SupplementApplication> {
  await delay(500);

  const newApplication: SupplementApplication = {
    id: `sup${Date.now()}`,
    employeeId: 'emp001', // 模拟当前用户
    employeeName: '张三', // 模拟当前用户
    departmentName: '生产一班',
    supplementDate: data.supplementDate,
    shiftType: data.shiftType as SupplementApplication['shiftType'],
    reportPoint: data.reportPoint,
    approverId: data.approverId,
    approverName: data.approverId === '1' ? '王建国' : data.approverId === '2' ? '张志明' : '李伟',
    reason: data.reason,
    status: '待审批',
    applyTime: new Date().toISOString().replace('T', ' ').slice(0, 19),
  };

  mockSupplementApplications.unshift(newApplication);
  return newApplication;
}

export async function approveSupplement(id: string): Promise<boolean> {
  await delay(500);
  const item = mockSupplementApplications.find(s => s.id === id);
  if (item) {
    item.status = '已通过';
    item.approveTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return true;
  }
  return false;
}

export async function rejectSupplement(id: string, reason: string): Promise<boolean> {
  await delay(500);
  const item = mockSupplementApplications.find(s => s.id === id);
  if (item) {
    item.status = '已驳回';
    item.approveTime = new Date().toISOString().replace('T', ' ').slice(0, 19);
    item.rejectReason = reason;
    return true;
  }
  return false;
}

// 编辑补报申请信息（仅限班次、报工点、审批班长）
export async function updateSupplementApplication(id: string, data: {
  shiftType: string;
  reportPoint: string;
  approverId: string;
  approverName: string;
}): Promise<boolean> {
  await delay(500);
  const item = mockSupplementApplications.find(s => s.id === id);
  if (item) {
    item.shiftType = data.shiftType as SupplementApplication['shiftType'];
    item.reportPoint = data.reportPoint;
    item.approverId = data.approverId;
    item.approverName = data.approverName;
    return true;
  }
  return false;
}

// 编辑报工记录（Web端管理员功能）
export async function updateReportRecord(id: string, data: {
  shiftType?: string;
  reportPoint?: string;
  reportTime?: string;
  modifyReason: string;
}): Promise<boolean> {
  await delay(500);
  const item = mockReportRecords.find(r => r.id === id);
  if (item) {
    if (data.shiftType) item.shiftType = data.shiftType as ReportRecord['shiftType'];
    if (data.reportPoint) item.reportPoint = data.reportPoint;
    if (data.reportTime) item.reportTime = data.reportTime;
    item.updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);
    return true;
  }
  return false;
}