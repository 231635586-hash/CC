import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { EstablishmentMatrixRow } from '../types';

interface BatchPreviewModalProps {
  open: boolean;
  previews: { row: EstablishmentMatrixRow; cellIndex: number; monthLabel: string; oldValue: number; newValue: number; establishmentId: string }[];
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export const BatchPreviewModal = ({
  open,
  previews,
  onClose,
  onConfirm,
  loading,
}: BatchPreviewModalProps) => {
  if (previews.length === 0) return null;

  return (
    <Modal open={open} title="批量调整预览" onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="text-sm text-[var(--color-text-secondary)]">
          共 {previews.length} 项调整申请，确认后提交审批：
        </div>

        <div className="max-h-64 overflow-auto border border-[var(--color-border)] rounded-lg">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-surface-bg)] sticky top-0">
              <tr>
                <th className="px-4 py-2 text-left font-medium">部门</th>
                <th className="px-4 py-2 text-left font-medium">职位</th>
                <th className="px-4 py-2 text-center font-medium">月份</th>
                <th className="px-4 py-2 text-center font-medium">原名额</th>
                <th className="px-4 py-2 text-center font-medium">新名额</th>
                <th className="px-4 py-2 text-center font-medium">变化</th>
              </tr>
            </thead>
            <tbody>
              {previews.map((item, idx) => {
                const diff = item.newValue - item.oldValue;
                return (
                  <tr key={idx} className="border-t border-[var(--color-border)]">
                    <td className="px-4 py-2">{item.row.departmentName}</td>
                    <td className="px-4 py-2">{item.row.positionName}</td>
                    <td className="px-4 py-2 text-center">{item.monthLabel}</td>
                    <td className="px-4 py-2 text-center">{item.oldValue}</td>
                    <td className="px-4 py-2 text-center">{item.newValue}</td>
                    <td className="px-4 py-2 text-center">
                      <span className={diff > 0 ? 'text-green-600' : diff < 0 ? 'text-red-600' : 'text-gray-400'}>
                        {diff > 0 ? `+${diff}` : diff}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            取消
          </Button>
          <Button onClick={onConfirm} loading={loading}>
            确认提交
          </Button>
        </div>
      </div>
    </Modal>
  );
};