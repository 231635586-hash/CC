import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';
import { applyEstablishmentUnlock } from '../services/api';

interface UnlockApplyModalProps {
  open: boolean;
  cell: {
    establishmentId?: string;
    departmentName: string;
    positionName: string;
    monthLabel: string;
    quota: number;
    occupied: number;
    remaining: number;
    lockReason?: string;
    lockExpiredAt?: string;
  } | null;
  onClose: () => void;
  onSuccess: () => void;
}

// 解锁时长类型
type UnlockDurationType = 'fixed_days' | 'specific_date' | 'one_time';

export const UnlockApplyModal = ({
  open,
  cell,
  onClose,
  onSuccess,
}: UnlockApplyModalProps) => {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    reason: '', // 解锁事由
    durationType: 'one_time' as UnlockDurationType, // 解锁时长类型
    fixedDays: 7, // 固定天数
    specificDate: '', // 指定日期
    estimatedChange: '', // 预估编制变动
    estimatedIncrease: 0, // 预计增员
    estimatedDecrease: 0, // 预计减员
  });

  if (!cell) return null;

  const handleSubmit = async () => {
    if (!form.reason.trim()) {
      showToast('请填写解锁事由', 'error');
      return;
    }

    if (form.durationType === 'fixed_days' && form.fixedDays < 1) {
      showToast('解锁天数至少为1天', 'error');
      return;
    }

    if (form.durationType === 'specific_date' && !form.specificDate) {
      showToast('请选择解锁截止日期', 'error');
      return;
    }

    if (!cell.establishmentId) {
      showToast('编制记录不存在', 'error');
      return;
    }

    setLoading(true);
    try {
      // 计算解锁过期时间
      let unlockExpiredAt: string | undefined;
      if (form.durationType === 'fixed_days') {
        const date = new Date();
        date.setDate(date.getDate() + form.fixedDays);
        unlockExpiredAt = date.toISOString().split('T')[0];
      } else if (form.durationType === 'specific_date') {
        unlockExpiredAt = form.specificDate;
      }

      const res = await applyEstablishmentUnlock(cell.establishmentId, form.reason, unlockExpiredAt);
      if (res.code === 0) {
        showToast('解锁申请已提交，等待审批', 'success');
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
      case 'fixed_days':
        return `解锁 ${form.fixedDays} 天后自动重新锁定`;
      case 'specific_date':
        return `解锁至 ${form.specificDate} 自动重新锁定`;
      case 'one_time':
        return '一次性解锁，使用后自动重新锁定';
    }
  };

  return (
    <Modal open={open} title="解锁申请" onClose={onClose} size="md">
      <div className="space-y-4">
        {/* 锁定信息（只读） */}
        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div className="text-sm text-[var(--color-text-primary)] font-medium mb-2">
            {cell.departmentName} / {cell.positionName}
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] space-y-1">
            <div>时间：{cell.monthLabel}</div>
            <div>当前名额：{cell.quota}，已占用：{cell.occupied}</div>
            <div className="text-red-600">剩余名额：{cell.remaining}（已锁定）</div>
            {cell.lockReason && <div>锁定原因：{cell.lockReason}</div>}
            {cell.lockExpiredAt && <div>锁定到期：{cell.lockExpiredAt}</div>}
          </div>
        </div>

        {/* 申请人 */}
        <div>
          <div className="text-sm text-[var(--color-text-secondary)]">申请人</div>
          <div className="text-sm text-[var(--color-text-primary)] mt-1">当前登录用户</div>
        </div>

        {/* 解锁事由 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            解锁事由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={form.reason}
            onChange={(e) => setForm({ ...form, reason: e.target.value })}
            placeholder="请输入申请解锁的事由..."
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none"
          />
        </div>

        {/* 解锁时长类型 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            解锁时长 <span className="text-red-500">*</span>
          </label>
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="durationType"
                value="one_time"
                checked={form.durationType === 'one_time'}
                onChange={() => setForm({ ...form, durationType: 'one_time' })}
              />
              <span className="text-sm">一次性使用（用完自动重新锁定）</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="durationType"
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
                name="durationType"
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

        {/* 预估编制变动 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            预估编制变动
          </label>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">预计增员</label>
              <input
                type="number"
                min={0}
                value={form.estimatedIncrease}
                onChange={(e) => setForm({ ...form, estimatedIncrease: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm mt-1"
                placeholder="0"
              />
            </div>
            <div>
              <label className="text-xs text-[var(--color-text-secondary)]">预计减员</label>
              <input
                type="number"
                min={0}
                value={form.estimatedDecrease}
                onChange={(e) => setForm({ ...form, estimatedDecrease: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm mt-1"
                placeholder="0"
              />
            </div>
          </div>
          <div className="mt-2 text-xs text-[var(--color-text-secondary)]">
            解锁后该职位总名额预计：{cell.quota + form.estimatedIncrease - form.estimatedDecrease} 人
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            提交解锁申请
          </Button>
        </div>
      </div>
    </Modal>
  );
};