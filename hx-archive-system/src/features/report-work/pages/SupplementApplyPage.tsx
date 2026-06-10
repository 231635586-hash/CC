import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardBody, Button, Input } from '@/components/ui';
import { createSupplementApplication } from '../services/api';
import { shiftTypeOptions, mockApprovers, mockReportPoints } from '../services/mockData';
import type { ShiftType } from '@/types';
import { ArrowLeftIcon, AlertCircleIcon } from 'lucide-react';

export function SupplementApplyPage() {
  const navigate = useNavigate();
  const { date } = useParams<{ date: string }>();

  const [shiftType, setShiftType] = useState<ShiftType>('白班');
  const [reportPoint, setReportPoint] = useState('');
  const [approverId, setApproverId] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!reportPoint) {
      alert('请选择报工点');
      return;
    }
    if (!approverId) {
      alert('请选择审批班长');
      return;
    }

    setLoading(true);
    try {
      await createSupplementApplication({
        supplementDate: date || '',
        shiftType,
        reportPoint,
        approverId,
        reason,
      });
      alert('补报申请已提交，请等待班长审批');
      navigate('/report-work');
    } catch (error) {
      alert('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* 页面标题栏 */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" icon={<ArrowLeftIcon className="w-4 h-4" />} onClick={() => navigate(-1)}>
          返回
        </Button>
        <h1 className="text-xl font-semibold text-text-primary">发起补报</h1>
      </div>

      {/* 提示信息 */}
      <div className="flex items-center gap-2 p-3 bg-warning-light text-warning rounded-lg">
        <AlertCircleIcon className="w-4 h-4" />
        <span className="text-sm">仅支持7天内未报工日期</span>
      </div>

      {/* 补报信息表单 */}
      <Card>
        <CardHeader>
          <CardTitle>补报信息</CardTitle>
        </CardHeader>
        <CardBody>
          <div className="space-y-6">
            {/* 补报日期 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">补报日期</label>
              <Input value={date} disabled className="w-full" />
            </div>

            {/* 班次选择 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                班次 <span className="text-danger">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {shiftTypeOptions.map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    className={`py-3 px-4 border rounded-lg text-sm font-medium transition-all ${
                      shiftType === opt.value
                        ? 'border-brand bg-brand-light text-brand'
                        : 'border-border bg-surface-card text-text-primary hover:border-brand-light'
                    }`}
                    onClick={() => setShiftType(opt.value)}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* 报工点 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                报工点 <span className="text-danger">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-surface-card text-text-primary"
                value={reportPoint}
                onChange={(e) => setReportPoint(e.target.value)}
              >
                <option value="">请选择报工点</option>
                {mockReportPoints.map((point) => (
                  <option key={point.id} value={point.name}>{point.name}</option>
                ))}
              </select>
            </div>

            {/* 审批班长 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">
                审批班长 <span className="text-danger">*</span>
              </label>
              <select
                className="w-full px-3 py-2 border border-border rounded-md bg-surface-card text-text-primary"
                value={approverId}
                onChange={(e) => setApproverId(e.target.value)}
              >
                <option value="">请选择审批班长</option>
                {mockApprovers.map((approver) => (
                  <option key={approver.id} value={approver.id}>
                    {approver.name}（{approver.department}）
                  </option>
                ))}
              </select>
            </div>

            {/* 补报原因 */}
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">补报原因（选填）</label>
              <textarea
                className="w-full px-3 py-2 border border-border rounded-md bg-surface-card text-text-primary resize-none"
                rows={4}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="请输入补报原因（选填），说明补报原因有助于审批通过"
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* 提交按钮 */}
      <Button
        size="lg"
        onClick={handleSubmit}
        loading={loading}
        disabled={loading}
      >
        提交申请
      </Button>
    </div>
  );
}