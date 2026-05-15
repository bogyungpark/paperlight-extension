import { useEffect } from 'react';

export function ViewerApp() {
  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);
  return (
    <div className="grid min-h-screen place-items-center bg-bg text-fg">
      <div className="text-center">
        <p className="text-sm text-fg-muted">Paperlight viewer — implemented in STEP 2.</p>
      </div>
    </div>
  );
}
