import type { Employee, ArchiveDetail, PayrollRecord, PageResult } from '@/types';
import { mockEmployees, mockArchiveDetails, mockPayrolls } from './mockData';

// ========================================
// API 服务层（Mock）
// 后续接入真实 API 时，只需修改这里的实现
// ========================================

// 模拟延迟
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// ========================================
// 人员档案 API
// ========================================

export async function fetchArchiveList(params: {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  status?: string;
  searchText?: string;
}): Promise<PageResult<Employee>> {
  await delay(500);

  const { page = 1, pageSize = 10, departmentId, status, searchText } = params;

  let filtered = [...mockEmployees];

  if (departmentId) {
    filtered = filtered.filter((e) => e.departmentId === departmentId);
  }

  if (status && status !== 'all') {
    filtered = filtered.filter((e) => e.status === status);
  }

  if (searchText) {
    const keyword = searchText.toLowerCase();
    filtered = filtered.filter(
      (e) =>
        e.name.toLowerCase().includes(keyword) ||
        e.employeeNo.toLowerCase().includes(keyword) ||
        e.phone.includes(keyword)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export async function fetchArchiveDetail(id: string): Promise<ArchiveDetail | null> {
  await delay(300);

  // 尝试从预置数据获取
  if (mockArchiveDetails[id]) {
    return mockArchiveDetails[id];
  }

  // 根据员工ID查找
  const employee = mockEmployees.find((e) => e.id === id);
  if (!employee) return null;

  return {
    employee,
    transfers: [],
    resignations: [],
    approvalRecords: [],
    contracts: [],
  };
}

// ========================================
// 薪资档案 API
// ========================================

export async function fetchSalaryList(params: {
  page?: number;
  pageSize?: number;
  departmentId?: string;
  issueMonth?: string;
  issueStatus?: string;
  searchText?: string;
}): Promise<PageResult<PayrollRecord>> {
  await delay(500);

  const { page = 1, pageSize = 10, departmentId, issueMonth, issueStatus, searchText } = params;

  let filtered = [...mockPayrolls];

  if (departmentId) {
    filtered = filtered.filter((p) => p.departmentId === departmentId);
  }

  if (issueMonth) {
    filtered = filtered.filter((p) => p.issueMonth === issueMonth);
  }

  if (issueStatus && issueStatus !== 'all') {
    filtered = filtered.filter((p) => p.issueStatus === issueStatus);
  }

  if (searchText) {
    const keyword = searchText.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.employeeName.toLowerCase().includes(keyword) ||
        p.employeeId.toLowerCase().includes(keyword)
    );
  }

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const list = filtered.slice(start, start + pageSize);

  return { list, total, page, pageSize };
}

export async function fetchSalaryDetail(id: string): Promise<PayrollRecord | null> {
  await delay(300);

  return mockPayrolls.find((p) => p.id === id) || null;
}

// ========================================
// 部门 API
// ========================================

export async function fetchDepartments() {
  await delay(200);
  const { mockDepartments } = await import('./mockData');
  return mockDepartments;
}