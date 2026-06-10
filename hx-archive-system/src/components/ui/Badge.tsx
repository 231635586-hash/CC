import { cn } from '@/lib/utils';

type BadgeVariant = 'brand' | 'success' | 'warning' | 'danger' | 'neutral' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  brand: 'bg-[var(--color-brand-light)] text-[var(--color-brand)]',
  success: 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)]',
  warning: 'bg-[var(--color-status-warning-bg)] text-[var(--color-status-warning)]',
  danger: 'bg-[var(--color-status-danger-bg)] text-[var(--color-status-danger)]',
  neutral: 'bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)]',
  info: 'bg-[var(--color-status-info-bg)] text-[var(--color-status-info)]',
};

const sizeClasses: Record<BadgeSize, string> = {
  sm: 'px-1.5 py-px text-[11px]',
  md: 'px-2 py-0.5 text-xs',
};

export function Badge({
  children,
  variant = 'brand',
  size = 'md',
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full font-medium leading-none',
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </span>
  );
}

// StatusBadge - 专门用于状态展示的Badge
type StatusType = 'active' | 'archived' | 'paid' | 'unpaid' | 'passed' | 'rejected' | 'extended';

const statusConfig: Record<StatusType, { label: string; variant: BadgeVariant }> = {
  active: { label: '在职', variant: 'success' },
  archived: { label: '已封存', variant: 'neutral' },
  paid: { label: '已发放', variant: 'success' },
  unpaid: { label: '未发放', variant: 'warning' },
  passed: { label: '已通过', variant: 'success' },
  rejected: { label: '未通过', variant: 'danger' },
  extended: { label: '延期', variant: 'warning' },
};

interface StatusBadgeProps {
  status: StatusType;
  size?: BadgeSize;
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const config = statusConfig[status];
  return (
    <Badge variant={config.variant} size={size} className={className}>
      {config.label}
    </Badge>
  );
}