import { useState } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { showToast } from '@/components/ui/Toast';

interface BatchLockModalProps {
  open: boolean;
  mode: 'lock' | 'unlock';
  selectedCount: number;
  onClose: () => void;
  onSubmit: (reason: string, durationType: string, durationValue: string) => Promise<void>;
}

type DurationType = 'permanent' | 'fixed_days' | 'specific_date' | 'one_time';

export const BatchLockModal = ({
  open,
  mode,
  selectedCount,
  onClose,
  onSubmit,
}: BatchLockModalProps) => {
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [durationType, setDurationType] = useState<DurationType>(
    mode === 'lock' ? 'permanent' : 'one_time'
  );
  const [fixedDays, setFixedDays] = useState(90);
  const [specificDate, setSpecificDate] = useState('');

  const handleSubmit = async () => {
    if (!reason.trim()) {
      showToast(`请填写${mode === 'lock' ? '锁定' : '解锁'}事由`, 'error');
      return;
    }

    if (durationType === 'fixed_days' && fixedDays < 1) {
      showToast('天数至少为1天', 'error');
      return;
    }

    if (durationType === 'specific_date' && !specificDate) {
      showToast('请选择日期', 'error');
      return;
    }

    setLoading(true);
    try {
      const durationValue =
        durationType === 'fixed_days'
          ? String(fixedDays)
          : durationType === 'specific_date'
          ? specificDate
          : '';
      await onSubmit(reason, durationType, durationValue);
      onClose();
    } catch (error) {
      showToast('提交失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      title={mode === 'lock' ? '批量锁定编制' : '批量解锁编制'}
      onClose={onClose}
      size="md"
    >
      <div className="space-y-4">
        {/* 提示信息 */}
        <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg">
          <div className="text-sm text-[var(--color-text-primary)]">
            已选择 <span className="font-bold">{selectedCount}</span> 个编制
          </div>
          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
            {mode === 'lock'
              ? '锁定后这些编制将无法被随意调整，需要通过审批解锁'
              : '解锁后将恢复正常的调整权限'}
          </div>
        </div>

        {/* 事由 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            {mode === 'lock' ? '锁定' : '解锁'}事由 <span className="text-red-500">*</span>
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={`请输入${mode === 'lock' ? '锁定' : '解锁'}事由...`}
            rows={3}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none"
          />
        </div>

        {/* 时长选项 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
            {mode === 'lock' ? '锁定' : '解锁'}时长
          </label>
          <div className="space-y-2">
            {mode === 'lock' ? (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'permanent'}
                    onChange={() => setDurationType('permanent')}
                  />
                  <span className="text-sm">永久锁定</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'fixed_days'}
                    onChange={() => setDurationType('fixed_days')}
                  />
                  <span className="text-sm">固定天数</span>
                  {durationType === 'fixed_days' && (
                    <input
                      type="number"
                      min={1}
                      value={fixedDays}
                      onChange={(e) => setFixedDays(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                    />
                  )}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'specific_date'}
                    onChange={() => setDurationType('specific_date')}
                  />
                  <span className="text-sm">指定日期</span>
                  {durationType === 'specific_date' && (
                    <input
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                    />
                  )}
                </label>
              </>
            ) : (
              <>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'one_time'}
                    onChange={() => setDurationType('one_time')}
                  />
                  <span className="text-sm">一次性使用（用完自动重新锁定）</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'fixed_days'}
                    onChange={() => setDurationType('fixed_days')}
                  />
                  <span className="text-sm">固定天数</span>
                  {durationType === 'fixed_days' && (
                    <input
                      type="number"
                      min={1}
                      value={fixedDays}
                      onChange={(e) => setFixedDays(Number(e.target.value))}
                      className="w-20 px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                    />
                  )}
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="durationType"
                    checked={durationType === 'specific_date'}
                    onChange={() => setDurationType('specific_date')}
                  />
                  <span className="text-sm">指定日期</span>
                  {durationType === 'specific_date' && (
                    <input
                      type="date"
                      value={specificDate}
                      onChange={(e) => setSpecificDate(e.target.value)}
                      className="px-2 py-1 border border-[var(--color-border)] rounded text-sm"
                    />
                  )}
                </label>
              </>
            )}
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            确认{mode === 'lock' ? '锁定' : '解锁'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};