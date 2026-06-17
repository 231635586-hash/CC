import { useState, useEffect } from 'react';
import { X, Building2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';
import type { DepartmentTreeNode } from '../types';
import { getDepartmentFullPath } from '../services/api';

// 详情面板宽度
const DETAIL_PANEL_WIDTH = 'w-[480px]';

interface DepartmentDetailPanelProps {
  visible: boolean;
  department: DepartmentTreeNode | null;
  positionCount: number;
  establishmentCount: number;
  onClose: () => void;
  onNavigateDepartment?: (departmentId: string) => void;
}

type TabType = 'info' | 'history';

// 变更记录类型
interface ChangeHistoryRecord {
  id: string;
  type: 'info' | 'position' | 'establishment';
  content: string;
  detail: string;
  operator: string;
  createdAt: string;
}

export const DepartmentDetailPanel = ({
  visible,
  department,
  positionCount,
  establishmentCount,
  onClose,
  onNavigateDepartment,
}: DepartmentDetailPanelProps) => {
  const [activeTab, setActiveTab] = useState<TabType>('info');
  const [changeHistory, setChangeHistory] = useState<ChangeHistoryRecord[]>([]);

  // 模拟加载变更记录
  useEffect(() => {
    if (visible && department) {
      // 模拟数据
      setChangeHistory([
        {
          id: '1',
          type: 'info',
          content: '部门信息更新',
          detail: '修改部门名称为"研发部"',
          operator: '张三',
          createdAt: '2026-06-10 14:30:00',
        },
        {
          id: '2',
          type: 'position',
          content: '职位变动',
          detail: '新增职位：前端开发工程师',
          operator: '张三',
          createdAt: '2026-06-08 10:20:00',
        },
        {
          id: '3',
          type: 'establishment',
          content: '编制调整',
          detail: '研发部-前端开发工程师-6月：5→8',
          operator: '李四',
          createdAt: '2026-06-05 16:45:00',
        },
      ]);
    }
  }, [visible, department]);

  if (!visible || !department) return null;

  const departmentPath = getDepartmentFullPath(department.id);

  // 获取变更类型标签样式
  const getChangeTypeStyle = (type: string) => {
    switch (type) {
      case 'info':
        return 'bg-[var(--color-brand-bg)] text-[var(--color-brand)] border-[var(--color-brand)]';
      case 'position':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'establishment':
        return 'bg-[var(--color-status-success-bg)] text-[var(--color-status-success)] border-[var(--color-status-success)]';
      default:
        return 'bg-[var(--color-surface-bg)] text-[var(--color-text-secondary)] border-[var(--color-border)]';
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div
        className="fixed inset-0 bg-black/20 z-40 animate-fade-in"
        onClick={onClose}
      />

      {/* 滑出面板 */}
      <div className={cn('fixed right-0 top-0 bottom-0 bg-white z-50 shadow-[-8px_0_24px_rgba(0,0,0,0.15)] animate-slide-in-right overflow-hidden flex flex-col', DETAIL_PANEL_WIDTH)}>
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <Building2 className="w-5 h-5 text-[var(--color-brand)]" />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                {department.name}
              </h2>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {department.code || department.id}
              </span>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Tab切换 */}
        <div className="flex border-b border-[var(--color-border)]">
          <button
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'info'
                ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
            onClick={() => setActiveTab('info')}
          >
            组织信息
          </button>
          <button
            className={cn(
              'flex-1 px-4 py-3 text-sm font-medium transition-colors',
              activeTab === 'history'
                ? 'text-[var(--color-brand)] border-b-2 border-[var(--color-brand)]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            )}
            onClick={() => setActiveTab('history')}
          >
            变更记录
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-auto">
          {activeTab === 'info' ? (
            <div className="p-6 space-y-6">
              {/* 基本信息 */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  基本信息
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">部门名称</span>
                    <span className="text-sm text-[var(--color-text-primary)]">{department.name}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">部门编码</span>
                    <span className="text-sm text-[var(--color-text-primary)]">{department.code || '-'}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">完整路径</span>
                    <span className="text-sm text-[var(--color-text-primary)]">{departmentPath}</span>
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">层级</span>
                    <span className="text-sm text-[var(--color-text-primary)]">第 {department.level + 1} 级</span>
                  </div>
                </div>
              </div>

              {/* 上下级关系 */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  上下级关系
                </h3>
                <div className="space-y-2">
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">上级部门</span>
                    {department.parentId ? (
                      <button
                        onClick={() => onNavigateDepartment?.(department.parentId!)}
                        className="text-sm text-[var(--color-brand)] hover:underline"
                      >
                        点击跳转
                      </button>
                    ) : (
                      <span className="text-sm text-[var(--color-text-primary)]">根节点</span>
                    )}
                  </div>
                  <div className="flex justify-between py-2 border-b border-[var(--color-border)]">
                    <span className="text-sm text-[var(--color-text-secondary)]">子部门数量</span>
                    <span className="text-sm text-[var(--color-text-primary)]">
                      {department.children?.length || 0} 个
                    </span>
                  </div>
                </div>
              </div>

              {/* 统计汇总 */}
              <div>
                <h3 className="text-sm font-medium text-[var(--color-text-primary)] mb-3">
                  统计汇总
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xl font-semibold text-[var(--color-text-primary)]">
                      {department.children?.length || 0}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">子部门</div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xl font-semibold text-[var(--color-text-primary)]">{positionCount}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">职位</div>
                  </div>
                  <div className="p-4 bg-[var(--color-surface-bg)] rounded-lg text-center">
                    <div className="text-xl font-semibold text-[var(--color-text-primary)]">{establishmentCount}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">编制</div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-6">
              {changeHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-[var(--color-text-secondary)]">
                  <Clock className="w-8 h-8 mb-2 opacity-50" />
                  <span className="text-sm">暂无变更记录</span>
                </div>
              ) : (
                <div className="space-y-4">
                  {changeHistory.map((record, index) => (
                    <div
                      key={record.id}
                      className={cn(
                        'relative pl-6 pb-4 border-l-2 border-[var(--color-border)]',
                        index === changeHistory.length - 1 && 'border-l-0'
                      )}
                    >
                      {/* 时间线节点 */}
                      <div className="absolute left-0 top-0 w-3 h-3 -translate-x-[7px] bg-white border-2 border-[var(--color-brand)] rounded-full" />

                      {/* 记录内容 */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded border',
                              getChangeTypeStyle(record.type)
                            )}
                          >
                            {record.type === 'info' && '信息'}
                            {record.type === 'position' && '职位'}
                            {record.type === 'establishment' && '编制'}
                          </span>
                          <span className="text-sm font-medium text-[var(--color-text-primary)]">
                            {record.content}
                          </span>
                        </div>
                        <div className="text-sm text-[var(--color-text-secondary)]">
                          {record.detail}
                        </div>
                        <div className="flex items-center gap-4 text-xs text-[var(--color-text-disabled)]">
                          <span>{record.operator}</span>
                          <span>{record.createdAt}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
};