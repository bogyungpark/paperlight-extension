import { useEffect } from 'react';
import { useSettingsStore } from '@core/store/settingsStore';

type Theme = 'system' | 'light' | 'dark';

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches ?? true;
  const effective = theme === 'system' ? (prefersDark ? 'dark' : 'light') : theme;
  if (effective === 'dark') root.classList.add('dark');
  else root.classList.remove('dark');
}

export function useTheme() {
  const theme = useSettingsStore((s) => s.settings.theme);
  const loaded = useSettingsStore((s) => s.loaded);
  const update = useSettingsStore((s) => s.update);

  useEffect(() => {
    if (!loaded) return;
    applyTheme(theme);
    if (theme !== 'system') return;
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = () => applyTheme('system');
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, [theme, loaded]);

  return {
    theme,
    setTheme: (t: Theme) => update({ theme: t }),
  };
}
