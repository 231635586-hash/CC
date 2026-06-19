import { useState, useEffect, useMemo } from 'react';
import { Calendar, FileText, Tag, ArrowRight, AlertCircle } from 'lucide-react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { showToast } from '@/components/ui/Toast';
import { applyTempExtend } from '../services/api';

type ExtendReason = 'business_expansion' | 'business_contraction' | 'natural_turnover' | 'other';

const REASON_OPTIONS: Array<{ value: ExtendReason; label: string }> = [
  { value: 'business_expansion', label: '业务扩张' },
  { value: 'business_contraction', label: '业务收缩' },
  { value: 'natural_turnover', label: '自然流动' },
  { value: 'other', label: '其他' },
];

interface EstablishmentExtendModalProps {
  open: boolean;
  /** 临时编制 establishment.id（=temp record 的 id） */
  establishmentId: string;
  /** 上下文展示信息 */
  departmentName: string;
  positionName: string;
  currentEndDate: string;
  currentStartDate: string;
  quota: number;
  occupied: number;
  /** 续约对应的月份（仅展示用） */
  month?: number;
  year?: number;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * 计算天数差（newDate - currentDate）
 */
function calcDaysDiff(currentDate: string, newDate: string): number | null {
  if (!currentDate || !newDate) return null;
  const c = new Date(currentDate);
  const n = new Date(newDate);
  c.setHours(0, 0, 0, 0);
  n.setHours(0, 0, 0, 0);
  return Math.ceil((n.getTime() - c.getTime()) / (24 * 60 * 60 * 1000));
}

export const EstablishmentExtendModal = ({
  open,
  establishmentId,
  departmentName,
  positionName,
  currentEndDate,
  currentStartDate,
  quota,
  occupied,
  month,
  year,
  onClose,
  onSuccess,
}: EstablishmentExtendModalProps) => {
  // 表单状态
  const [newEndDate, setNewEndDate] = useState('');
  const [reason, setReason] = useState<ExtendReason>('business_expansion');
  const [remark, setRemark] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string>('');

  // 打开时重置表单
  useEffect(() => {
    if (open) {
      // 默认建议新 endDate = 当前 endDate + 90 天
      const suggested = new Date(currentEndDate);
      suggested.setDate(suggested.getDate() + 90);
      setNewEndDate(suggested.toISOString().slice(0, 10));
      setReason('business_expansion');
      setRemark('');
      setError('');
    }
  }, [open, currentEndDate]);

  // 计算续约天数
  const extendDays = useMemo(() => calcDaysDiff(currentEndDate, newEndDate), [currentEndDate, newEndDate]);

  // 校验
  const validate = (): string => {
    if (!newEndDate) return '请选择续约后的失效日期';
    if (newEndDate <= currentEndDate) return '续约日期必须晚于当前失效日期';
    if (!reason) return '请选择续约原因';
    return '';
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setSubmitting(true);

    try {
      const res = await applyTempExtend(establishmentId, newEndDate, reason, remark.trim() || undefined);
      if (res.code === 0) {
        showToast('续约申请已提交，等待审批', 'success');
        onSuccess?.();
        onClose();
      } else {
        setError(res.message || '提交失败');
      }
    } catch (e) {
      setError('网络异常，请稍后再试');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal open={open} title="临时编制续约申请" onClose={onClose} size="md">
      <div className="space-y-4">
        {/* 当前信息（只读） */}
        <div className="p-3 bg-[var(--color-surface-bg)] rounded-lg border border-[var(--color-border)]">
          <div className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
            📋 当前信息
          </div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-sm">
            <div>
              <span className="text-[var(--color-text-secondary)]">部门/职位：</span>
              <span className="text-[var(--color-text-primary)]">{departmentName} / {positionName}</span>
            </div>
            <div>
              <span className="text-[var(--color-text-secondary)]">当前名额：</span>
              <span className="text-[var(--color-text-primary)]">{quota} / {occupied}</span>
            </div>
            <div className="col-span-2">
              <span className="text-[var(--color-text-secondary)]">起止日期：</span>
              <span className="text-[var(--color-text-primary)]">
                {currentStartDate} ~ {currentEndDate}
                {year && month !== undefined && (
                  <span className="text-xs text-[var(--color-text-disabled)] ml-2">
                    ({year} 年 {month} 月)
                  </span>
                )}
              </span>
            </div>
          </div>
        </div>

        {/* 新失效日期 */}
        <div>
          <Input
            type="date"
            label="续约后失效日期"
            value={newEndDate}
            onChange={(e) => {
              setNewEndDate(e.target.value);
              setError('');
            }}
            min={currentEndDate ? (() => {
              // 至少为 currentEndDate 后一天
              const d = new Date(currentEndDate);
              d.setDate(d.getDate() + 1);
              return d.toISOString().slice(0, 10);
            })() : undefined}
            suffixIcon={<Calendar className="w-4 h-4" />}
            error={error && !newEndDate ? error : undefined}
          />
          {extendDays !== null && extendDays > 0 && (
            <div className="mt-1.5 flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>原 {currentEndDate}</span>
              <ArrowRight className="w-3 h-3" />
              <span className="font-medium text-amber-600">新 {newEndDate}</span>
              <span className="text-[var(--color-text-disabled)]">
                （续约 <span className="font-medium text-amber-600">{extendDays}</span> 天）
              </span>
            </div>
          )}
        </div>

        {/* 续约原因 */}
        <div>
          <Select
            label="续约原因"
            options={REASON_OPTIONS}
            value={reason}
            onChange={(e) => {
              setReason(e.target.value as ExtendReason);
              setError('');
            }}
          />
        </div>

        {/* 备注 */}
        <div>
          <label className="block text-[13px] font-medium text-[var(--color-text-primary)] mb-1.5">
            <FileText className="w-3.5 h-3.5 inline mr-1 -mt-0.5" />
            备注
          </label>
          <textarea
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="可选：补充续约的背景说明"
            rows={3}
            maxLength={200}
            className="w-full px-3 py-2 text-sm border border-[var(--color-border)] rounded-md bg-[var(--color-surface-card)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] resize-none"
          />
          <div className="text-[11px] text-[var(--color-text-disabled)] mt-1 text-right">
            {remark.length} / 200
          </div>
        </div>

        {/* 提示 */}
        <div className="flex items-start gap-2 p-2.5 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <div className="font-medium">提交后将进入审批流程</div>
            <div className="mt-0.5 text-amber-600">
              审批通过后失效日期才会真正更新。当前数据不会被修改。
            </div>
          </div>
        </div>

        {/* 错误提示 */}
        {error && newEndDate && (
          <div className="text-xs text-[var(--color-status-danger)]">{error}</div>
        )}

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2 pt-2 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose} disabled={submitting}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={submitting}>
            <Tag className="w-3.5 h-3.5 mr-1.5" />
            提交审批申请
          </Button>
        </div>
      </div>
    </Modal>
  );
};