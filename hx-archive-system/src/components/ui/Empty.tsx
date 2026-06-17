import { cn } from '@/lib/utils';
import { InboxIcon } from 'lucide-react';

interface EmptyProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export function Empty({
  title = '暂无数据',
  description,
  actionLabel,
  onAction,
  className,
}: EmptyProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-12 px-4',
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-surface-bg flex items-center justify-center mb-4">
        <InboxIcon className="w-8 h-8 text-text-disabled" />
      </div>
      <h3 className="text-base font-medium text-text-primary mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-text-secondary text-center">{description}</p>
      )}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="mt-4 px-4 py-2 text-sm bg-brand text-white rounded-md hover:bg-brand/90 transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}