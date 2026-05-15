import { useEffect } from 'react';
import { Header } from '@ui/components/Header';
import { EmptyState } from '@ui/components/EmptyState';

export function SidePanelApp() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  return (
    <div className="flex h-full flex-col bg-bg text-fg">
      <Header />
      <main className="flex-1 overflow-y-auto">
        <EmptyState />
      </main>
    </div>
  );
}
