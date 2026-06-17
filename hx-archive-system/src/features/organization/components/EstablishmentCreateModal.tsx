import { useState, useEffect, useMemo } from 'react';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { showToast } from '@/components/ui/Toast';
import { getPositions, createEstablishment } from '../services/api';
import type { Position } from '../types';

interface EstablishmentCreateModalProps {
  open: boolean;
  departmentId: string;
  departmentName: string;
  onClose: () => void;
  onSuccess: () => void;
  currentYear: number;
}

export const EstablishmentCreateModal = ({
  open,
  departmentId,
  departmentName,
  onClose,
  onSuccess,
  currentYear,
}: EstablishmentCreateModalProps) => {
  const [loading, setLoading] = useState(false);
  const [positions, setPositions] = useState<Position[]>([]);
  const [positionSearch, setPositionSearch] = useState('');
  const [form, setForm] = useState({
    positionId: '',
    year: currentYear,
    month: new Date().getMonth() + 1,
    quota: 0,
  });

  // 加载所有职位
  useEffect(() => {
    if (open) {
      const loadPositions = async () => {
        const res = await getPositions();
        if (res.code === 0 && res.data) {
          setPositions(res.data);
        }
      };
      loadPositions();
    }
  }, [open]);

  // 过滤职位（模糊搜索）
  const filteredPositions = useMemo(() => {
    if (!positionSearch.trim()) {
      return positions;
    }
    const keyword = positionSearch.toLowerCase();
    return positions.filter((p) => p.name.toLowerCase().includes(keyword));
  }, [positions, positionSearch]);

  const handleSubmit = async () => {
    if (!form.positionId) {
      showToast('请选择职位', 'info');
      return;
    }
    if (form.quota < 1) {
      showToast('编制名额必须至少为1', 'info');
      return;
    }

    setLoading(true);
    try {
      const res = await createEstablishment(
        departmentId,
        form.positionId,
        form.year,
        form.month,
        form.quota
      );

      if (res.code === 0) {
        showToast('创建成功，等待审批', 'success');
        onSuccess();
      } else {
        showToast(res.message || '创建失败', 'error');
      }
    } catch (error) {
      showToast('创建失败', 'error');
    } finally {
      setLoading(false);
    }
  };

  // 关闭时重置表单
  const handleClose = () => {
    setPositionSearch('');
    setForm({
      positionId: '',
      year: currentYear,
      month: new Date().getMonth() + 1,
      quota: 0,
    });
    onClose();
  };

  return (
    <Modal open={open} title="新增编制" onClose={handleClose} size="md">
      <div className="space-y-4">
        {/* 部门（只读） */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            部门
          </label>
          <div className="px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)]">
            {departmentName}
          </div>
        </div>

        {/* 职位选择（模糊搜索） */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            职位 <span className="text-red-500">*</span>
          </label>
          <Input
            placeholder="搜索职位..."
            value={positionSearch}
            onChange={(e) => setPositionSearch(e.target.value)}
          />
          {/* 职位列表 */}
          <div className="mt-1 max-h-48 overflow-y-auto border border-[var(--color-border)] rounded-lg">
            {filteredPositions.length === 0 ? (
              <div className="px-4 py-3 text-sm text-[var(--color-text-secondary)] text-center">
                {positionSearch ? '没有搜索到匹配的职位' : '暂无可选职位'}
              </div>
            ) : (
              filteredPositions.map((pos) => (
                <div
                  key={pos.id}
                  onClick={() => {
                    setForm((prev) => ({ ...prev, positionId: pos.id }));
                    setPositionSearch(pos.name);
                  }}
                  className={`px-4 py-2 text-sm cursor-pointer hover:bg-[var(--color-surface-bg)] ${
                    form.positionId === pos.id ? 'bg-[var(--color-brand-bg)] text-[var(--color-brand)]' : 'text-[var(--color-text-primary)]'
                  }`}
                >
                  {pos.name}
                </div>
              ))
            )}
          </div>
        </div>

        {/* 时间选择 */}
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              年份
            </label>
            <select
              value={form.year}
              onChange={(e) => setForm((prev) => ({ ...prev, year: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            >
              {Array.from({ length: 11 }, (_, i) => currentYear - 5 + i).map((year) => (
                <option key={year} value={year}>
                  {year}年
                </option>
              ))}
            </select>
          </div>
          <div className="flex-1">
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
              月份
            </label>
            <select
              value={form.month}
              onChange={(e) => setForm((prev) => ({ ...prev, month: Number(e.target.value) }))}
              className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            >
              {Array.from({ length: 12 }, (_, i) => i + 1).map((month) => (
                <option key={month} value={month}>
                  {month}月
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 编制名额 */}
        <div>
          <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-1">
            编制名额 <span className="text-red-500">*</span>
          </label>
          <input
            type="number"
            min={1}
            value={form.quota || ''}
            onChange={(e) => setForm((prev) => ({ ...prev, quota: Number(e.target.value) || 0 }))}
            className="w-full px-3 py-2 border border-[var(--color-border)] rounded-lg text-sm"
            placeholder="请输入编制名额"
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={handleClose}>
            取消
          </Button>
          <Button onClick={handleSubmit} loading={loading}>
            创建申请
          </Button>
        </div>
      </div>
    </Modal>
  );
};