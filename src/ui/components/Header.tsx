import { Logo } from './Logo';
import { useTheme } from '@ui/hooks/useTheme';
import { useChatStore } from '@core/store/chatStore';
import { cn } from '@ui/lib/cn';

export function Header() {
  const { theme, setTheme } = useTheme();
  const reset = useChatStore((s) => s.reset);
  const hasMessages = useChatStore((s) => s.messages.length > 0);

  const next = theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark';

  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-bg/80 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Logo className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight">Paperlight</span>
        <span className="chip">beta</span>
      </div>
      <div className="flex items-center gap-1">
        {hasMessages && (
          <button
            type="button"
            className="btn-ghost px-2"
            onClick={() => reset()}
            title="Clear conversation"
          >
            <ClearIcon />
          </button>
        )}
        <button
          type="button"
          className={cn('btn-ghost px-2')}
          onClick={() => setTheme(next)}
          title={`Theme: ${theme} → ${next}`}
        >
          {theme === 'dark' ? <MoonIcon /> : theme === 'light' ? <SunIcon /> : <MonitorIcon />}
        </button>
        <button
          type="button"
          className="btn-ghost px-2"
          title="Open options"
          onClick={() => chrome.runtime?.openOptionsPage?.()}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
  );
}

function ClearIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    </svg>
  );
}

function SunIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}
function MoonIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
      <path d="M21 12.8A9 9 0 1 1 11.2 3 7 7 0 0 0 21 12.8Z" />
    </svg>
  );
}
function MonitorIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  );
}
function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.7 1.7 0 0 0 .34 1.87l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.7 1.7 0 0 0-1.87-.34 1.7 1.7 0 0 0-1.03 1.56V21a2 2 0 1 1-4 0v-.09a1.7 1.7 0 0 0-1.11-1.56 1.7 1.7 0 0 0-1.87.34l-.06.06A2 2 0 1 1 4.13 16.93l.06-.06a1.7 1.7 0 0 0 .34-1.87 1.7 1.7 0 0 0-1.56-1.03H3a2 2 0 1 1 0-4h.09A1.7 1.7 0 0 0 4.65 8.9a1.7 1.7 0 0 0-.34-1.87l-.06-.06A2 2 0 1 1 7.07 4.13l.06.06a1.7 1.7 0 0 0 1.87.34H9a1.7 1.7 0 0 0 1.03-1.56V3a2 2 0 1 1 4 0v.09a1.7 1.7 0 0 0 1.03 1.56 1.7 1.7 0 0 0 1.87-.34l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.7 1.7 0 0 0-.34 1.87V9c.04.61.4 1.16.96 1.39H21a2 2 0 1 1 0 4h-.09c-.7.04-1.31.4-1.51.99Z" />
    </svg>
  );
}
