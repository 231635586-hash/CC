import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { applyEstablishmentLock } from '../services/api';

interface LockApplyModalProps {
  open: boolean;
  cell: {
    establishmentId?: string;
    departmentName: string;
    positionName: string;
    monthLabel: string;
    quota: number;
    occupied: number;
    remaining: number;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

// 锁定时长类型
type LockDurationType = 'fixed_days' | 'specific_date' | 'permanent';

export const LockApplyModal = ({
  open,
  cell,
  onClose,
  onSuccess,
}: LockApplyModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reason: '', // 锁定原因
    durationType: 'permanent' as LockDurationType, // 锁定时长类型
    fixedDays: 90, // 固定天数
    specificDate: '', // 指定日期
  });

  if (!cell) return null;

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      showToast('请填写锁定原因', 'error');
      return;
    }

    if (form.durationType === 'fixed_days' && form.fixedDays < 1) {
      showToast('锁定天数至少为1天', 'error');
      return;
    }

    if (form.durationType === 'specific_date' && !form.specificDate) {
      showToast('请选择锁定截止日期', 'error');
      return;
    }

    if (!cell.establishmentId) {
      showToast('编制记录不存在', 'error');
      return;
    }

    setLoading(true);
    try {
      // 计算锁定过期时间
      let lockExpiredAt: string | undefined;
      if (form.durationType === 'fixed_days') {
        const date = new Date();
        date.setDate(date.getDate() + form.fixedDays);
        lockExpiredAt = date.toISOString().split('T')[0];
      } else if (form.durationType === 'specific_date') {
        lockExpiredAt = form.specificDate;
      }

      const res = await applyEstablishmentLock(cell.establishmentId, form.reason, lockExpiredAt);
      if (res.code === 0) {
        showToast('锁定申请已提交，等待审批', 'success');
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

  const getDurationDesc = () => {
    switch (form.durationType) {
      case 'permanent':
        return '永久锁定';
      case 'fixed_days':
        return `锁定 ${form.fixedDays} 天`;
      case 'specific_date':
        return `锁定至 ${form.specificDate}`;
    }
  };

  return (
    <Modal open={open} title="锁定申请" onClose={onClose} size="md">
      <div className="space-y-4">
        {/* 编制信息（只读） */}
        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div className="text-sm text-[var(--color-text-primary)] font-medium mb-2">
            {cell.departmentName} / {cell.positionName}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <div>时间：{cell.monthLabel}</div>
            <div>当前名额：{cell.quota}</div>
            <div>已占用：{cell.occupied}</div>
            <div>剩余名额：{cell.remaining}</div>
          </div>
        </div>

        {/* 锁定原因 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            锁定原因 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="请输入申请锁定的理由..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none"
          />
        </div>

        {/* 锁定时长 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            锁定时长 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lockDurationType"
                value="permanent"
                checked={form.durationType === 'permanent'}
                onChange={() => setForm({ ...form, durationType: 'permanent' })}
              />
              <span className="text-sm">永久锁定</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lockDurationType"
                value="fixed_days"
                checked={form.durationType === 'fixed_days'}
                onChange={() => setForm({ ...form, durationType: 'fixed_days' })}
              />
              <span className="text-sm">固定天数</span>
              {form.durationType === 'fixed_days' && (
                <input
                  type="number"
                  min={1}
                  value={form.fixedDays}
                  onChange={(e) => setForm({ ...form, fixedDays: Number(e.target.value) })}
                  className="w-20 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                />
              )}
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="lockDurationType"
                value="specific_date"
                checked={form.durationType === 'specific_date'}
                onChange={() => setForm({ ...form, durationType: 'specific_date' })}
              />
              <span className="text-sm">指定日期</span>
              {form.durationType === 'specific_date' && (
                <input
                  type="date"
                  value={form.specificDate}
                  onChange={(e) => setForm({ ...form, specificDate: e.target.value })}
                  className="px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                />
              )}
            </label>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
            {getDurationDesc()}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            提交锁定申请
          </Button>
        </div>
      </div>
    </Modal>
  );
};