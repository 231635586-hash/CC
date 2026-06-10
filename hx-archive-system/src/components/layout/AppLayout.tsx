import { useState } from 'react';
import { AppSider } from './AppSider';
import { AppHeader } from './AppHeader';
import { PageContainer } from './PageContainer';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-full">
      {/*侧边栏 */}
      <AppSider collapsed={collapsed} onCollapsedChange={setCollapsed} />

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <AppHeader collapsed={collapsed} onCollapsedChange={setCollapsed} />
        <PageContainer>{children}</PageContainer>
      </div>
    </div>
  );
}