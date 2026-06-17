import { Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { cn } from '@/lib/utils';
import type { Rank } from '../types';
import { RANK_TRACK_MAP, RANK_LEVEL_MAP } from '../types';

interface RankListProps {
  ranks: Rank[];
  onEdit?: (rank: Rank) => void;
  onDelete?: (rank: Rank) => void;
  onAddRank?: () => void;
}

export const RankList = ({
  ranks,
  onEdit,
  onDelete,
  onAddRank,
}: RankListProps) => {
  if (ranks.length === 0) {
    return (
      <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] p-8">
        <div className="text-center text-[var(--color-text-secondary)]">
          <div className="mb-2">暂无职级数据</div>
          {onAddRank && (
            <Button variant="secondary" size="sm" onClick={onAddRank}>
              新增职级
            </Button>
          )}
        </div>
      </div>
    );
  }

  // 渲染序列Badge
  const renderTrackBadge = (track: string) => {
    const colors: Record<string, string> = {
      admin: 'bg-[var(--color-brand-bg)] text-[var(--color-brand)]',
      tech: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]',
      factory: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]',
    };
    return (
      <Badge variant="neutral" className={colors[track] || ''}>
        {RANK_TRACK_MAP[track as keyof typeof RANK_TRACK_MAP] || track}
      </Badge>
    );
  };

  // 渲染职层Badge
  const renderLevelBadge = (level: string) => {
    const colors: Record<string, string> = {
      high: 'bg-purple-50 text-purple-700',
      middle: 'bg-yellow-50 text-yellow-700',
      low: 'bg-gray-50 text-gray-700',
    };
    return (
      <Badge variant="neutral" className={colors[level] || ''}>
        {RANK_LEVEL_MAP[level as keyof typeof RANK_LEVEL_MAP] || level}
      </Badge>
    );
  };

  // 每行独立显示，不合并分组（因同一代码可能属于不同序列）

  return (
    <div className="border border-[var(--color-border)] rounded-[var(--radius-lg)] bg-[var(--color-surface-card)] overflow-hidden">
      {/* 表头 */}
      <div className="flex items-center h-11 px-4 bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
        <div className="w-[80px] text-sm font-medium text-[var(--color-text-secondary)]">职级代码</div>
        <div className="w-[110px] text-sm font-medium text-[var(--color-text-secondary)]">职务划分</div>
        <div className="w-[80px] text-sm font-medium text-[var(--color-text-secondary)]">职层</div>
        <div className="flex-1 text-sm font-medium text-[var(--color-text-secondary)]">职务名称</div>
        <div className="w-[120px] text-sm font-medium text-[var(--color-text-secondary)] text-right">操作</div>
      </div>

      {/* 数据行 */}
      {ranks.map((rank, rowIndex) => (
        <div
          key={rank.id}
          className={cn(
            'flex items-center h-11 px-4 hover:bg-[var(--color-surface-bg)] group border-b border-[var(--color-border)]',
            rowIndex === ranks.length - 1 && 'border-b-0'
          )}
        >
          <div className="w-[80px] text-sm text-[var(--color-text-primary)] font-medium">
            {rank.code}
          </div>
          <div className="w-[110px]">
            {renderTrackBadge(rank.track)}
          </div>
          <div className="w-[80px]">
            {renderLevelBadge(rank.level)}
          </div>
          <div className="flex-1 text-sm text-[var(--color-text-secondary)] truncate pr-4" title={rank.name}>
            {rank.name}
          </div>
          <div className="w-[120px] flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[var(--color-text-secondary)] hover:text-[var(--color-brand)]"
              onClick={() => onEdit?.(rank)}
            >
              <Pencil className="w-3.5 h-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]"
              onClick={() => onDelete?.(rank)}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};