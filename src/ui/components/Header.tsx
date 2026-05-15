import { Logo } from './Logo';

export function Header() {
  return (
    <header className="sticky top-0 z-10 flex h-12 items-center justify-between border-b border-border bg-bg/80 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <Logo className="h-5 w-5 text-accent" />
        <span className="text-sm font-semibold tracking-tight">Paperlight</span>
        <span className="chip">beta</span>
      </div>
      <div className="flex items-center gap-1">
        <button
          className="btn-ghost"
          title="Open options"
          onClick={() => chrome.runtime.openOptionsPage?.()}
        >
          <SettingsIcon />
        </button>
      </div>
    </header>
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
