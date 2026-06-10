import { useLocation, Link } from 'react-router-dom';
import { ChevronRightIcon, BellIcon, HelpCircleIcon } from 'lucide-react';
import { useAuthStore } from '@/store';

interface AppHeaderProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

const routeTitles: Record<string, string> = {
  '/archive': '人员档案',
  '/salary': '薪资档案',
  '/settings/permission': '权限配置',
};

export function AppHeader(_props: AppHeaderProps) {
  const location = useLocation();
  const { currentUser } = useAuthStore();

  const getBreadcrumb = () => {
    const path = location.pathname;
    const title = Object.entries(routeTitles).find(([key]) =>
      path.startsWith(key)
    )?.[1] || '页面';

    return [{ title, path }];
  };

  const breadcrumb = getBreadcrumb();

  return (
    <header className="h-14 bg-[var(--color-surface-card)] border-b border-[var(--color-border)] flex items-center justify-between px-4">
      {/* 左侧：面包屑 */}
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
        >
          首页
        </Link>
        {breadcrumb.map((item, index) => (
          <span key={index} className="flex items-center gap-2">
            <ChevronRightIcon className="w-4 h-4 text-[var(--color-text-disabled)]" />
            <span
              className={
                index === breadcrumb.length - 1
                  ? 'text-[var(--color-text-primary)] font-medium'
                  : 'text-[var(--color-text-secondary)]'
              }
            >
              {item.title}
            </span>
          </span>
        ))}
      </div>

      {/* 右侧：用户信息 */}
      <div className="flex items-center gap-3">
        <button className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-bg)] transition-colors">
          <HelpCircleIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
        </button>
        <button className="p-2 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-bg)] transition-colors relative">
          <BellIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--color-status-danger)] rounded-full" />
        </button>

        <div className="w-px h-6 bg-[var(--color-border)] mx-1" />

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--color-brand)] text-white flex items-center justify-center text-sm font-medium">
            {currentUser?.name?.charAt(0) || '用'}
          </div>
          <div className="text-sm">
            <p className="font-medium text-[var(--color-text-primary)]">
              {currentUser?.name || '默认用户'}
            </p>
            <p className="text-[11px] text-[var(--color-text-disabled)]">
              {currentUser?.role === 'system_admin'
                ? '系统管理员'
                : currentUser?.role === 'hr_admin'
                ? 'HR管理员'
                : '普通员工'}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
}