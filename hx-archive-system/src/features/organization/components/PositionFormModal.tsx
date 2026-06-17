import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { Position } from '../types';

interface PositionFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  editPosition?: Position | null;
  onClose: () => void;
  onSubmit: (name: string, description?: string) => Promise<void>;
}

export const PositionFormModal = ({
  open,
  mode,
  editPosition,
  onClose,
  onSubmit,
}: PositionFormModalProps) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editPosition) {
        setName(editPosition.name);
        setDescription(editPosition.description || '');
      } else {
        setName('');
        setDescription('');
      }
      setError('');
    }
  }, [open, mode, editPosition]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('职位名称不能为空');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(name.trim(), description.trim() || undefined);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create' ? '新增职位' : '编辑职位';
  const submitText = mode === 'create' ? '创建' : '保存';

  return (
    <Modal open={open} title={title} onClose={onClose} size="md">
      <div className="space-y-4">
        <Input
          label="职位名称"
          placeholder="请输入职位名称"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          autoFocus
        />

        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            职位说明
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="请输入职位说明（选填）"
            rows={3}
            maxLength={500}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-brand)] focus:border-[var(--color-brand)]"
          />
          <div className="text-xs text-[var(--color-text-disabled)] text-right mt-1">
            {description.length}/500
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            {submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};