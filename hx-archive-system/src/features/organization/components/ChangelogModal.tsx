import { X, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';

interface ChangelogModalProps {
  open: boolean;
  onClose: () => void;
}

// 优化记录数据
const changelogItems = [
  {
    date: '2026-06-15',
    module: '部门档案',
    changes: [
      { type: 'feature', text: '编制汇总数据联动', status: 'completed' },
      { type: 'feature', text: '上级部门跳转高亮并重置Tab', status: 'completed' },
    ],
  },
  {
    date: '2026-06-15',
    module: '职位管理',
    changes: [
      { type: 'feature', text: '职位说明字段展示', status: 'completed' },
    ],
  },
  {
    date: '2026-06-15',
    module: '部门管理',
    changes: [
      { type: 'feature', text: '搜索功能', status: 'completed' },
    ],
  },
  {
    date: '2026-06-11',
    module: '部门档案',
    changes: [
      { type: 'fix', text: '上级部门跳转未实现', status: 'completed' },
      { type: 'fix', text: '变动记录没有分页', status: 'completed' },
      { type: 'feature', text: '变更记录模拟数据', status: 'completed' },
    ],
  },
  {
    date: '2026-06-11',
    module: '职位管理',
    changes: [
      { type: 'fix', text: '职位新增后列表不更新', status: 'completed' },
      { type: 'feature', text: '在职员工数字段', status: 'completed' },
      { type: 'feature', text: '职位说明字段', status: 'completed' },
    ],
  },
  {
    date: '2026-06-10',
    module: '部门管理',
    changes: [
      { type: 'feature', text: '搜索框遮挡UI修复', status: 'completed' },
      { type: 'feature', text: 'Tab内容高度稳定', status: 'completed' },
      { type: 'fix', text: '创建时间显示Invalid Date', status: 'completed' },
      { type: 'fix', text: '父部门导航异常', status: 'completed' },
    ],
  },
  {
    date: '2026-06-10',
    module: '编制管理',
    changes: [
      { type: 'feature', text: '双击单元格编辑', status: 'completed' },
      { type: 'feature', text: '批量调整模式', status: 'completed' },
      { type: 'feature', text: '新增编制弹窗', status: 'completed' },
    ],
  },
];

const renderStatusIcon = (status: string) => {
  switch (status) {
    case 'completed':
      return <CheckCircle className="w-4 h-4 text-green-500" />;
    case 'in_progress':
      return <Clock className="w-4 h-4 text-orange-500" />;
    case 'pending':
      return <AlertCircle className="w-4 h-4 text-gray-400" />;
    default:
      return null;
  }
};

const renderTypeBadge = (type: string) => {
  switch (type) {
    case 'feature':
      return <Badge variant="neutral" className="bg-blue-100 text-blue-700">新增</Badge>;
    case 'fix':
      return <Badge variant="neutral" className="bg-red-100 text-red-700">修复</Badge>;
    case 'optimize':
      return <Badge variant="neutral" className="bg-purple-100 text-purple-700">优化</Badge>;
    default:
      return null;
  }
};

export const ChangelogModal = ({ open, onClose }: ChangelogModalProps) => {
  if (!open) return null;

  // 按日期分组
  const groupedByDate = changelogItems.reduce((acc, item) => {
    if (!acc[item.date]) {
      acc[item.date] = [];
    }
    acc[item.date].push(item);
    return acc;
  }, {} as Record<string, typeof changelogItems>);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* 遮罩 */}
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />

      {/* 弹窗 */}
      <div className="relative w-[800px] max-h-[80vh] bg-[var(--color-surface-card)] rounded-lg shadow-xl flex flex-col">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <FileText className="w-5 h-5 text-[var(--color-brand)]" />
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">开发优化记录</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* 内容 */}
        <div className="flex-1 overflow-auto p-6">
          {Object.entries(groupedByDate).map(([date, items]) => (
            <div key={date} className="mb-6">
              <div className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">{date}</div>
              <div className="space-y-4">
                {items.map((item, idx) => (
                  <Card key={idx}>
                    <CardBody className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="neutral" className="bg-[var(--color-brand-light)] text-[var(--color-brand)]">
                          {item.module}
                        </Badge>
                      </div>
                      <div className="space-y-2">
                        {item.changes.map((change, cIdx) => (
                          <div key={cIdx} className="flex items-center gap-3">
                            {renderStatusIcon(change.status)}
                            {renderTypeBadge(change.type)}
                            <span className="text-sm text-[var(--color-text-primary)]">{change.text}</span>
                          </div>
                        ))}
                      </div>
                    </CardBody>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-[var(--color-border)]">
          <Button variant="secondary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
};