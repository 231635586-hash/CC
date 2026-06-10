import { useState } from 'react';
import { cn } from '@/lib/utils';

export interface TabItem {
  key: string;
  label: string;
  content: React.ReactNode;
}

interface TabProps {
  items: TabItem[];
  defaultActiveKey?: string;
  activeKey?: string;
  onChange?: (key: string) => void;
  className?: string;
}

export function Tab({
  items,
  defaultActiveKey,
  activeKey: controlledActiveKey,
  onChange,
  className,
}: TabProps) {
  const [internalActiveKey, setInternalActiveKey] = useState(
    defaultActiveKey || items[0]?.key
  );

  const activeKey = controlledActiveKey ?? internalActiveKey;

  const handleChange = (key: string) => {
    if (controlledActiveKey === undefined) {
      setInternalActiveKey(key);
    }
    onChange?.(key);
  };

  return (
    <div className={cn('flex flex-col', className)}>
      {/* Tab 标签头 */}
      <div className="tab-list">
        {items.map((item) => {
          const isActive = item.key === activeKey;
          return (
            <button
              key={item.key}
              onClick={() => handleChange(item.key)}
              className={cn('tab-item', isActive && 'tab-item--active')}
            >
              {item.label}
            </button>
          );
        })}
      </div>

      {/* Tab 内容 */}
      <div className="py-4">
        {items.find((item) => item.key === activeKey)?.content}
      </div>
    </div>
  );
}

// TabPanel - 单个 Tab 面板
interface TabPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function TabPanel({ children, className }: TabPanelProps) {
  return <div className={className}>{children}</div>;
}