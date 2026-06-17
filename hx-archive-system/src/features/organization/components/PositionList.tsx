import { Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { Position } from '../types';

interface PositionListProps {
  positions: Position[];
  onEdit?: (position: Position) => void;
  onDelete?: (position: Position) => void;
  onAddPosition?: () => void;
  onViewEmployees?: (position: Position) => void;
  sortField?: 'name' | 'employeeCount';
  sortOrder?: 'asc' | 'desc';
  onSort?: (field: 'name' | 'employeeCount') => void;
}

export const PositionList = ({
  positions,
  onEdit,
  onDelete,
  onAddPosition,
  onViewEmployees,
  sortField,
  sortOrder,
  onSort,
}: PositionListProps) => {
  // 判断是否为同步数据（不允许删除）
  const isSyncedPosition = (positionId: string): boolean => {
    const syncedIds = ['pos-001', 'pos-002', 'pos-003', 'pos-004', 'pos-005', 'pos-006'];
    return syncedIds.includes(positionId);
  };

  const handleSort = (field: 'name' | 'employeeCount') => {
    onSort?.(field);
  };

  const renderSortIcon = (field: 'name' | 'employeeCount') => {
    if (sortField !== field) return null;
    return (
      <span className="ml-1 text-[var(--color-brand)]">
        {sortOrder === 'asc' ? '↑' : '↓'}
      </span>
    );
  };

  if (positions.length === 0) {
    return (
      <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-8">
        <div className="text-center text-[var(--color-text-secondary)]">
          <div className="mb-2">暂无职位数据</div>
          {onAddPosition && (
            <Button variant="secondary" size="sm" onClick={onAddPosition}>
              新增职位
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] overflow-hidden">
      {/* 表头 */}
      <div className="flex items-center h-11 px-4 bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
        <div className="flex-1 text-sm font-medium text-[var(--color-text-secondary)]">
          职位名称
        </div>
        <div className="flex-1 text-sm font-medium text-[var(--color-text-secondary)]">
          职位说明
        </div>
        <div
          className="w-[100px] text-sm font-medium text-[var(--color-text-secondary)] text-center cursor-pointer hover:text-[var(--color-text-primary)]"
          onClick={() => handleSort('employeeCount')}
        >
          在职员工
          {renderSortIcon('employeeCount')}
        </div>
        <div className="w-[120px] text-sm font-medium text-[var(--color-text-secondary)] text-right">操作</div>
      </div>

      {/* 数据行 */}
      {positions.map((position) => {
        const synced = isSyncedPosition(position.id);
        const employeeCount = position.employeeCount ?? 0;

        return (
          <div
            key={position.id}
            className="flex items-center h-11 px-4 hover:bg-[var(--color-surface-bg)] group border-b border-[var(--color-border)] last:border-b-0"
          >
            <div className="flex-1 text-sm text-[var(--color-text-primary)]">{position.name}</div>
            <div className="flex-1 text-sm text-[var(--color-text-secondary)] truncate pr-4" title={position.description}>
              {position.description || '-'}
            </div>
            <div className="w-[100px] flex items-center justify-center">
              {employeeCount > 0 ? (
                <button
                  onClick={() => onViewEmployees?.(position)}
                  className="flex items-center gap-1 px-2 py-1 rounded hover:bg-[var(--color-brand-bg)] transition-colors"
                >
                  <Users className="w-3.5 h-3.5 text-[var(--color-brand)]" />
                  <span className="text-sm text-[var(--color-brand)] font-medium">{employeeCount}</span>
                </button>
              ) : (
                <span className="text-sm text-[var(--color-text-disabled)]">暂无</span>
              )}
            </div>
            <div className="w-[120px] flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 px-2 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]"
                onClick={() => onEdit?.(position)}
              >
                <Pencil className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'h-7 px-2',
                  synced
                    ? 'text-[var(--color-text-disabled)] cursor-not-allowed'
                    : 'text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]'
                )}
                onClick={() => {
                  if (!synced) onDelete?.(position);
                }}
                disabled={synced}
                title={synced ? '同步数据不允许删除' : '删除'}
              >
                <Trash2 className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
};