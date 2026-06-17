import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { showToast } from '@/components/ui/Toast';
import { applyEstablishmentChange, createEstablishment } from '../services/api';
import type { EstablishmentFormData } from '../types';

interface EstablishmentApplyModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  cell: {
    establishmentId?: string;
    departmentId?: string;
    departmentName: string;
    positionId?: string;
    positionName: string;
    monthLabel: string;
    quota: number;
    occupied: number;
    remaining: number;
  };
  onClose: () => void;
  onSuccess: () => void;
}

// 原因选项
const REASON_OPTIONS = [
  { value: 'business_expansion', label: '业务扩张' },
  { value: 'business_contraction', label: '业务收缩' },
  { value: 'natural_turnover', label: '自然流动' },
  { value: 'other', label: '其他' },
];

export const EstablishmentApplyModal = ({
  open,
  mode,
  cell,
  onClose,
  onSuccess,
}: EstablishmentApplyModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<EstablishmentFormData>({
    newQuota: mode === 'create' ? 0 : cell.quota,
    reason: 'business_expansion',
    remark: '',
  });

  const isCreate = mode === 'create';
  const diff = isCreate ? form.newQuota : (form.newQuota - cell.quota);

  const handleSubmit = async () => {
    if (form.newQuota < 0) {
      showToast('名额不能为负数', 'error');
      return;
    }

    if (!isCreate && form.newQuota === cell.quota) {
      showToast('调整后名额与当前名额相同，请修改后提交', 'error');
      return;
    }

    if (isCreate && form.newQuota === 0) {
      showToast('请填写编制名额', 'error');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (isCreate) {
        // 创建模式：调用 createEstablishment，需要 departmentId、positionId、year、month
        const [year, month] = cell.monthLabel.split('年').map(s => parseInt(s.replace('月', ''), 10));
        res = await createEstablishment(
          cell.departmentId!,
          cell.positionId!,
          year,
          month,
          form.newQuota,
          form.reason,
          form.remark
        );
      } else {
        // 编辑模式：调用 applyEstablishmentChange
        res = await applyEstablishmentChange(
          cell.establishmentId!,
          form.newQuota,
          form.reason,
          form.remark
        );
      }

      if (res.code === 0) {
        showToast(isCreate ? '创建申请提交成功，等待审批' : '调整申请提交成功，等待审批', 'success');
        onSuccess();
      } else {
        showToast(res.message || '提交失败', 'error');
      }
    } catch (error) {
      showToast('提交失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={open} title={isCreate ? "创建新编制" : "发起编制调整申请"} onClose={onClose} size="md">
      <div className="space-y-4">
        {/* 编制信息 */}
        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div className="text-sm text-[var(--color-text-primary)] font-medium mb-2">
            {cell.departmentName} / {cell.positionName}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <div>时间：{cell.monthLabel}</div>
            {isCreate ? (
              <div className="text-orange-600 mt-1">
                当前无编制记录，将创建新编制申请
              </div>
            ) : (
              <>
                <div>当前名额：{cell.quota}</div>
                <div>已占用：{cell.occupied}</div>
                <div>剩余名额：{cell.remaining}</div>
              </>
            )}
          </div>
        </div>

        {/* 编制名额 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            {isCreate ? '编制名额' : '调整后名额'} <span className="text-red-500">*</span>
          </label>
          <Input
            type="number"
            min={0}
            value={form.newQuota}
            onChange={(e) => setForm({ ...form, newQuota: Number(e.target.value) })}
            placeholder={isCreate ? '请输入编制名额' : ''}
          />
          {!isCreate && diff !== 0 && (
            <div className="text-xs mt-1">
              {diff > 0 ? (
                <span className="text-green-600">+{diff} 名额增加</span>
              ) : (
                <span className="text-red-600">{diff} 名额减少</span>
              )}
            </div>
          )}
        </div>

        {/* 调整原因 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            调整原因 <span className="text-red-500">*</span>
          </label>
          <Select
            options={REASON_OPTIONS}
            value={form.reason}
            onChange={(e) => setForm({
              ...form,
              reason: e.target.value as EstablishmentFormData['reason'],
            })}
          />
        </div>

        {/* 调整说明 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            调整说明
          </label>
          <textarea
            value={form.remark || ''}
            onChange={(e) => setForm({ ...form, remark: e.target.value })}
            placeholder="请输入调整说明..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            提交申请
          </Button>
        </div>
      </div>
    </Modal>
  );
};