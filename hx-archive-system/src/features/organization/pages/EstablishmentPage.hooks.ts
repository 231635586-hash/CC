import { useState, useEffect, useCallback, useMemo } from 'react';
import { useToast } from '@/components/ui/Toast';
import {
  getEstablishmentMatrix,
  getDepartmentTree,
  getDepartmentFullPath,
  applyEstablishmentChange,
  batchCreateEstablishment,
} from '../services/api';
import { YEAR_RANGE } from '../constants';
import type {
  DepartmentTreeNode,
  EstablishmentMatrixRow,
  EstablishmentMatrixCell,
} from '../types';

// ==================== 状态类型定义 ====================

export interface ApplyCell {
  establishmentId?: string;
  departmentId?: string;
  departmentName: string;
  positionId?: string;
  positionName: string;
  monthLabel: string;
  quota: number;
  occupied: number;
  remaining: number;
  lockReason?: string;
  lockExpiredAt?: string;
}

export interface HistoryModalData {
  establishmentId: string;
  departmentName: string;
  positionName: string;
}

export interface BatchPreview {
  row: EstablishmentMatrixRow;
  cellIndex: number;
  monthLabel: string;
  oldValue: number;
  newValue: number;
  establishmentId: string;
}

// ==================== 主 Hook ====================

export const useEstablishment = () => {
  const { toasts, addToast, removeToast } = useToast();

  // 年份
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());

  // 部门树
  const [departmentTree, setDepartmentTree] = useState<DepartmentTreeNode[]>([]);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState<string | undefined>();

  // 矩阵数据
  const [matrixData, setMatrixData] = useState<{ headers: string[]; rows: EstablishmentMatrixRow[] }>({
    headers: [],
    rows: [],
  });
  const [loading, setLoading] = useState(true);

  // 搜索相关
  const [searchKeyword, setSearchKeyword] = useState('');
  const [positionSearchKeyword, setPositionSearchKeyword] = useState('');
  const [autoExpandAll, setAutoExpandAll] = useState(false);
  const [highlightNodeIds, setHighlightNodeIds] = useState<Set<string>>(new Set());

  // 待审批数量（仅用于部门树展示）
  const [pendingApprovalCounts] = useState<Record<string, number>>({});

  // 申请弹窗
  const [applyModalOpen, setApplyModalOpen] = useState(false);
  const [applyModalMode, setApplyModalMode] = useState<'create' | 'edit'>('edit');
  const [applyCell, setApplyCell] = useState<ApplyCell | null>(null);

  // 历史面板
  const [historyPanelVisible, setHistoryPanelVisible] = useState(false);
  const [selectedEstablishmentId, setSelectedEstablishmentId] = useState<string | undefined>();
  const [selectedEstablishmentInfo, setSelectedEstablishmentInfo] = useState<{
    departmentName: string;
    positionName: string;
  } | undefined>();

  // 历史记录弹窗
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [historyModalData, setHistoryModalData] = useState<HistoryModalData | null>(null);

  // V1.4 编制详情 Drawer
  const [establishmentDetailVisible, setEstablishmentDetailVisible] = useState(false);
  const [establishmentDetailRow, setEstablishmentDetailRow] = useState<EstablishmentMatrixRow | null>(null);

  // V1.4 按职位维度查看历史（Drawer 内"查看全部"按钮跳转目标）
  const [historyByPositionVisible, setHistoryByPositionVisible] = useState(false);
  const [historyByPositionData, setHistoryByPositionData] = useState<{
    departmentId: string;
    positionId: string;
    year: number;
    departmentName: string;
    positionName: string;
  } | null>(null);

  // 审批记录弹窗
  const [approvalRecordsModalVisible, setApprovalRecordsModalVisible] = useState(false);

  // 解锁申请弹窗
  const [unlockModalOpen, setUnlockModalOpen] = useState(false);
  const [unlockCell, setUnlockCell] = useState<ApplyCell | null>(null);

  // 锁定申请弹窗
  const [lockModalOpen, setLockModalOpen] = useState(false);
  const [lockCell, setLockCell] = useState<ApplyCell | null>(null);

  // V1.4 临时编制续约弹窗（仅 expiring 状态触发）
  const [extendModalOpen, setExtendModalOpen] = useState(false);
  const [extendContext, setExtendContext] = useState<{
    establishmentId: string;
    currentEndDate: string;
    currentStartDate: string;
    quota: number;
    occupied: number;
    month: number;
    departmentName: string;
    positionName: string;
  } | null>(null);

  // 选择单元格模式（用于锁定操作）
  const [selectingCellForLock, setSelectingCellForLock] = useState(false);

  // 批量选择模式
  const [batchSelectMode, setBatchSelectMode] = useState(false);
  const [selectedEstablishmentIds, setSelectedEstablishmentIds] = useState<Set<string>>(new Set());

  // 批量操作弹窗
  const [batchLockModalOpen, setBatchLockModalOpen] = useState(false);
  const [batchLockModalMode, setBatchLockModalMode] = useState<'lock' | 'unlock'>('lock');

  // 批量导入
  const [batchModalOpen, setBatchModalOpen] = useState(false);
  const [batchModalType, setBatchModalType] = useState<'create' | 'adjust'>('create');

  // 新增编制
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // 批量编辑
  const [batchEditMode, setBatchEditMode] = useState(false);
  const [modifiedCells, setModifiedCells] = useState<Record<string, number>>({});

  // 批量预览
  const [batchPreviewOpen, setBatchPreviewOpen] = useState(false);
  const [batchPreviewLoading, setBatchPreviewLoading] = useState(false);

  // ==================== 计算属性 ====================

  const modifiedCellsCount = useMemo(() => Object.keys(modifiedCells).length, [modifiedCells]);

  // 职位搜索过滤后的行数据
  const filteredRows = useMemo(() => {
    if (!positionSearchKeyword.trim()) return matrixData.rows;
    const keyword = positionSearchKeyword.toLowerCase();
    return matrixData.rows.filter(
      (row) =>
        row.positionName.toLowerCase().includes(keyword) ||
        row.departmentName.toLowerCase().includes(keyword)
    );
  }, [matrixData.rows, positionSearchKeyword]);

  // 汇总统计
  const summaryStats = useMemo(() => {
    let totalQuota = 0;
    let totalOccupied = 0;
    matrixData.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (cell.status !== 'empty') {
          totalQuota += cell.quota;
          totalOccupied += cell.occupied;
        }
      });
    });
    const totalRemaining = totalQuota - totalOccupied;
    const occupancyRate = totalQuota > 0 ? Math.round((totalOccupied / totalQuota) * 100) : 0;
    return { totalQuota, totalOccupied, totalRemaining, occupancyRate };
  }, [matrixData.rows]);

  const yearOptions = useMemo(
    () => Array.from({ length: YEAR_RANGE }, (_, i) => currentYear - 5 + i),
    [currentYear]
  );

  const selectedDepartmentName = useMemo(
    () => (selectedDepartmentId ? getDepartmentFullPath(selectedDepartmentId) : undefined),
    [selectedDepartmentId]
  );

  const batchPreviews = useMemo(() => {
    return Object.entries(modifiedCells).map(([key, newValue]) => {
      const [rowIdx, cellIdx] = key.split('-').map(Number);
      const row = matrixData.rows[rowIdx];
      const cell = row?.cells[cellIdx];
      return {
        row,
        cellIndex: cellIdx,
        monthLabel: matrixData.headers[cellIdx] || '',
        oldValue: cell?.quota || 0,
        newValue,
        establishmentId: cell?.establishmentId,
      };
    }).filter((p) => p.row && p.establishmentId) as BatchPreview[];
  }, [modifiedCells, matrixData]);

  // 分析批量选择的状态（用于决定显示哪些操作按钮）
  const batchSelectionInfo = useMemo(() => {
    if (selectedEstablishmentIds.size === 0) {
      return { hasLocked: false, hasUnlocked: false, hasLocking: false, total: 0 };
    }

    let hasLocked = false;
    let hasUnlocked = false;
    let hasLocking = false;

    selectedEstablishmentIds.forEach((id) => {
      // 在 matrixData 中查找对应的单元格
      for (const row of matrixData.rows) {
        for (const cell of row.cells) {
          if (cell.establishmentId === id) {
            if (cell.lockStatus === 'locked') hasLocked = true;
            else if (cell.lockStatus === 'locking') hasLocking = true;
            else hasUnlocked = true;
            break;
          }
        }
      }
    });

    return { hasLocked, hasUnlocked, hasLocking, total: selectedEstablishmentIds.size };
  }, [selectedEstablishmentIds, matrixData]);

  // ==================== 数据加载 ====================

  const loadMatrix = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getEstablishmentMatrix(currentYear, selectedDepartmentId);
      if (res.code === 0 && res.data) {
        setMatrixData(res.data);
      }
    } catch (error) {
      console.error('加载编制矩阵失败', error);
    } finally {
      setLoading(false);
    }
  }, [currentYear, selectedDepartmentId]);

  // 初始化加载
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      const treeRes = await getDepartmentTree();
      if (treeRes.code === 0 && treeRes.data && treeRes.data.length > 0) {
        const rootNode = treeRes.data[0];
        setDepartmentTree(treeRes.data);
        setSelectedDepartmentId(rootNode.id);
      }
      setLoading(false);
    };
    loadData();
  }, []);

  // 加载矩阵数据
  useEffect(() => {
    if (selectedDepartmentId) {
      loadMatrix();
    }
  }, [selectedDepartmentId, loadMatrix]);

  // V1.4 切换部门时关闭编制详情 Drawer + 重置按职位历史 state
  useEffect(() => {
    setEstablishmentDetailVisible(false);
    setEstablishmentDetailRow(null);
    setHistoryByPositionVisible(false);
    setHistoryByPositionData(null);
  }, [selectedDepartmentId]);

  // ==================== 事件处理 ====================

  const handleSearch = useCallback((keyword: string) => {
    setSearchKeyword(keyword);
    if (!keyword.trim()) {
      setAutoExpandAll(false);
      setHighlightNodeIds(new Set());
    } else {
      setAutoExpandAll(true);
      setHighlightNodeIds(new Set());
    }
  }, []);

  const handleSelectDepartment = useCallback((node: DepartmentTreeNode) => {
    setSelectedDepartmentId(node.id);
  }, []);

  const handleEdit = useCallback(
    (cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => {
      // 如果正在选择单元格模式（用于锁定），打开锁定申请弹窗
      if (selectingCellForLock) {
        setSelectingCellForLock(false);
        setLockCell({
          establishmentId: cell.establishmentId,
          departmentName: row.departmentName,
          positionName: row.positionName,
          monthLabel,
          quota: cell.quota,
          occupied: cell.occupied,
          remaining: cell.remaining,
        });
        setLockModalOpen(true);
        return;
      }

      // 如果单元格已被锁定，显示解锁申请弹窗
      if (cell.lockStatus === 'locked') {
        setUnlockCell({
          establishmentId: cell.establishmentId,
          departmentName: row.departmentName,
          positionName: row.positionName,
          monthLabel,
          quota: cell.quota,
          occupied: cell.occupied,
          remaining: cell.remaining,
          lockReason: cell.lockReason,
          lockExpiredAt: cell.lockExpiredAt,
        });
        setUnlockModalOpen(true);
        return;
      }

      // 如果单元格锁定中，提示锁定申请审批中
      if (cell.lockStatus === 'locking') {
        addToast('该编制的锁定申请正在审批中，请等待审批结果', 'info');
        return;
      }

      setApplyCell({
        establishmentId: cell.establishmentId,
        departmentName: row.departmentName,
        positionName: row.positionName,
        monthLabel,
        quota: cell.quota,
        occupied: cell.occupied,
        remaining: cell.remaining,
      });
      setApplyModalMode('edit');
      setApplyModalOpen(true);
    },
    [addToast, selectingCellForLock]
  );

  const handleCreate = useCallback(
    (_cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => {
      setApplyCell({
        departmentId: row.departmentId,
        departmentName: row.departmentName,
        positionId: row.positionId,
        positionName: row.positionName,
        monthLabel,
        quota: 0,
        occupied: 0,
        remaining: 0,
      });
      setApplyModalMode('create');
      setApplyModalOpen(true);
    },
    []
  );

  const handleViewHistory = useCallback(
    (cell: EstablishmentMatrixCell, row: EstablishmentMatrixRow) => {
      setSelectedEstablishmentId(cell.establishmentId);
      setSelectedEstablishmentInfo({
        departmentName: row.departmentName,
        positionName: row.positionName,
      });
      setHistoryPanelVisible(true);
    },
    []
  );

  const handleRowClick = useCallback(
    (row: EstablishmentMatrixRow) => {
      // V1.4 改造：点击职位行 → 打开编制详情 Drawer（不再打开历史弹窗）
      setEstablishmentDetailRow(row);
      setEstablishmentDetailVisible(true);
    },
    []
  );

  /**
   * V1.4 新增：编制详情 Drawer 内"查看全部"按钮回调
   * 跳转到 EstablishmentHistoryModal（mode='byPosition'）展示该职位全量历史
   */
  const handleViewAllHistory = useCallback(
    (
      departmentId: string,
      positionId: string,
      year: number,
      departmentName: string,
      positionName: string,
    ) => {
      setHistoryByPositionData({
        departmentId,
        positionId,
        year,
        departmentName,
        positionName,
      });
      setHistoryByPositionVisible(true);
    },
    [],
  );

  /**
   * V1.4 续约申请触发：Drawer 块 B 的【续约】按钮回调
   */
  const handleExtendClick = useCallback(
    (params: {
      establishmentId: string;
      currentEndDate: string;
      currentStartDate: string;
      quota: number;
      occupied: number;
      month: number;
      departmentName: string;
      positionName: string;
    }) => {
      setExtendContext(params);
      setExtendModalOpen(true);
    },
    [],
  );

  /**
   * V1.4 续约申请提交成功：刷新矩阵 + Drawer 自动通过 re-render 重新拉历史
   * 注：service 端只生成 pending 历史，endDate 不会改变，所以 matrix 无需 reload，
   * 但 Drawer 块 C 的"近 5 条"会因为历史新增而自动多一条
   */
  const handleExtendSuccess = useCallback(() => {
    setExtendModalOpen(false);
    setExtendContext(null);
    // 主动刷新 matrix 以保证其他模块（如矩阵 tooltip）能立即看到 pending 历史
    loadMatrix();
  }, [loadMatrix]);

  const handleApplySuccess = useCallback(() => {
    setApplyModalOpen(false);
    setApplyCell(null);
    loadMatrix();
  }, [loadMatrix]);

  const handleOpenCreate = useCallback(() => {
    setCreateModalOpen(true);
  }, []);

  const handleOpenBatchAdjust = useCallback(() => {
    setBatchEditMode(true);
    setModifiedCells({});
  }, []);

  const handleCancelBatchEdit = useCallback(() => {
    setBatchEditMode(false);
    setModifiedCells({});
  }, []);

  // 批量选择单元格
  const handleCellSelect = useCallback((cell: EstablishmentMatrixCell) => {
    if (!cell.establishmentId) return;
    setSelectedEstablishmentIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(cell.establishmentId!)) {
        newSet.delete(cell.establishmentId!);
      } else {
        newSet.add(cell.establishmentId!);
      }
      return newSet;
    });
  }, []);

  // 全选所有可选择的单元格
  const handleSelectAll = useCallback(() => {
    const allSelectableIds = new Set<string>();
    matrixData.rows.forEach((row) => {
      row.cells.forEach((cell) => {
        if (
          cell.establishmentId &&
          cell.status !== 'empty' &&
          cell.lockStatus !== 'locked' &&
          cell.lockStatus !== 'locking'
        ) {
          allSelectableIds.add(cell.establishmentId);
        }
      });
    });
    setSelectedEstablishmentIds(allSelectableIds);
  }, [matrixData.rows]);

  const handleCellValueChange = useCallback(
    (rowIndex: number, cellIndex: number, newValue: number) => {
      const key = `${rowIndex}-${cellIndex}`;
      setModifiedCells((prev) => ({ ...prev, [key]: newValue }));
    },
    []
  );

  const handleSubmitBatchAdjust = useCallback(() => {
    if (modifiedCellsCount === 0) {
      addToast('请先修改单元格的值', 'error');
      return;
    }
    setBatchPreviewOpen(true);
  }, [modifiedCellsCount, addToast]);

  const handleConfirmBatchAdjust = useCallback(async () => {
    setBatchPreviewLoading(true);
    let successCount = 0;
    let failCount = 0;
    try {
      for (const preview of batchPreviews) {
        const res = await applyEstablishmentChange(
          preview.establishmentId,
          preview.newValue,
          'business_expansion',
          `批量调整：${preview.oldValue} → ${preview.newValue}`
        );
        if (res.code === 0) {
          successCount++;
        } else {
          failCount++;
        }
      }
      if (failCount === 0) {
        addToast(`批量调整申请已提交，等待审批（${successCount}项）`, 'success');
      } else {
        addToast(`提交完成：成功${successCount}项，失败${failCount}项`, 'info');
      }
      setBatchPreviewOpen(false);
      setBatchEditMode(false);
      setModifiedCells({});
    } finally {
      setBatchPreviewLoading(false);
    }
  }, [batchPreviews, addToast]);

  const handleBatchImport = useCallback(async (data: any[]) => {
    // 将 CSV 数据转换为 API 需要的格式
    // CSV 列: 部门, 职位, 年份, 月份, 编制名额, 调整原因, 调整说明, 编制类型, 起效日期, 失效日期
    const processedData = data
      .map((item, rowNum) => {
        // 部门名称转 ID（这里简化处理，实际应通过部门服务查找）
        const deptName = item['部门'];
        const posName = item['职位'];
        const year = parseInt(item['年份'], 10);
        const month = parseInt(item['月份'], 10);
        const quota = parseInt(item['编制名额'], 10);
        const reason = (item['调整原因'] as 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other') || 'business_expansion';
        const remark = item['调整说明'];

        // V1.3 扩展：解析编制类型与起止日期
        const typeRaw = (item['编制类型'] || '正式编制').trim();
        const type: 'formal' | 'temp' = typeRaw === '临时编制' ? 'temp' : 'formal';
        const startDate = (item['起效日期'] || '').trim();
        const endDate = (item['失效日期'] || '').trim();

        // 简单校验
        if (!deptName || !posName || isNaN(year) || isNaN(month) || isNaN(quota)) {
          return null;
        }

        // 临时编制校验
        if (type === 'temp') {
          if (!startDate || !endDate) {
            return { _error: `第${rowNum}行：临时编制必须填写起效日期和失效日期` };
          }
          if (endDate < startDate) {
            return { _error: `第${rowNum}行：失效日期必须晚于起效日期` };
          }
        }

        return {
          departmentId: deptName, // 简化：实际需要根据名称查 ID
          positionId: posName,
          year,
          month,
          quota,
          reason,
          remark,
          type,
          startDate: type === 'temp' ? startDate : undefined,
          endDate: type === 'temp' ? endDate : undefined,
        };
      })
      .filter(Boolean)
      .filter((item): item is NonNullable<typeof item> => {
        // 过滤掉错误行
        return !(item as any)?._error;
      });

    // 由于 mock 数据中没有按名称查找 ID 的服务，暂时模拟导入
    // 实际生产环境需要先解析 departmentId 和 positionId
    const result = await batchCreateEstablishment(processedData as any[]);
    return result;
  }, []);

  const handleCreateSuccess = useCallback(() => {
    setCreateModalOpen(false);
    loadMatrix();
    addToast('创建申请已提交，等待审批', 'success');
  }, [loadMatrix, addToast]);

  return {
    // 状态
    currentYear,
    setCurrentYear,
    departmentTree,
    selectedDepartmentId,
    matrixData,
    loading,
    searchKeyword,
    autoExpandAll,
    highlightNodeIds,
    pendingApprovalCounts,
    applyModalOpen,
    setApplyModalOpen,
    applyModalMode,
    setApplyModalMode,
    applyCell,
    setApplyCell,
    historyPanelVisible,
    setHistoryPanelVisible,
    selectedEstablishmentId,
    setSelectedEstablishmentId,
    selectedEstablishmentInfo,
    setSelectedEstablishmentInfo,
    historyModalVisible,
    setHistoryModalVisible,
    historyModalData,
    setHistoryModalData,
    approvalRecordsModalVisible,
    setApprovalRecordsModalVisible,
    // V1.4 编制详情 Drawer
    establishmentDetailVisible,
    setEstablishmentDetailVisible,
    establishmentDetailRow,
    // V1.4 按职位维度历史
    historyByPositionVisible,
    setHistoryByPositionVisible,
    historyByPositionData,
    handleViewAllHistory,
    // V1.4 临时编制续约
    extendModalOpen,
    setExtendModalOpen,
    extendContext,
    setExtendContext,
    handleExtendClick,
    handleExtendSuccess,
    unlockModalOpen,
    setUnlockModalOpen,
    unlockCell,
    setUnlockCell,
    lockModalOpen,
    setLockModalOpen,
    lockCell,
    setLockCell,
    selectingCellForLock,
    setSelectingCellForLock,
    batchSelectMode,
    setBatchSelectMode,
    selectedEstablishmentIds,
    setSelectedEstablishmentIds,
    batchLockModalOpen,
    setBatchLockModalOpen,
    batchLockModalMode,
    setBatchLockModalMode,
    batchModalOpen,
    setBatchModalOpen,
    batchModalType,
    setBatchModalType,
    createModalOpen,
    setCreateModalOpen,
    batchEditMode,
    modifiedCells,
    modifiedCellsCount,
    batchPreviewOpen,
    setBatchPreviewOpen,
    batchPreviewLoading,
    toasts,
    // 计算属性
    yearOptions,
    selectedDepartmentName,
    batchPreviews,
    batchSelectionInfo,
    filteredRows,
    summaryStats,
    // 搜索
    positionSearchKeyword,
    setPositionSearchKeyword,
    // 事件处理
    loadMatrix,
    handleSearch,
    handleSelectDepartment,
    handleEdit,
    handleCreate,
    handleViewHistory,
    handleRowClick,
    handleApplySuccess,
    handleOpenCreate,
    handleOpenBatchAdjust,
    handleCancelBatchEdit,
    handleCellSelect,
    handleSelectAll,
    handleCellValueChange,
    handleSubmitBatchAdjust,
    handleConfirmBatchAdjust,
    handleBatchImport,
    handleCreateSuccess,
    removeToast,
  };
};