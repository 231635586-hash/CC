import { cn } from '@/lib/utils';

export interface Column<T> {
  key: string;
  title: string;
  width?: string | number;
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  rowKey: keyof T | ((row: T) => string);
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyText?: string;
  className?: string;
}

export function Table<T>({
  columns,
  data,
  rowKey,
  onRowClick,
  loading = false,
  emptyText = '暂无数据',
  className,
}: TableProps<T>) {
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  return (
    <div className={cn('overflow-auto', className)}>
      <table className="w-full">
        <thead>
          <tr className="bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
            {columns.map((col) => (
              <th
                key={col.key}
                className={cn(
                  'px-4 py-3 text-left text-[12px] font-medium text-[var(--color-text-secondary)] uppercase tracking-wide',
                  col.className
                )}
                style={{ width: col.width }}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, index) => (
              <tr key={`skeleton-${index}`} className="border-b border-[var(--color-border)]">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3">
                    <div className="h-4 bg-[var(--color-surface-bg)] rounded skeleton" />
                  </td>
                ))}
              </tr>
            ))
          ) : data.length === 0 ? (
            <tr>
              <td
                colSpan={columns.length}
                className="px-4 py-12 text-center text-[var(--color-text-disabled)]"
              >
                {emptyText}
              </td>
            </tr>
          ) : (
            data.map((row, index) => (
              <tr
                key={getRowKey(row)}
                className={cn(
                  'border-b border-[var(--color-border)] transition-colors duration-150',
                  onRowClick && 'cursor-pointer hover:bg-[var(--color-surface-bg)]'
                )}
                onClick={() => onRowClick?.(row)}
              >
                {columns.map((col) => (
                  <td
                    key={col.key}
                    className={cn('px-4 py-3 text-sm text-[var(--color-text-primary)]', col.className)}
                  >
                    {col.render
                      ? col.render(row, index)
                      : String((row as Record<string, unknown>)[col.key] ?? '-')}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}