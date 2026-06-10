import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { PayrollRecord, SalaryDetail } from '@/types';

// ========================================
// 薪资档案状态管理
// ========================================

interface SalaryStore {
  // 列表数据
  list: PayrollRecord[];
  loading: boolean;
  error: string | null;

  // 当前工资条
  currentPayroll: PayrollRecord | null;
  currentDetail: SalaryDetail | null;

  // 筛选条件
  filters: {
    departmentId?: string;
    issueMonth?: string;
    issueStatus?: 'all' | 'paid' | 'unpaid';
    searchText?: string;
  };

  // 分页
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };

  // Actions
  setList: (list: PayrollRecord[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setCurrentPayroll: (payroll: PayrollRecord | null) => void;
  setCurrentDetail: (detail: SalaryDetail | null) => void;

  setFilters: (filters: Partial<SalaryStore['filters']>) => void;
  setPagination: (pagination: Partial<SalaryStore['pagination']>) => void;

  reset: () => void;
}

const initialState = {
  list: [] as PayrollRecord[],
  loading: false,
  error: null as string | null,
  currentPayroll: null as PayrollRecord | null,
  currentDetail: null as SalaryDetail | null,
  filters: {
    issueStatus: 'all' as const,
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

export const useSalaryStore = create<SalaryStore>()(
  persist(
    (set) => ({
      ...initialState,

      setList: (list) => set({ list }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      setCurrentPayroll: (payroll) => set({ currentPayroll: payroll }),
      setCurrentDetail: (detail) => set({ currentDetail: detail }),

      setFilters: (filters) =>
        set((state) => ({
          filters: { ...state.filters, ...filters },
        })),
      setPagination: (pagination) =>
        set((state) => ({
          pagination: { ...state.pagination, ...pagination },
        })),

      reset: () => set(initialState),
    }),
    {
      name: 'salary-storage',
      partialize: (state) => ({
        currentPayroll: state.currentPayroll,
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);