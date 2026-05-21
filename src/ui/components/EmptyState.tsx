import { useSettingsStore } from '@core/store/settingsStore';

export function EmptyState() {
  const settings = useSettingsStore((s) => s.settings);
  const loaded = useSettingsStore((s) => s.loaded);
  const missing = loaded && (!settings.baseUrl.trim() || !settings.model.trim());

  return (
    <div className="flex h-full flex-col items-center justify-center px-6 py-12 text-center">
      <div className="mb-4 grid h-14 w-14 place-items-center rounded-2xl bg-accent-subtle text-accent">
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M4 5a2 2 0 0 1 2-2h9l5 5v11a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" />
          <path d="M14 3v6h6" />
          <path d="M9 12h7M9 16h5" />
        </svg>
      </div>
      <h2 className="text-base font-semibold text-fg">Open a research paper</h2>
      <p className="mt-1.5 max-w-[280px] text-sm text-fg-muted">
        Drop any PDF into Chrome — Paperlight will detect it and unlock AI-powered explanation,
        translation, summary, and chat.
      </p>

      {missing && (
        <div className="mt-5 w-full max-w-[300px] rounded-xl border border-warning/40 bg-warning/10 px-3 py-2.5 text-left animate-fade-in">
          <p className="text-xs font-semibold text-warning">
            Inference endpoint not configured
          </p>
          <p className="mt-1 text-[11px] leading-relaxed text-fg-muted">
            Open the settings page and fill in the base URL + model name of
            your self-hosted server (vLLM / Ollama / LM Studio).
          </p>
          <button
            type="button"
            className="btn-primary mt-2 w-full"
            onClick={() => chrome.runtime?.openOptionsPage?.()}
          >
            Open settings
          </button>
        </div>
      )}

      <div className="mt-6 grid w-full max-w-[300px] gap-2 text-left">
        <Hint k="⌘⇧L" label="Toggle side panel" />
        <Hint k="⌘⇧E" label="Explain selection" />
        <Hint k="Drag" label="Select any text to act on it" />
      </div>
    </div>
  );
}

function Hint({ k, label }: { k: string; label: string }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-bg-elevated px-3 py-2 text-xs">
      <span className="text-fg-muted">{label}</span>
      <kbd className="rounded border border-border bg-bg-subtle px-1.5 py-0.5 font-mono text-[11px] text-fg">
        {k}
      </kbd>
    </div>
  );
}
