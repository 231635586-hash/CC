import { useState, useEffect } from 'react';
import { Clock, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import {
  approveEstablishmentChange,
  rejectEstablishmentChange,
  getPendingEstablishmentHistories,
  getEstablishmentDetails,
} from '../services/api';

interface ApprovalItem {
  id: string;
  establishmentId: string;
  departmentName: string;
  positionName: string;
  monthLabel: string;
  oldQuota: number;
  newQuota: number;
  reason: string;
  remark?: string;
  applicantName: string;
  createdAt: string;
}

interface EstablishmentApprovalModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

// 原因映射
const REASON_MAP: Record<string, string> = {
  business_expansion: '业务扩张',
  business_contraction: '业务收缩',
  natural_turnover: '自然流动',
  other: '其他',
};

export const EstablishmentApprovalModal = ({
  open,
  onClose,
  onSuccess,
}: EstablishmentApprovalModalProps) => {
  const [loading, setLoading] = useState(false);
  const [approvalLoading, setApprovalLoading] = useState<string | null>(null);
  const [approvalList, setApprovalList] = useState<ApprovalItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // 加载待审批列表（从所有历史记录中筛选）
  useEffect(() => {
    if (open) {
      loadPendingApprovals();
    }
  }, [open]);

  const loadPendingApprovals = async () => {
    setLoading(true);
    try {
      const res = await getPendingEstablishmentHistories();
      if (res.code === 0 && res.data) {
        // 并行获取每个待审批记录的详情
        const itemsWithDetails = await Promise.all(
          res.data.map(async (h) => {
            const detailRes = await getEstablishmentDetails(h.establishmentId);
            const details = detailRes.data;

            return {
              id: h.id,
              establishmentId: h.establishmentId,
              departmentName: details?.departmentName || '未知部门',
              positionName: details?.positionName || '未知职位',
              monthLabel: details ? `${details.year}/${String(details.month).padStart(2, '0')}` : '',
              oldQuota: h.oldQuota,
              newQuota: h.newQuota,
              reason: h.reason,
              remark: h.remark,
              applicantName: h.applicantName,
              createdAt: h.createdAt,
            };
          })
        );
        setApprovalList(itemsWithDetails);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.size === approvalList.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(approvalList.map((item) => item.id)));
    }
  };

  const handleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleApprove = async (id: string) => {
    setApprovalLoading(id);
    try {
      const res = await approveEstablishmentChange(id);
      if (res.code === 0) {
        setApprovalList((prev) => prev.filter((item) => item.id !== id));
        selectedIds.delete(id);
        setSelectedIds(new Set(selectedIds));
        onSuccess?.();
      } else {
        showToast(res.message || '操作失败', 'error');
      }
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setApprovalLoading(id);
    try {
      const res = await rejectEstablishmentChange(id);
      if (res.code === 0) {
        setApprovalList((prev) => prev.filter((item) => item.id !== id));
        selectedIds.delete(id);
        setSelectedIds(new Set(selectedIds));
        onSuccess?.();
      } else {
        showToast(res.message || '操作失败', 'error');
      }
    } finally {
      setApprovalLoading(null);
    }
  };

  const handleBatchApprove = async () => {
    if (selectedIds.size === 0) {
      showToast('请先选择要审批的记录', 'info');
      return;
    }

    for (const id of selectedIds) {
      await handleApprove(id);
    }
  };

  const handleBatchReject = async () => {
    if (selectedIds.size === 0) {
      showToast('请先选择要驳回的记录', 'info');
      return;
    }

    for (const id of selectedIds) {
      await handleReject(id);
    }
  };

  const formatDate = (dateStr: string) => {
    return dateStr;
  };

  return (
    <Modal open={open} title="待我审批" onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* 批量操作栏 */}
        {approvalList.length > 0 && (
          <div className="flex items-center justify-between p-4 bg-[var(--color-surface-bg)] rounded-lg">
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedIds.size === approvalList.length && approvalList.length > 0}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-[var(--color-border)]"
                />
                <span className="text-sm">全选</span>
              </label>
              <span className="text-sm text-[var(--color-text-secondary)]">
                已选择 {selectedIds.size} 项
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={handleBatchReject}
                disabled={selectedIds.size === 0}
              >
                批量驳回
              </Button>
              <Button
                size="sm"
                onClick={handleBatchApprove}
                disabled={selectedIds.size === 0}
              >
                批量通过
              </Button>
            </div>
          </div>
        )}

        {/* 审批列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-text-secondary)]">
            加载中...
          </div>
        ) : approvalList.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[var(--color-text-secondary)]">
            暂无待审批记录
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {approvalList.map((item) => (
              <div
                key={item.id}
                className={cn(
                  'p-4 rounded-lg border',
                  selectedIds.has(item.id)
                    ? 'border-[var(--color-brand)] bg-[var(--color-brand-bg)]'
                    : 'border-[var(--color-border)] bg-white'
                )}
              >
                <div className="flex items-start gap-4">
                  {/* 选择框 */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(item.id)}
                    onChange={() => handleSelect(item.id)}
                    className="mt-1 w-4 h-4 rounded border-[var(--color-border)]"
                  />

                  {/* 内容 */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="font-medium text-[var(--color-text-primary)]">
                          {item.departmentName} / {item.positionName}
                        </span>
                        <span className="ml-2 text-sm text-[var(--color-text-secondary)]">
                          {item.monthLabel}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                        <Clock className="w-3 h-3" />
                        待审批
                      </div>
                    </div>

                    {/* 变更信息 */}
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-lg font-semibold">{item.oldQuota}</span>
                      <ArrowRight className="w-4 h-4 text-[var(--color-text-secondary)]" />
                      <span className="text-lg font-semibold text-[var(--color-brand)]">{item.newQuota}</span>
                      <span className="text-sm text-[var(--color-text-secondary)]">名额</span>
                    </div>

                    {/* 原因和说明 */}
                    <div className="text-sm mb-2">
                      <span className="text-[var(--color-text-secondary)]">原因：</span>
                      <span>{REASON_MAP[item.reason] || item.reason}</span>
                      {item.remark && (
                        <>
                          <span className="text-[var(--color-text-secondary)] ml-2">说明：</span>
                          <span>{item.remark}</span>
                        </>
                      )}
                    </div>

                    {/* 申请人和时间 */}
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                      <span>申请人：{item.applicantName}</span>
                      <span>申请时间：{formatDate(item.createdAt)}</span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex flex-col gap-2">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handleReject(item.id)}
                      loading={approvalLoading === item.id}
                    >
                      驳回
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => handleApprove(item.id)}
                      loading={approvalLoading === item.id}
                    >
                      通过
                    </Button>
                  </div>
                </div>
              </div>
            ))}
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