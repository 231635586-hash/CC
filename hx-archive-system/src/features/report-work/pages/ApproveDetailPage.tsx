import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody, Button } from '@/components/ui';
import { useReportWorkStore } from '../store';
import { fetchSupplementById, approveSupplement, rejectSupplement } from '../services/api';
import type { SupplementStatus } from '@/types';
import { ArrowLeftIcon, CheckIcon, XIcon, AlertCircleIcon } from 'lucide-react';

export function ApproveDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const isViewOnly = searchParams.get('view') === 'true';

  const { currentSupplement, setCurrentSupplement } = useReportWorkStore();

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (id) {
      fetchSupplementById(id).then((data) => {
        if (data) {
          setCurrentSupplement(data);
        }
      });
    }
  }, [id, setCurrentSupplement]);

  const handleBack = () => {
    navigate('/report-work/approve');
  };

  const handleApprove = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const success = await approveSupplement(id);
      if (success) {
        alert('审批通过成功');
        navigate('/report-work/approve');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert('请填写驳回原因');
      return;
    }
    if (!id) return;

    setLoading(true);
    try {
      const success = await rejectSupplement(id, rejectReason);
      if (success) {
        alert('审批驳回成功');
        setShowRejectModal(false);
        navigate('/report-work/approve');
      }
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: SupplementStatus) => {
    switch (status) {
      case '待审批':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-warning-light text-warning">待审批</span>;
      case '已通过':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-success-light text-success">已通过</span>;
      case '已驳回':
        return <span className="px-2 py-0.5 rounded-full text-xs bg-danger-light text-danger">已驳回</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-xs bg-gray-light text-gray">{status}</span>;
    }
  };

  if (!currentSupplement) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-text-secondary">加载中...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题栏 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />} onClick={handleBack}>
          返回
        </Button>
        <h1 className="text-xl font-semibold text-text-primary">审批详情</h1>
      </div>

      {/* 申请人信息卡片 */}
      <Card>
        <CardBody className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-brand-light text-brand flex items-center justify-center text-lg font-semibold">
            {currentSupplement.employeeName.charAt(0)}
          </div>
          <div>
            <div className="font-medium text-lg">{currentSupplement.employeeName}</div>
            <div className="text-sm text-text-secondary">
              工号：{currentSupplement.employeeId} · {currentSupplement.departmentName}
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 申请信息卡片 */}
      <Card>
        <CardHeader>
          <CardTitle>申请信息</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 gap-x-8 gap-y-4">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">补报日期</span>
              <span className="font-medium">{currentSupplement.supplementDate}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">申请班次</span>
              <span className="font-medium">{currentSupplement.shiftType}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">报工点</span>
              <span className="font-medium">{currentSupplement.reportPoint}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">审批班长</span>
              <span className="font-medium">{currentSupplement.approverName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">申请时间</span>
              <span className="font-medium">{currentSupplement.applyTime}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-text-secondary">状态</span>
              {getStatusBadge(currentSupplement.status)}
            </div>
          </div>

          {/* 补报原因 */}
          {currentSupplement.reason && (
            <div className="mt-4 p-3 bg-surface-bg rounded-lg">
              <div className="text-sm font-medium text-text-secondary mb-1">补报原因</div>
              <div className="text-sm text-text-primary">{currentSupplement.reason}</div>
            </div>
          )}

          {/* 驳回原因 */}
          {currentSupplement.status === '已驳回' && currentSupplement.rejectReason && (
            <div className="mt-4 p-3 bg-danger-light text-danger rounded-lg">
              <div className="flex items-center gap-2 mb-1">
                <AlertCircleIcon className="w-4 h-4" />
                <span className="text-sm font-medium">驳回原因</span>
              </div>
              <div className="text-sm">{currentSupplement.rejectReason}</div>
            </div>
          )}
        </CardBody>
      </Card>

      {/* 审批操作栏 - 仅在非只读模式和待审批状态下显示 */}
      {!isViewOnly && currentSupplement.status === '待审批' && (
        <div className="flex gap-3">
          <Button
            variant="danger"
            size="lg"
            className="flex-1"
            icon={<XIcon className="w-4 h-4" />}
            onClick={() => setShowRejectModal(true)}
            disabled={loading}
          >
            驳回
          </Button>
          <Button
            variant="primary"
            size="lg"
            className="flex-1"
            icon={<CheckIcon className="w-4 h-4" />}
            onClick={handleApprove}
            loading={loading}
            disabled={loading}
          >
            通过
          </Button>
        </div>
      )}

      {/* 驳回原因弹窗 - 使用简单的确认对话框 */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-card rounded-lg p-6 w-full max-w-md shadow-lg">
            <h3 className="text-lg font-semibold mb-4">确认驳回</h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-text-secondary mb-2">
                驳回原因 <span className="text-danger">*</span>
              </label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md bg-surface-bg text-text-primary resize-none"
                rows={4}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="请输入驳回原因"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="secondary" onClick={() => setShowRejectModal(false)}>
                取消
              </Button>
              <Button variant="danger" onClick={handleReject} loading={loading}>
                确认驳回
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}