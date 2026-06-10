import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Employee, ArchiveDetail } from '@/types';

// ========================================
// 操作日志类型
// ========================================

export interface EditLogEntry {
  id: string;
  operateTime: string;
  operator: string;
  operateType: '新增' | '修改' | '删除';
  operateModule: '入职信息' | '基本信息' | '个人材料';
  changedFields: string;
  changeReason?: string;
}

// ========================================
// 人员档案状态管理
// ========================================

interface ArchiveStore {
  // 列表数据
  list: Employee[];
  loading: boolean;
  error: string | null;

  // 当前查看的员工
  currentEmployee: Employee | null;
  currentDetail: ArchiveDetail | null;

  // 详情页Tab
  activeTab: 'entry' | 'basic' | 'materials' | 'probation' | 'transfer' | 'resignation' | 'approval' | 'contract';

  // 当前合同的详情
  currentContractDetail: import('@/types').ContractDetail | null;
  contractDrawerVisible: boolean;

  // 编辑模式状态
  editMode: {
    entry: boolean;
    basic: boolean;
    materials: boolean;
  };

  // 操作日志
  editLogs: EditLogEntry[];

  // 筛选条件
  filters: {
    departmentId?: string;
    status?: 'all' | 'active' | 'archived';
    entryDateRange?: [string, string];
    searchText?: string;
  };

  // 分页
  pagination: {
    page: number;
    pageSize: number;
    total: number;
  };

  // Actions
  setList: (list: Employee[]) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;

  setCurrentEmployee: (employee: Employee | null) => void;
  setCurrentDetail: (detail: ArchiveDetail | null) => void;

  setActiveTab: (tab: 'entry' | 'basic' | 'materials' | 'probation' | 'transfer' | 'resignation' | 'approval' | 'contract') => void;
  setCurrentContractDetail: (detail: import('@/types').ContractDetail | null) => void;
  setContractDrawerVisible: (visible: boolean) => void;

  // 编辑模式
  setEditMode: (tab: 'entry' | 'basic' | 'materials', editing: boolean) => void;
  addEditLog: (log: Omit<EditLogEntry, 'id' | 'operateTime'>) => void;

  setFilters: (filters: Partial<ArchiveStore['filters']>) => void;
  setPagination: (pagination: Partial<ArchiveStore['pagination']>) => void;

  reset: () => void;
}

const initialState = {
  list: [] as Employee[],
  loading: false,
  error: null as string | null,
  currentEmployee: null as Employee | null,
  currentDetail: null as ArchiveDetail | null,
  activeTab: 'entry' as const,
  currentContractDetail: null,
  contractDrawerVisible: false,
  editMode: {
    entry: false,
    basic: false,
    materials: false,
  },
  editLogs: [] as EditLogEntry[],
  filters: {
    status: 'all' as const,
  },
  pagination: {
    page: 1,
    pageSize: 10,
    total: 0,
  },
};

export const useArchiveStore = create<ArchiveStore>()(
  persist(
    (set) => ({
      ...initialState,

      setList: (list) => set({ list }),
      setLoading: (loading) => set({ loading }),
      setError: (error) => set({ error }),

      setCurrentEmployee: (employee) => set({ currentEmployee: employee }),
      setCurrentDetail: (detail) => set({ currentDetail: detail }),

      setActiveTab: (tab) => set({ activeTab: tab }),
      setCurrentContractDetail: (detail) => set({ currentContractDetail: detail }),
      setContractDrawerVisible: (visible) => set({ contractDrawerVisible: visible }),

      setEditMode: (tab, editing) =>
        set((state) => ({
          editMode: { ...state.editMode, [tab]: editing },
        })),

      addEditLog: (log) =>
        set((state) => ({
          editLogs: [
            {
              ...log,
              id: `log_${Date.now()}`,
              operateTime: new Date().toISOString(),
            },
            ...state.editLogs,
          ],
        })),

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
      name: 'archive-storage',
      partialize: (state) => ({
        currentEmployee: state.currentEmployee,
        activeTab: state.activeTab,
        filters: state.filters,
        pagination: state.pagination,
      }),
    }
  )
);