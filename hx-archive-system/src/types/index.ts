export * from './archive';
export * from './salary';
export * from './report-work';

// ========================================
// 通用类型
// ========================================

export type UserRole = 'system_admin' | 'hr_admin' | 'department_head' | 'employee' | 'finance';

export interface User {
  id: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
}

export interface Permission {
  action: string;
  resource: string;
}

export interface PageResult<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
}