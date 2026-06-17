import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { showToast } from '@/components/ui/Toast';
import type { EstablishmentHistory } from '../types';
import { getEstablishmentHistory, approveEstablishmentChange, rejectEstablishmentChange } from '../services/api';

interface EstablishmentHistoryPanelProps {
  visible: boolean;
  establishmentId: string;
  establishmentInfo?: {
    departmentName: string;
    positionName: string;
  };
  onClose?: () => void;
}

// 状态配置
const STATUS_CONFIG = {
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

// 原因映射
const REASON_MAP: Record<string, string> = {
  business_expansion: '业务扩张',
  business_contraction: '业务收缩',
  natural_turnover: '自然流动',
  other: '其他',
};

export const EstablishmentHistoryPanel = ({
  visible,
  establishmentId,
  establishmentInfo,
  onClose,
}: EstablishmentHistoryPanelProps) => {
  const [histories, setHistories] = useState<EstablishmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');

  // 加载历史记录
  useEffect(() => {
    if (visible && establishmentId) {
      loadHistory();
    }
  }, [visible, establishmentId]);

  const loadHistory = async () => {
    setLoading(true);
    try {
      const res = await getEstablishmentHistory(establishmentId);
      if (res.code === 0 && res.data) {
        // 按时间倒序排列
        setHistories(res.data.sort((a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        ));
      }
    } catch (error) {
      console.error('加载历史记录失败', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (historyId: string) => {
    if (!confirm('确定要通过该调整申请吗？')) return;

    setActionLoading(historyId);
    try {
      const res = await approveEstablishmentChange(historyId);
      if (res.code === 0) {
        await loadHistory();
      } else {
        showToast(res.message || '操作失败', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (historyId: string) => {
    if (!confirm('确定要驳回该调整申请吗？')) return;

    setActionLoading(historyId);
    try {
      const res = await rejectEstablishmentChange(historyId);
      if (res.code === 0) {
        await loadHistory();
      } else {
        showToast(res.message || '操作失败', 'error');
      }
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 过滤后的历史记录
  const filteredHistories = statusFilter === 'all'
    ? histories
    : histories.filter((h) => h.status === statusFilter);

  return (
    <Modal
      open={visible}
      title="编制调整历史"
      onClose={onClose || (() => {})}
      size="lg"
    >
      <div className="space-y-4">
        {/* 编制信息 */}
        {establishmentInfo && (
          <div className="px-4 py-3 bg-[var(--color-surface-bg)] rounded-lg text-sm">
            <div className="text-[var(--color-text-secondary)]">
              {establishmentInfo.departmentName} / {establishmentInfo.positionName}
            </div>
          </div>
        )}

        {/* 状态筛选 */}
        <div className="flex items-center gap-2">
          {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={cn(
                'px-3 py-1.5 text-sm rounded-full border transition-colors',
                statusFilter === status
                  ? 'bg-[var(--color-brand)] text-white border-[var(--color-brand)]'
                  : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border)] hover:bg-[var(--color-surface-bg)]'
              )}
            >
              {status === 'all' ? '全部' : STATUS_CONFIG[status].label}
              {status !== 'all' && (
                <span className="ml-1 text-xs opacity-75">
                  ({histories.filter((h) => h.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 加载状态 */}
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-text-secondary)]">
            加载中...
          </div>
        ) : filteredHistories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-text-secondary)]">
            暂无调整记录
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {filteredHistories.map((history) => {
              const config = STATUS_CONFIG[history.status];
              const StatusIcon = config.icon;

              return (
                <div
                  key={history.id}
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

                  {/* 待审批操作按钮 */}
                  {history.status === 'pending' && (
                    <div className="flex justify-end gap-2 mt-3 pt-3 border-t border-[var(--color-border)]">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReject(history.id)}
                        loading={actionLoading === history.id}
                      >
                        驳回
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleApprove(history.id)}
                        loading={actionLoading === history.id}
                      >
                        通过
                      </Button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* 关闭按钮 */}
        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
};