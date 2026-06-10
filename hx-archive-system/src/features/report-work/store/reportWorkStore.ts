import { create } from 'zustand';
import type { ReportRecord, SupplementApplication, ReportFilters, SupplementFilters } from '@/types';

interface ReportWorkState {
  // 报工记录
  reportList: ReportRecord[];
  reportLoading: boolean;
  reportFilters: ReportFilters;
  reportPagination: { page: number; pageSize: number; total: number };

  // 补报申请
  supplementList: SupplementApplication[];
  supplementLoading: boolean;
  supplementFilters: SupplementFilters;
  supplementPagination: { page: number; pageSize: number; total: number };

  // 当前选中的记录
  currentReport: ReportRecord | null;
  currentSupplement: SupplementApplication | null;

  // 操作方法
  setReportList: (list: ReportRecord[]) => void;
  setReportLoading: (loading: boolean) => void;
  setReportFilters: (filters: ReportFilters) => void;
  setReportPagination: (pagination: { page?: number; pageSize?: number; total?: number }) => void;

  setSupplementList: (list: SupplementApplication[]) => void;
  setSupplementLoading: (loading: boolean) => void;
  setSupplementFilters: (filters: SupplementFilters) => void;
  setSupplementPagination: (pagination: { page?: number; pageSize?: number; total?: number }) => void;

  setCurrentReport: (report: ReportRecord | null) => void;
  setCurrentSupplement: (supplement: SupplementApplication | null) => void;
}

export const useReportWorkStore = create<ReportWorkState>((set) => ({
  // 报工记录
  reportList: [],
  reportLoading: false,
  reportFilters: {},
  reportPagination: { page: 1, pageSize: 10, total: 0 },

  // 补报申请
  supplementList: [],
  supplementLoading: false,
  supplementFilters: {},
  supplementPagination: { page: 1, pageSize: 10, total: 0 },

  // 当前选中的记录
  currentReport: null,
  currentSupplement: null,

  // 操作方法
  setReportList: (list) => set({ reportList: list }),
  setReportLoading: (loading) => set({ reportLoading: loading }),
  setReportFilters: (filters) => set({ reportFilters: filters }),
  setReportPagination: (pagination) => set((state) => ({
    reportPagination: { ...state.reportPagination, ...pagination }
  })),

  setSupplementList: (list) => set({ supplementList: list }),
  setSupplementLoading: (loading) => set({ supplementLoading: loading }),
  setSupplementFilters: (filters) => set({ supplementFilters: filters }),
  setSupplementPagination: (pagination) => set((state) => ({
    supplementPagination: { ...state.supplementPagination, ...pagination }
  })),

  setCurrentReport: (report) => set({ currentReport: report }),
  setCurrentSupplement: (supplement) => set({ currentSupplement: supplement }),
}));