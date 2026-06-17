import { cn } from '@/lib/utils';
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react';

interface PaginationProps {
  current: number;
  pageSize: number;
  total: number;
  onChange: (page: number) => void;
  pageSizeOptions?: number[];
  onPageSizeChange?: (size: number) => void;
  className?: string;
}

export function Pagination({
  current,
  pageSize,
  total,
  onChange,
  pageSizeOptions,
  onPageSizeChange,
  className,
}: PaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  if (totalPages <= 1 && !pageSizeOptions?.length) return null;

  const getPages = () => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (current >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className={cn('flex items-center justify-between', className)}>
      <div className="flex items-center gap-2">
        <p className="text-sm text-text-secondary">
          共 {total} 条记录，第 {current}/{totalPages} 页
        </p>
        {pageSizeOptions && onPageSizeChange && (
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="px-2 py-1 border border-[var(--color-border)] rounded text-sm"
          >
            {pageSizeOptions.map((size) => (
              <option key={size} value={size}>
                {size}条/页
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="flex items-center gap-1">
        <button
          onClick={() => onChange(current - 1)}
          disabled={current === 1}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
            current === 1
              ? 'text-text-disabled cursor-not-allowed'
              : 'text-text-secondary hover:bg-surface-bg hover:text-text-primary'
          )}
        >
          <ChevronLeftIcon className="w-4 h-4" />
        </button>

        {getPages().map((page, index) =>
          page === '...' ? (
            <span key={`ellipsis-${index}`} className="w-8 h-8 flex items-center justify-center text-text-disabled">
              ...
            </span>
          ) : (
            <button
              key={page}
              onClick={() => onChange(page)}
              className={cn(
                'w-8 h-8 flex items-center justify-center text-sm rounded-md transition-colors',
                page === current
                  ? 'bg-brand text-white'
                  : 'text-text-secondary hover:bg-surface-bg hover:text-text-primary'
              )}
            >
              {page}
            </button>
          )
        )}

        <button
          onClick={() => onChange(current + 1)}
          disabled={current === totalPages}
          className={cn(
            'w-8 h-8 flex items-center justify-center rounded-md transition-colors',
            current === totalPages
              ? 'text-text-disabled cursor-not-allowed'
              : 'text-text-secondary hover:bg-surface-bg hover:text-text-primary'
          )}
        >
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}