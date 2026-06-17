import { memo, useState, useCallback } from 'react';
import { Plus, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  EstablishmentMatrixRow,
  EstablishmentMatrixCell,
} from '../types';

interface EstablishmentMatrixProps {
  headers: string[];
  rows: EstablishmentMatrixRow[];
  batchEditMode?: boolean;
  modifiedCells?: Record<string, number>;
  onEdit?: (cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => void;
  onCreate?: (cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => void;
  onViewHistory?: (cell: EstablishmentMatrixCell, row: EstablishmentMatrixRow) => void;
  onRowClick?: (row: EstablishmentMatrixRow) => void;
  onCellChange?: (rowIndex: number, cellIndex: number, newValue: number) => void;
  // 批量选择相关
  batchSelectMode?: boolean;
  selectedCellIds?: Set<string>;
  onCellSelect?: (cell: EstablishmentMatrixCell) => void;
}

// 状态颜色映射
const STATUS_COLORS = {
  normal: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)] border-[var(--color-status-success)]',
  warning: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border-[var(--color-status-warning)]',
  danger: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] border-[var(--color-status-danger)]',
  empty: 'bg-[var(--color-surface-bg)] border-dashed border-[var(--color-border)] text-[var(--color-text-disabled)]',
  locking: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)] border-[var(--color-status-warning)] border-dashed',
  locked: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)] border-[var(--color-status-danger)]',
};

// 状态文本
const STATUS_TEXT = {
  normal: '充足',
  warning: '紧张',
  danger: '满编',
  empty: '无数据',
  locking: '锁定中',
  locked: '已锁定',
};

// 单元格组件
const MatrixCell = memo(({
  cell,
  monthLabel,
  row,
  rowIndex,
  cellIndex,
  batchEditMode,
  modifiedValue,
  onEdit,
  onCreate,
  onViewHistory,
  onCellChange,
  batchSelectMode,
  selectedCellIds,
  onCellSelect,
}: {
  cell: EstablishmentMatrixCell;
  monthLabel: string;
  row: EstablishmentMatrixRow;
  rowIndex: number;
  cellIndex: number;
  batchEditMode?: boolean;
  modifiedValue?: number;
  onEdit?: (cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => void;
  onCreate?: (cell: EstablishmentMatrixCell, monthLabel: string, row: EstablishmentMatrixRow) => void;
  onViewHistory?: (cell: EstablishmentMatrixCell, row: EstablishmentMatrixRow) => void;
  onCellChange?: (rowIndex: number, cellIndex: number, newValue: number) => void;
  batchSelectMode?: boolean;
  selectedCellIds?: Set<string>;
  onCellSelect?: (cell: EstablishmentMatrixCell) => void;
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [editValue, setEditValue] = useState(cell.quota);
  const isEmpty = cell.status === 'empty';
  const isModified = modifiedValue !== undefined;
  const displayValue = isModified ? modifiedValue : cell.quota;
  const valueChanged = isModified && modifiedValue !== cell.quota;

  // 锁定状态：锁定中和已锁定的单元格不可选择
  const isLockedOrLocking = cell.lockStatus === 'locked' || cell.lockStatus === 'locking';
  // 是否可选（批量选择模式下：非空、非锁定状态才可选）
  const isSelectable = batchSelectMode && !isEmpty && !isLockedOrLocking;
  // 是否已选中
  const isSelected = selectedCellIds?.has(cell.establishmentId) || false;

  const handleDoubleClick = () => {
    if (batchEditMode || batchSelectMode) return;
    if (isEmpty) {
      onCreate?.(cell, monthLabel, row);
    } else {
      onEdit?.(cell, monthLabel, row);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    if (batchEditMode || batchSelectMode) return;
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleCloseContextMenu = useCallback(() => {
    setContextMenu(null);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = Number(e.target.value);
    setEditValue(value);
    onCellChange?.(rowIndex, cellIndex, value);
  };

  const handleInputBlur = () => {
    // 值已通过 onCellChange 保存
  };

  const handleInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      (e.target as HTMLInputElement).blur();
    }
  };

  const handleViewHistory = () => {
    onViewHistory?.(cell, row);
    handleCloseContextMenu();
  };

  const handleCreateNew = () => {
    onCreate?.(cell, monthLabel, row);
    handleCloseContextMenu();
  };

  // 批量选择模式下的点击处理
  const handleCellClick = () => {
    if (batchSelectMode && isSelectable && cell.establishmentId) {
      onCellSelect?.(cell);
    }
  };

  return (
    <>
      <div
        className={cn(
          'px-2 py-2 text-center transition-colors relative',
          'border-r border-[var(--color-border)] last:border-r-0',
          // 批量选择模式样式
          batchSelectMode && isSelectable && !isSelected && 'hover:ring-2 hover:ring-[var(--color-brand)] hover:ring-inset cursor-pointer',
          batchSelectMode && isSelected && 'ring-2 ring-[var(--color-brand)] bg-[var(--color-brand-bg)]',
          batchSelectMode && !isSelectable && 'cursor-not-allowed opacity-50',
          // 非批量选择模式样式
          !batchSelectMode && !batchEditMode && !isLockedOrLocking && 'hover:ring-2 hover:ring-[var(--color-brand)] hover:ring-inset cursor-pointer',
          !batchSelectMode && !batchEditMode && isLockedOrLocking && 'cursor-not-allowed',
          // 批量编辑模式样式
          batchEditMode && 'cursor-pointer',
          isModified && valueChanged
            ? 'bg-[var(--color-status-warning-bg)] ring-2 ring-[var(--color-status-warning)] border-[var(--color-status-warning)] border-dashed'
            : !batchSelectMode && !isSelected && STATUS_COLORS[cell.status]
        )}
        onClick={handleCellClick}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        title={isEmpty ? "双击创建新编制，右键查看更多选项" : cell.lockStatus === 'locked' ? "双击申请解锁，右键查看更多选项" : cell.lockStatus === 'locking' ? "锁定申请审批中，请等待" : "双击发起编制调整申请，右键查看调整历史"}
      >
        {/* 修改指示器 */}
        {isModified && valueChanged && (
          <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[var(--color-status-warning)] rounded-full animate-pulse" />
        )}
        {/* 选中指示器 */}
        {batchSelectMode && isSelected && (
          <span className="absolute top-0.5 left-0.5 w-2 h-2 bg-[var(--color-brand)] rounded-full" />
        )}
        {batchEditMode ? (
          // 批量编辑模式：显示输入框
          <input
            type="number"
            min={0}
            value={editValue}
            onChange={handleInputChange}
            onBlur={handleInputBlur}
            onKeyDown={handleInputKeyDown}
            className="w-full h-8 px-1 text-sm text-center border border-[var(--color-border)] rounded bg-white focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)]"
          />
        ) : isEmpty ? (
          // 普通模式 + 空数据：显示 + 和 hover 提示，点击直接创建
          <div
            className="flex flex-col items-center justify-center cursor-pointer"
            onClick={() => {
              if (!batchEditMode) {
                onCreate?.(cell, monthLabel, row);
              }
            }}
          >
            <Plus className="w-4 h-4 opacity-50" />
            <span className="text-[10px] opacity-0 group-hover:opacity-50 transition-opacity mt-0.5">
              点击创建
            </span>
          </div>
        ) : (
          // 普通模式 + 有数据
          <>
            <div className="text-sm font-medium flex items-center justify-center gap-1">
              {(cell.status === 'locking' || cell.status === 'locked') && (
                <Lock className="w-3 h-3" />
              )}
              {displayValue}/{cell.occupied}
            </div>
            <div className="text-xs opacity-75">{STATUS_TEXT[cell.status]}</div>
          </>
        )}
      </div>

      {/* 右键菜单 */}
      {contextMenu && (
        <>
          <div
            className="fixed inset-0 z-50"
            onClick={handleCloseContextMenu}
          />
          <div
            className="fixed z-50 bg-white border border-[var(--color-border)] rounded-lg shadow-lg py-1 min-w-[140px] animate-scale-in"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            {isEmpty ? (
              <button
                className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                onClick={handleCreateNew}
              >
                创建新编制
              </button>
            ) : cell.lockStatus === 'locked' ? (
              <>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                  onClick={handleViewHistory}
                >
                  查看调整历史
                </button>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                  onClick={() => {
                    handleDoubleClick();
                    handleCloseContextMenu();
                  }}
                >
                  申请解锁
                </button>
              </>
            ) : cell.lockStatus === 'locking' ? (
              <button
                className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                onClick={handleViewHistory}
              >
                查看调整历史
              </button>
            ) : (
              <>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                  onClick={handleViewHistory}
                >
                  查看调整历史
                </button>
                <button
                  className="w-full px-4 py-2 text-sm text-left hover:bg-[var(--color-surface-bg)]"
                  onClick={() => {
                    handleDoubleClick();
                    handleCloseContextMenu();
                  }}
                >
                  发起调整申请
                </button>
              </>
            )}
          </div>
        </>
      )}
    </>
  );
});

export const EstablishmentMatrix = ({
  headers,
  rows,
  batchEditMode,
  modifiedCells = {},
  onEdit,
  onCreate,
  onViewHistory,
  onRowClick,
  onCellChange,
  batchSelectMode,
  selectedCellIds,
  onCellSelect,
}: EstablishmentMatrixProps) => {
  if (rows.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-[var(--color-text-secondary)]">
        暂无编制数据
      </div>
    );
  }

  return (
    <div className="overflow-auto">
      <table className="w-full border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-[var(--color-surface-bg)]">
            <th
              className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-left border-b border-r border-[var(--color-border)] bg-[var(--color-surface-bg)]"
              style={{ minWidth: 150 }}
            >
              部门
            </th>
            <th
              className="sticky left-0 z-10 px-4 py-3 text-sm font-medium text-left border-b border-r border-[var(--color-border)] bg-[var(--color-surface-bg)]"
              style={{ minWidth: 150 }}
            >
              职位
            </th>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="px-2 py-3 text-sm font-medium text-center border-b border-r border-[var(--color-border)] min-w-[80px]"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr className="group">
              {/* 部门列 */}
              <td className="sticky left-0 z-10 px-4 py-3 text-sm border-b border-r border-[var(--color-border)] bg-white group-hover:bg-[var(--color-surface-bg)]">
                {row.departmentName}
              </td>
              {/* 职位列 */}
              <td
                className="sticky left-0 z-10 px-4 py-3 text-sm border-b border-r border-[var(--color-border)] bg-white group-hover:bg-[var(--color-surface-bg)] text-blue-600 cursor-pointer hover:text-blue-700"
                onClick={() => onRowClick?.(row)}
              >
                {row.positionName}
              </td>
              {/* 时间维度单元格 */}
              {row.cells.map((cell, cellIdx) => (
                <td
                  key={`${rowIdx}-${cellIdx}`}
                  className="p-0 border-b border-r border-[var(--color-border)]"
                >
                  <MatrixCell
                    cell={cell}
                    monthLabel={headers[cellIdx]}
                    row={row}
                    rowIndex={rowIdx}
                    cellIndex={cellIdx}
                    batchEditMode={batchEditMode}
                    modifiedValue={modifiedCells[`${rowIdx}-${cellIdx}`]}
                    onEdit={onEdit}
                    onCreate={onCreate}
                    onViewHistory={onViewHistory}
                    onCellChange={onCellChange}
                    batchSelectMode={batchSelectMode}
                    selectedCellIds={selectedCellIds}
                    onCellSelect={onCellSelect}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};