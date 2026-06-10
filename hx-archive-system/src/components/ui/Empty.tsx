import { cn } from '@/lib/utils';
import { InboxIcon } from 'lucide-react';

interface EmptyProps {
  title?: string;
  description?: string;
  className?: string;
}

export function Empty({
  title = '暂无数据',
  description,
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
    </div>
  );
}