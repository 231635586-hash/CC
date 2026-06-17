import { useState, useEffect, useCallback } from 'react';
import { RefreshCw } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Pagination } from '@/components/ui/Pagination';
import { getApprovalRecords } from '../services/api';
import type { ApprovalRecord } from '../types';

const PAGE_SIZE = 10;

interface ApprovalRecordsModalProps {
  open: boolean;
  onClose: () => void;
}

export const ApprovalRecordsModal = ({ open, onClose }: ApprovalRecordsModalProps) => {
  const [records, setRecords] = useState<ApprovalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  // 加载审批记录
  const loadRecords = useCallback(async (): Promise<void> => {
    setLoading(true);
    try {
      const res = await getApprovalRecords();
      if (res.code === 0 && res.data) {
        setRecords(res.data);
      }
    } catch (error) {
      console.error('加载审批记录失败', error);
    } finally {
      setLoading(false);
    }
  }, []);

  // 打开时加载数据
  useEffect(() => {
    if (open) {
      loadRecords();
    }
  }, [open, loadRecords]);

  // 计算分页数据
  const paginatedRecords = records.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  // 渲染状态Badge
  const renderStatusBadge = (status: string) => {
    const config: Record<string, { label: string; className: string }> = {
      approved: { label: '已通过', className: 'bg-green-100 text-green-700' },
      rejected: { label: '已驳回', className: 'bg-red-100 text-red-700' },
      pending: { label: '审批中', className: 'bg-yellow-100 text-yellow-700' },
    };
    const item = config[status] || { label: status, className: '' };
    return (
      <Badge variant="neutral" className={item.className}>
        {item.label}
      </Badge>
    );
  };

  return (
    <Modal open={open} title="审批记录" onClose={onClose} size="lg">
      <div className="flex flex-col h-[500px]">
        {/* 头部操作栏 */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--color-border)]">
          <span className="text-sm text-[var(--color-text-secondary)]">
            共 {records.length} 条记录
          </span>
          <Button variant="secondary" size="sm" onClick={loadRecords}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            刷新
          </Button>
        </div>

        {/* 列表区域 */}
        <div className="flex-1 overflow-auto py-2">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--color-text-secondary)]">加载中...</div>
            </div>
          ) : records.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-[var(--color-text-secondary)] text-center">
                <div className="mb-2">暂无审批记录</div>
                <div className="text-sm">在钉钉端完成的审批将会显示在这里</div>
              </div>
            </div>
          ) : (
            <div className="border border-[var(--color-border)] rounded-lg overflow-hidden">
              {/* 表头 */}
              <div className="flex items-center h-10 px-4 bg-[var(--color-surface-bg)] border-b border-[var(--color-border)]">
                <div className="w-[80px] text-sm font-medium text-[var(--color-text-secondary)]">申请人</div>
                <div className="w-[120px] text-sm font-medium text-[var(--color-text-secondary)]">部门/职位</div>
                <div className="w-[60px] text-sm font-medium text-[var(--color-text-secondary)]">原编制</div>
                <div className="w-[60px] text-sm font-medium text-[var(--color-text-secondary)]">新编制</div>
                <div className="w-[70px] text-sm font-medium text-[var(--color-text-secondary)]">审批结果</div>
                <div className="flex-1 text-sm font-medium text-[var(--color-text-secondary)]">备注</div>
              </div>

              {/* 数据行 */}
              {paginatedRecords.map((record) => (
                <div
                  key={record.id}
                  className="flex items-center h-12 px-4 hover:bg-[var(--color-surface-bg)] border-b border-[var(--color-border)] last:border-b-0"
                >
                  <div className="w-[80px] text-sm text-[var(--color-text-primary)]">
                    {record.applicantName}
                  </div>
                  <div className="w-[120px] text-sm text-[var(--color-text-secondary)] truncate pr-2" title={`${record.departmentName} / ${record.positionName}`}>
                    {record.departmentName} / {record.positionName}
                  </div>
                  <div className="w-[60px] text-sm text-[var(--color-text-primary)]">
                    {record.oldQuota}
                  </div>
                  <div className="w-[60px] text-sm text-[var(--color-text-primary)]">
                    {record.newQuota}
                  </div>
                  <div className="w-[70px]">
                    {renderStatusBadge(record.status)}
                  </div>
                  <div className="flex-1 text-sm text-[var(--color-text-secondary)] truncate pr-4" title={record.remark || '-'}>
                    {record.status === 'rejected' && record.rejectReason ? record.rejectReason : (record.remark || '-')}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 分页栏 */}
        {!loading && records.length > 0 && (
          <div className="pt-3 border-t border-[var(--color-border)]">
            <Pagination
              current={currentPage}
              pageSize={PAGE_SIZE}
              total={records.length}
              onChange={setCurrentPage}
              pageSizeOptions={[10, 20, 50]}
            />
          </div>
        )}
      </div>
    </Modal>
  );
};