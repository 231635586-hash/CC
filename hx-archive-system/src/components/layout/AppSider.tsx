import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  UsersIcon,
  SettingsIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ClipboardCheckIcon,
  BuildingIcon,
  ListIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AppSiderProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
}

interface SubMenuItem {
  key: string;
  label: string;
  path: string;
}

interface MenuItem {
  key: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  path?: string;
  children?: SubMenuItem[];
}

const menuItems: MenuItem[] = [
  {
    key: 'organization',
    label: '组织管理',
    icon: BuildingIcon,
    children: [
      { key: 'department', label: '部门管理', path: '/organization/department' },
      { key: 'position', label: '职位管理', path: '/organization/position' },
      { key: 'headcount', label: '编制管理', path: '/organization/headcount' },
    ],
  },
  {
    key: 'employee',
    label: '员工档案',
    icon: UsersIcon,
    children: [
      { key: 'personnel', label: '人员档案', path: '/archive' },
      { key: 'salary', label: '薪资档案', path: '/salary' },
      { key: 'salary-template', label: '薪资模版', path: '/salary-template' },
    ],
  },
  {
    key: 'report-work',
    label: '报工管理',
    icon: ClipboardCheckIcon,
    children: [
      { key: 'report-record', label: '报工记录', path: '/report-work' },
      { key: 'report-approve', label: '报工审批', path: '/report-work/approve' },
    ],
  },
  {
    key: 'settings',
    label: '系统管理',
    icon: SettingsIcon,
    path: '/settings/permission',
  },
];

export function AppSider({ collapsed, onCollapsedChange }: AppSiderProps) {
  const location = useLocation();
  // 默认全部展开
  const [expandedKeys, setExpandedKeys] = useState<string[]>(['organization', 'employee', 'report-work']);

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const isParentActive = (item: MenuItem) => {
    if (item.children) {
      // 使用精确匹配，避免 /employee/salary-template 匹配到 /employee/salary
      return item.children.some(child => location.pathname === child.path);
    }
    return item.path ? isActive(item.path) : false;
  };

  const handleParentClick = (item: MenuItem) => {
    if (collapsed) {
      onCollapsedChange(false);
    }
    if (item.children) {
      setExpandedKeys(prev =>
        prev.includes(item.key) ? prev.filter(k => k !== item.key) : [...prev, item.key]
      );
    }
  };

  return (
    <aside
      className={cn(
        'h-full bg-[var(--color-surface-card)] border-r border-[var(--color-border)] flex flex-col transition-all duration-200',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo区域 */}
      <div className="h-14 flex items-center justify-between px-4 border-b border-[var(--color-border)]">
        {!collapsed && (
          <span className="font-semibold text-[var(--color-brand)]">华翔档案</span>
        )}
        <button
          onClick={() => onCollapsedChange(!collapsed)}
          className="p-1.5 rounded-[var(--radius-md)] hover:bg-[var(--color-surface-bg)] transition-colors"
        >
          {collapsed ? (
            <ChevronRightIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          ) : (
            <ChevronLeftIcon className="w-5 h-5 text-[var(--color-text-secondary)]" />
          )}
        </button>
      </div>

      {/* 菜单 */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isParentActive(item);
          const hasChildren = item.children && item.children.length > 0;
          const isExpanded = expandedKeys.includes(item.key);

          return (
            <div key={item.key}>
              {hasChildren && !collapsed ? (
                // 有子菜单的父级
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[var(--radius-md)] cursor-pointer transition-all duration-150',
                    active
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)] hover:text-[var(--color-text-primary)]'
                  )}
                  onClick={() => handleParentClick(item)}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-[var(--color-brand)]')} />
                  <span className="flex-1">{item.label}</span>
                  <ChevronRightIcon className={cn('w-4 h-4 transition-transform', isExpanded && 'rotate-90')} />
                </div>
              ) : hasChildren && collapsed ? (
                // 折叠状态下的父级菜单
                <div
                  className={cn(
                    'flex items-center justify-center mx-2 my-1 rounded-[var(--radius-md)] p-2.5 cursor-pointer transition-all duration-150',
                    active
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)] hover:text-[var(--color-text-primary)]'
                  )}
                  onClick={() => handleParentClick(item)}
                  title={item.label}
                >
                  <Icon className={cn('w-5 h-5', active && 'text-[var(--color-brand)]')} />
                </div>
              ) : item.path ? (
                // 没有子菜单的项
                <Link
                  to={item.path}
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[var(--radius-md)] transition-all duration-150',
                    active
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)] hover:text-[var(--color-text-primary)]'
                  )}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-[var(--color-brand)]')} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              ) : (
                // 没有路径的父级（点击展开子菜单）
                <div
                  className={cn(
                    'flex items-center gap-3 px-4 py-2.5 mx-2 rounded-[var(--radius-md)] cursor-pointer transition-all duration-150',
                    active
                      ? 'bg-[var(--color-brand-light)] text-[var(--color-brand)] font-medium'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)] hover:text-[var(--color-text-primary)]'
                  )}
                  onClick={() => handleParentClick(item)}
                >
                  <Icon className={cn('w-5 h-5 flex-shrink-0', active && 'text-[var(--color-brand)]')} />
                  {!collapsed && <span>{item.label}</span>}
                </div>
              )}

              {/* 子菜单 */}
              {hasChildren && !collapsed && isExpanded && (
                <div className="ml-6 mt-1 space-y-1">
                  {item.children?.map(child => {
                    const childActive = location.pathname.startsWith(child.path);
                    return (
                      <Link
                        key={child.key}
                        to={child.path}
                        className={cn(
                          'flex items-center gap-2 px-4 py-2 rounded-[var(--radius-md)] text-sm transition-all duration-150',
                          childActive
                            ? 'bg-[var(--color-brand)] text-white font-medium'
                            : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-surface-bg)] hover:text-[var(--color-text-primary)]'
                        )}
                      >
                        <ListIcon className="w-4 h-4" />
                        <span>{child.label}</span>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      {/* 底部信息 */}
      {!collapsed && (
        <div className="p-4 border-t border-[var(--color-border)]">
          <p className="text-[11px] text-[var(--color-text-disabled)]">华翔人员档案管理系统</p>
          <p className="text-[11px] text-[var(--color-text-disabled)]">v1.0.0</p>
        </div>
      )}
    </aside>
  );
}