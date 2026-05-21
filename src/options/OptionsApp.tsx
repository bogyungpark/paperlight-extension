import { useEffect, useState } from 'react';
import { useSettingsStore } from '@core/store/settingsStore';
import { useTheme } from '@ui/hooks/useTheme';
import { Logo } from '@ui/components/Logo';
import { cn } from '@ui/lib/cn';

const LANGUAGES = [
  'Korean',
  'English',
  'Japanese',
  'Chinese (Simplified)',
  'Spanish',
  'French',
  'German',
];

const URL_PRESETS = [
  { label: 'vLLM (default lab)', value: 'http://192.168.110.106:8001/v1' },
  { label: 'Ollama (local)', value: 'http://127.0.0.1:11434/v1' },
  { label: 'LM Studio (local)', value: 'http://127.0.0.1:1234/v1' },
];

const MODEL_PRESETS = [
  'Qwen/Qwen2.5-32B-Instruct-AWQ',
  'Qwen/Qwen2.5-72B-Instruct-AWQ',
  'casperhansen/llama-3.3-70b-instruct-awq',
  'qwen2.5:32b-instruct-q4_K_M',
];

export function OptionsApp() {
  const { settings, loaded, load, update } = useSettingsStore();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useTheme();
  useEffect(() => {
    void load();
  }, [load]);

  async function patch<K extends keyof typeof settings>(
    key: K,
    value: (typeof settings)[K],
  ) {
    await update({ [key]: value } as Partial<typeof settings>);
    setSavedAt(Date.now());
  }

  if (!loaded) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-fg-muted">
        Loading…
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paperlight Settings</h1>
          <p className="text-sm text-fg-muted">
            Paperlight talks to any OpenAI-compatible inference endpoint
            (vLLM, Ollama, LM Studio, …) on your network. Point it at one and
            give it the model name — that's it.
          </p>
        </div>
        {savedAt && (
          <span className="ml-auto chip animate-fade-in" key={savedAt}>
            Saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </header>

      <section className="card grid gap-5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
          Inference endpoint
        </h2>

        <Row label="Base URL">
          <input
            className="input font-mono"
            placeholder="http://192.168.110.106:8001/v1"
            value={settings.baseUrl}
            onChange={(e) => patch('baseUrl', e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </Row>
        <Row label="Presets">
          <div className="flex flex-wrap gap-2">
            {URL_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => patch('baseUrl', p.value)}
                className={cn(
                  'btn-outline text-xs',
                  settings.baseUrl === p.value &&
                    'border-accent bg-accent-subtle/40 text-fg',
                )}
                title={p.value}
              >
                {p.label}
              </button>
            ))}
          </div>
        </Row>

        <Row label="Model">
          <input
            className="input font-mono"
            placeholder="Qwen/Qwen2.5-32B-Instruct-AWQ"
            value={settings.model}
            onChange={(e) => patch('model', e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </Row>
        <Row label="Model presets">
          <div className="flex flex-wrap gap-2">
            {MODEL_PRESETS.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch('model', m)}
                className={cn(
                  'btn-outline font-mono text-[11px]',
                  settings.model === m &&
                    'border-accent bg-accent-subtle/40 text-fg',
                )}
                title={m}
              >
                {m}
              </button>
            ))}
          </div>
        </Row>

        <p className="rounded-lg border border-border bg-bg-subtle/60 px-3 py-2 text-[11px] leading-relaxed text-fg-muted">
          Use the exact id the server reports via
          <code className="mx-1 rounded bg-bg-subtle px-1 font-mono">GET {settings.baseUrl || '<base>'}/models</code>.
          For vLLM that's the Hugging Face repo
          (<code className="rounded bg-bg-subtle px-1 font-mono">Qwen/Qwen2.5-32B-Instruct-AWQ</code>);
          for Ollama it's the tag
          (<code className="rounded bg-bg-subtle px-1 font-mono">qwen2.5:32b-instruct-q4_K_M</code>).
        </p>
      </section>

      <section className="card grid gap-5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
          Preferences
        </h2>
        <Row label="Target language for translation">
          <select
            className="input"
            value={settings.targetLanguage}
            onChange={(e) => patch('targetLanguage', e.target.value)}
          >
            {LANGUAGES.map((l) => (
              <option key={l} value={l}>
                {l}
              </option>
            ))}
          </select>
        </Row>
        <Row label="Theme">
          <div className="flex gap-2">
            {(['system', 'light', 'dark'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => patch('theme', t)}
                className={cn(
                  'btn-outline flex-1 capitalize',
                  settings.theme === t && 'border-accent bg-accent-subtle/40 text-fg',
                )}
              >
                {t}
              </button>
            ))}
          </div>
        </Row>
      </section>

      <footer className="text-center text-xs text-fg-subtle">
        Paperlight · open source · MIT
      </footer>
    </div>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="grid grid-cols-1 gap-1.5 sm:grid-cols-[180px_1fr] sm:items-center sm:gap-4">
      <span className="text-sm text-fg-muted">{label}</span>
      <div>{children}</div>
    </label>
  );
}
