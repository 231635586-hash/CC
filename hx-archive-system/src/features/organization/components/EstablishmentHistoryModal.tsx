import { useState, useEffect, useMemo } from 'react';
import { Download, CheckCircle, XCircle, Clock, FileText } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Pagination } from '@/components/ui/Pagination';
import { Badge } from '@/components/ui/Badge';
import { showToast } from '@/components/ui/Toast';
import { getEstablishmentHistory } from '../services/api';
import type { EstablishmentHistory } from '../types';

interface EstablishmentHistoryModalProps {
  open: boolean;
  onClose: () => void;
  establishmentId?: string;
  departmentName?: string;
  positionName?: string;
}

type HistoryStatus = 'all' | 'pending' | 'approved' | 'rejected';
type HistoryReason = 'all' | 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other';
type DateRange = 'all' | '1month' | '3months' | '6months';

const STATUS_MAP: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  pending: { label: '待审批', icon: <Clock className="w-4 h-4 text-orange-500" />, color: 'bg-orange-50 text-orange-700' },
  approved: { label: '已通过', icon: <CheckCircle className="w-4 h-4 text-green-500" />, color: 'bg-green-50 text-green-700' },
  rejected: { label: '已驳回', icon: <XCircle className="w-4 h-4 text-red-500" />, color: 'bg-red-50 text-red-700' },
};

const REASON_MAP: Record<string, string> = {
  business_expansion: '业务扩张',
  business_contraction: '业务收缩',
  natural_turnover: '自然流动',
  other: '其他',
};

const PAGE_SIZE = 10;

export const EstablishmentHistoryModal = ({
  open,
  onClose,
  establishmentId,
  departmentName,
  positionName,
}: EstablishmentHistoryModalProps) => {
  const [histories, setHistories] = useState<EstablishmentHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<HistoryStatus>('all');
  const [reasonFilter, setReasonFilter] = useState<HistoryReason>('all');
  const [dateRange, setDateRange] = useState<DateRange>('all');

  // 加载历史记录
  useEffect(() => {
    if (open && establishmentId) {
      loadHistory();
    }
  }, [open, establishmentId]);

  const loadHistory = async () => {
    if (!establishmentId) return;
    setLoading(true);
    try {
      const res = await getEstablishmentHistory(establishmentId);
      if (res.code === 0 && res.data) {
        setHistories(res.data);
      }
    } finally {
      setLoading(false);
    }
  };

  // 计算日期范围
  const getDateRangeStart = () => {
    const now = new Date();
    switch (dateRange) {
      case '1month':
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      case '3months':
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      case '6months':
        return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      default:
        return null;
    }
  };

  // 筛选后的数据
  const filteredHistories = useMemo(() => {
    let result = [...histories];
    const startDate = getDateRangeStart();

    if (startDate) {
      result = result.filter((h) => new Date(h.createdAt) >= startDate);
    }

    if (statusFilter !== 'all') {
      result = result.filter((h) => h.status === statusFilter);
    }

    if (reasonFilter !== 'all') {
      result = result.filter((h) => h.reason === reasonFilter);
    }

    return result;
  }, [histories, statusFilter, reasonFilter, dateRange]);

  // 分页数据
  const paginatedHistories = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return filteredHistories.slice(start, start + PAGE_SIZE);
  }, [filteredHistories, currentPage]);

  // 重置页码
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, reasonFilter, dateRange]);

  // 导出
  const handleExport = () => {
    if (filteredHistories.length === 0) {
      showToast('暂无数据可导出', 'info');
      return;
    }

    const headers = ['申请时间', '申请人', '调整原因', '原名额', '新名额', '状态', '审批人', '审批时间'];
    const rows = filteredHistories.map((h) => [
      h.createdAt,
      h.applicantName,
      REASON_MAP[h.reason],
      h.oldQuota.toString(),
      h.newQuota.toString(),
      STATUS_MAP[h.status]?.label || h.status,
      h.approverName || '-',
      h.approvedAt || '-',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `编制变更历史_${departmentName}_${positionName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // 重置筛选
  const handleReset = () => {
    setStatusFilter('all');
    setReasonFilter('all');
    setDateRange('all');
  };

  if (!open) return null;

  return (
    <Modal open={open} title="编制调整历史" onClose={onClose} size="lg">
      <div className="space-y-4">
        {/* 头部信息 */}
        <div className="flex items-center justify-between p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div>
            <div className="text-sm font-medium text-[var(--color-text-primary)]">
              {departmentName} / {positionName}
            </div>
            <div className="text-xs text-[var(--color-text-secondary)] mt-1">
              共 {filteredHistories.length} 条变更记录
            </div>
          </div>
          <div className="flex items-center gap-2">
            {/* 时间范围 */}
            <Select
              options={[
                { value: 'all', label: '全部时间' },
                { value: '1month', label: '近1个月' },
                { value: '3months', label: '近3个月' },
                { value: '6months', label: '近6个月' },
              ]}
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as DateRange)}
              className="w-[120px]"
            />
          </div>
        </div>

        {/* 筛选条件 */}
        <div className="flex items-center gap-3 p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <Select
            options={[
              { value: 'all', label: '全部状态' },
              { value: 'pending', label: '待审批' },
              { value: 'approved', label: '已通过' },
              { value: 'rejected', label: '已驳回' },
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as HistoryStatus)}
            className="w-[120px]"
          />
          <Select
            options={[
              { value: 'all', label: '全部原因' },
              { value: 'business_expansion', label: '业务扩张' },
              { value: 'business_contraction', label: '业务收缩' },
              { value: 'natural_turnover', label: '自然流动' },
              { value: 'other', label: '其他' },
            ]}
            value={reasonFilter}
            onChange={(e) => setReasonFilter(e.target.value as HistoryReason)}
            className="w-[120px]"
          />
          <Button variant="secondary" size="sm" onClick={handleReset}>
            重置
          </Button>
          <Button variant="secondary" size="sm" onClick={handleExport}>
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>
        </div>

        {/* 历史记录列表 */}
        {loading ? (
          <div className="flex items-center justify-center h-40 text-[var(--color-text-secondary)]">
            加载中...
          </div>
        ) : paginatedHistories.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-[var(--color-text-secondary)]">
            <FileText className="w-8 h-8 mb-2 opacity-50" />
            <span>暂无变更记录</span>
          </div>
        ) : (
          <div className="space-y-3 max-h-[400px] overflow-auto">
            {paginatedHistories.map((history) => {
              const statusInfo = STATUS_MAP[history.status];
              const changeAmount = history.newQuota - history.oldQuota;
              const changeText = changeAmount > 0 ? `+${changeAmount}` : changeAmount.toString();

              return (
                <div
                  key={history.id}
                  className="p-4 rounded-lg border border-[var(--color-border)] bg-white hover:bg-[var(--color-surface-bg)]"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-[var(--color-text-secondary)]">
                        {new Date(history.createdAt).toLocaleString('zh-CN')}
                      </span>
                    </div>
                    <Badge variant="neutral" className={statusInfo.color}>
                      <span className="flex items-center gap-1">
                        {statusInfo.icon}
                        {statusInfo.label}
                      </span>
                    </Badge>
                  </div>

                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-lg font-semibold">{history.oldQuota}</span>
                    <span className="text-[var(--color-text-secondary)]">→</span>
                    <span className="text-lg font-semibold text-[var(--color-brand)]">{history.newQuota}</span>
                    <span className={`text-sm font-medium ${changeAmount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      ({changeText})
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-x-4 text-sm">
                    <div>
                      <span className="text-[var(--color-text-secondary)]">申请人：</span>
                      <span>{history.applicantName}</span>
                    </div>
                    <div>
                      <span className="text-[var(--color-text-secondary)]">调整原因：</span>
                      <span>{REASON_MAP[history.reason] || history.reason}</span>
                    </div>
                    {history.remark && (
                      <div className="col-span-2">
                        <span className="text-[var(--color-text-secondary)]">说明：</span>
                        <span>{history.remark}</span>
                      </div>
                    )}
                    {history.approverName && (
                      <div className="col-span-2">
                        <span className="text-[var(--color-text-secondary)]">审批人：</span>
                        <span>{history.approverName}</span>
                        {history.approvedAt && (
                          <span className="text-[var(--color-text-disabled)] ml-2">
                            审批时间：{new Date(history.approvedAt).toLocaleString('zh-CN')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {filteredHistories.length > PAGE_SIZE && (
          <div className="flex justify-end">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={filteredHistories.length}
              onChange={setCurrentPage}
            />
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