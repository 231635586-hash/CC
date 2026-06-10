import { cn } from '@/lib/utils';

interface InfoItem {
  label: string;
  value: React.ReactNode;
  span?: number;
}

interface InfoGridProps {
  items: InfoItem[];
  columns?: number;
  className?: string;
}

export function InfoGrid({ items, columns = 3, className }: InfoGridProps) {
  return (
    <div
      className={cn(
        'grid gap-x-8 gap-y-4',
        className
      )}
      style={{
        gridTemplateColumns: `repeat(${columns},1fr)`,
      }}
    >
      {items.map((item, index) => (
        <div
          key={index}
          className={cn(
            'flex flex-col',
            item.span && item.span > 1 ? `col-span-${item.span}` : ''
          )}
        >
          <dt className="text-sm text-text-secondary mb-1">{item.label}</dt>
          <dd className="text-sm font-medium text-text-primary">
            {item.value || '-'}
          </dd>
        </div>
      ))}
    </div>
  );
}