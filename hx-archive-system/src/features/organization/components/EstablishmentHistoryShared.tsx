import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import type { EstablishmentHistory } from '../types';

// ==================== 常量 ====================

export const STATUS_CONFIG = {
  pending: {
    label: '待审批',
    color: 'text-orange-600 bg-orange-50 border-orange-200',
    icon: Clock,
  },
  approved: {
    label: '已通过',
    color: 'text-green-600 bg-green-50 border-green-200',
    icon: CheckCircle,
  },
  rejected: {
    label: '已驳回',
    color: 'text-red-600 bg-red-50 border-red-200',
    icon: XCircle,
  },
};

export const REASON_MAP: Record<string, string> = {
  business_expansion: '业务扩张',
  business_contraction: '业务收缩',
  natural_turnover: '自然流动',
  other: '其他',
};

// ==================== 工具函数 ====================

export const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

// ==================== 历史记录项组件 ====================

interface HistoryItemProps {
  history: EstablishmentHistory;
  showActions?: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  actionLoading?: string | null;
}

export const EstablishmentHistoryItem = ({
  history,
  showActions = false,
  onApprove,
  onReject,
  actionLoading,
}: HistoryItemProps) => {
  const config = STATUS_CONFIG[history.status];
  const StatusIcon = config.icon;

  return (
    <div
      className={cn(
        'p-4 rounded-lg border',
        config.color.split(' ')[1],
        config.color.split(' ')[0]
      )}
    >
      {/* 头部信息 */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          <StatusIcon className="w-4 h-4" />
          <span className="font-medium">{config.label}</span>
        </div>
        <div className="text-xs text-[var(--color-text-secondary)]">
          {formatDate(history.createdAt)}
        </div>
      </div>

      {/* 变更信息 */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg font-semibold">{history.oldQuota}</span>
        <ArrowRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
        <span className="text-lg font-semibold text-[var(--color-brand)]">{history.newQuota}</span>
        <span className="text-sm text-[var(--color-text-secondary)]">名额</span>
      </div>

      {/* 原因 */}
      <div className="text-sm mb-2">
        <span className="text-[var(--color-text-secondary)]">调整原因：</span>
        <span>{REASON_MAP[history.reason] || history.reason}</span>
      </div>

      {/* 说明 */}
      {history.remark && (
        <div className="text-sm mb-3">
          <span className="text-[var(--color-text-secondary)]">调整说明：</span>
          <span>{history.remark}</span>
        </div>
      )}

      {/* 申请人和审批人 */}
      <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
        <span>申请人：{history.applicantName}</span>
        {history.approverName && (
          <span>审批人：{history.approverName}</span>
        )}
        {history.approvedAt && (
          <span>审批时间：{formatDate(history.approvedAt)}</span>
        )}
      </div>

      {/* 操作按钮 */}
      {showActions && history.status === 'pending' && (
        <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
          <button
            className="px-3 py-1.5 text-sm border border-[var(--color-border)] rounded-md hover:bg-[var(--color-surface-bg)]"
            onClick={() => onReject?.(history.id)}
            disabled={actionLoading === history.id}
          >
            驳回
          </button>
          <button
            className="px-3 py-1.5 text-sm bg-[var(--color-brand)] text-white rounded-md hover:opacity-90 disabled:opacity-50"
            onClick={() => onApprove?.(history.id)}
            disabled={actionLoading === history.id}
          >
            通过
          </button>
        </div>
      )}
    </div>
  );
};

// ==================== 状态 Badge 组件 ====================

interface StatusBadgeProps {
  status: 'pending' | 'approved' | 'rejected';
}

export const StatusBadge = ({ status }: StatusBadgeProps) => {
  const config = STATUS_CONFIG[status];
  return (
    <Badge variant="neutral" className={config.color}>
      <span className="flex items-center gap-1">
        {config.icon && <config.icon className="w-4 h-4" />}
        {config.label}
      </span>
    </Badge>
  );
};