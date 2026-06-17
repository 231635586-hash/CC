import { useState, useEffect } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import type { DepartmentTreeNode, DepartmentFormData } from '../types';

interface DepartmentFormModalProps {
  open: boolean;
  mode: 'create' | 'edit';
  parentNode?: DepartmentTreeNode | null;
  parentFullPath?: string;
  editNode?: DepartmentTreeNode | null;
  editFullPath?: string;
  onClose: () => void;
  onSubmit: (data: DepartmentFormData) => Promise<void>;
}

export const DepartmentFormModal = ({
  open,
  mode,
  parentNode,
  parentFullPath,
  editNode,
  editFullPath,
  onClose,
  onSubmit,
}: DepartmentFormModalProps) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (mode === 'edit' && editNode) {
        setName(editNode.name);
      } else {
        setName('');
      }
      setError('');
    }
  }, [open, mode, editNode]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('部门名称不能为空');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        name: name.trim(),
        parentId: mode === 'create' ? parentNode?.id || null : editNode?.parentId || null,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '操作失败');
    } finally {
      setLoading(false);
    }
  };

  const title = mode === 'create' ? '新增子部门' : '编辑部门';
  const submitText = mode === 'create' ? '创建' : '保存';

  return (
    <Modal open={open} title={title} onClose={onClose} size="sm">
      <div className="space-y-4">
        {mode === 'create' && parentNode && parentFullPath && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            上级部门：<span className="font-medium text-[var(--color-text-primary)]">{parentFullPath}</span>
          </div>
        )}

        {mode === 'edit' && editNode && editFullPath && (
          <div className="text-sm text-[var(--color-text-secondary)]">
            上级部门：<span className="font-medium text-[var(--color-text-primary)]">{editFullPath}</span>
          </div>
        )}

        <Input
          label="部门名称"
          placeholder="请输入部门名称"
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError('');
          }}
          error={error}
          autoFocus
        />

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