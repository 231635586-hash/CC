interface PageContainerProps {
  children: React.ReactNode;
}

export function PageContainer({ children }: PageContainerProps) {
  return (
    <main className="flex-1 overflow-auto p-6 bg-surface-bg">
      {children}
    </main>
  );
}