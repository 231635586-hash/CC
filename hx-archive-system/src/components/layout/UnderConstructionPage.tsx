import { ConstructionIcon } from 'lucide-react';

interface UnderConstructionPageProps {
  title?: string;
}

export function UnderConstructionPage({ title }: UnderConstructionPageProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[400px]">
      <div className="w-16 h-16 rounded-full bg-surface-bg flex items-center justify-center mb-4">
        <ConstructionIcon className="w-8 h-8 text-text-disabled" />
      </div>
      <h2 className="text-lg font-medium text-text-primary mb-2">
        {title || '页面建设中'}
      </h2>
      <p className="text-sm text-text-secondary">
        该功能正在开发中，敬请期待
      </p>
    </div>
  );
}