import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import type { Position } from '../types';

interface Employee {
  id: string;
  name: string;
  employeeNo: string;
  departmentName: string;
  joinDate: string;
}

interface PositionEmployeeModalProps {
  open: boolean;
  position: Position | null;
  employees: Employee[];
  loading?: boolean;
  onClose: () => void;
}

export const PositionEmployeeModal = ({
  open,
  position,
  employees,
  loading,
  onClose,
}: PositionEmployeeModalProps) => {
  if (!position) return null;

  return (
    <Modal open={open} title={`${position.name} - 在职员工`} onClose={onClose} size="lg">
      <div className="space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <span className="text-[var(--color-text-secondary)]">加载中...</span>
          </div>
        ) : employees.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-[var(--color-text-secondary)]">
            <span>暂无在职员工</span>
          </div>
        ) : (
          <>
            <div className="text-sm text-[var(--color-text-secondary)] mb-2">
              共 {employees.length} 名员工
            </div>
            <div className="max-h-80 overflow-y-auto border border-[var(--color-border)] rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-[var(--color-surface-bg)] sticky top-0">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">姓名</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">工号</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">部门</th>
                    <th className="px-4 py-2 text-left font-medium text-[var(--color-text-secondary)]">入职日期</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp.id} className="border-t border-[var(--color-border)] hover:bg-[var(--color-surface-bg)]">
                      <td className="px-4 py-2 text-[var(--color-text-primary)]">{emp.name}</td>
                      <td className="px-4 py-2 text-[var(--color-text-secondary)]">{emp.employeeNo}</td>
                      <td className="px-4 py-2 text-[var(--color-text-secondary)]">{emp.departmentName}</td>
                      <td className="px-4 py-2 text-[var(--color-text-secondary)]">{emp.joinDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="secondary" onClick={onClose}>
            关闭
          </Button>
        </div>
      </div>
    </Modal>
  );
};