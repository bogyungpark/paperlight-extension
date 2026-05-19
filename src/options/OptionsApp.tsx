import { useEffect, useState } from 'react';
import { useSettingsStore } from '@core/store/settingsStore';
import { useTheme } from '@ui/hooks/useTheme';
import type { ProviderId } from '@core/types';
import { Logo } from '@ui/components/Logo';
import { cn } from '@ui/lib/cn';

const PROVIDER_LABELS: Array<{ id: ProviderId; label: string; tagline: string }> = [
  { id: 'openai', label: 'OpenAI', tagline: 'GPT-4o family' },
  { id: 'anthropic', label: 'Anthropic', tagline: 'Claude 4.x family' },
  { id: 'gemini', label: 'Gemini', tagline: 'Google AI Studio' },
];

const LANGUAGES = ['Korean', 'English', 'Japanese', 'Chinese (Simplified)', 'Spanish', 'French', 'German'];

export function OptionsApp() {
  const { settings, loaded, load, update } = useSettingsStore();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  useTheme();
  useEffect(() => {
    void load();
  }, [load]);

  async function patch<K extends keyof typeof settings>(key: K, value: (typeof settings)[K]) {
    await update({ [key]: value } as Partial<typeof settings>);
    setSavedAt(Date.now());
  }

  if (!loaded) {
    return <div className="grid min-h-screen place-items-center text-sm text-fg-muted">Loading…</div>;
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-3xl flex-col gap-8 px-6 py-12">
      <header className="flex items-center gap-3">
        <Logo className="h-8 w-8 text-accent" />
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Paperlight Settings</h1>
          <p className="text-sm text-fg-muted">
            Keys are stored locally in <code className="rounded bg-bg-subtle px-1 font-mono">chrome.storage.local</code> and
            never leave your browser except to call the selected AI provider directly.
          </p>
        </div>
        {savedAt && (
          <span className="ml-auto chip animate-fade-in" key={savedAt}>
            Saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </header>

      <section className="card p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-fg-muted">Provider</h2>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
          {PROVIDER_LABELS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => patch('provider', p.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors',
                settings.provider === p.id
                  ? 'border-accent bg-accent-subtle/40 shadow-glow'
                  : 'border-border bg-bg-elevated hover:border-border-strong',
              )}
            >
              <span className="text-sm font-semibold">{p.label}</span>
              <span className="text-xs text-fg-muted">{p.tagline}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="card grid gap-5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">API keys</h2>
        <KeyField
          label="OpenAI API key"
          placeholder="sk-… (leave blank when using a local server below)"
          value={settings.openaiKey}
          onChange={(v) => patch('openaiKey', v)}
        />
        <KeyField
          label="Anthropic API key"
          placeholder="sk-ant-..."
          value={settings.anthropicKey}
          onChange={(v) => patch('anthropicKey', v)}
        />
        <KeyField
          label="Gemini API key"
          placeholder="AIza..."
          value={settings.geminiKey}
          onChange={(v) => patch('geminiKey', v)}
        />
      </section>

      <section className="card grid gap-5 p-5">
        <header>
          <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
            Local / self-hosted server
          </h2>
          <p className="mt-1 text-xs text-fg-muted">
            Point Paperlight at any OpenAI-compatible endpoint (Ollama, vLLM, LM Studio, …).
            Pick provider <code className="rounded bg-bg-subtle px-1 font-mono">OpenAI</code> above,
            then fill the base URL + the model name as it appears on the server.
            See <a className="text-accent hover:underline" href="https://github.com/bogyungpark/paperlight-extension/blob/main/docs/LOCAL_LLM.md" target="_blank" rel="noreferrer">docs/LOCAL_LLM.md</a>.
          </p>
        </header>
        <Row label="OpenAI base URL">
          <input
            className="input font-mono"
            placeholder="http://192.168.110.110:11434/v1"
            value={settings.openaiBaseUrl}
            onChange={(e) => patch('openaiBaseUrl', e.target.value)}
            spellCheck={false}
            autoComplete="off"
          />
        </Row>
        <p className="text-[11px] text-fg-subtle">
          Common values: <code className="rounded bg-bg-subtle px-1 font-mono">http://&lt;host&gt;:11434/v1</code> (Ollama) ·
          <code className="ml-1 rounded bg-bg-subtle px-1 font-mono">http://&lt;host&gt;:8000/v1</code> (vLLM / LM Studio).
          Empty = official OpenAI API.
        </p>
      </section>

      <section className="card grid gap-5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">Models</h2>
        <Row label="OpenAI model">
          <input
            className="input"
            value={settings.openaiModel}
            onChange={(e) => patch('openaiModel', e.target.value)}
          />
        </Row>
        <Row label="Anthropic model">
          <input
            className="input"
            value={settings.anthropicModel}
            onChange={(e) => patch('anthropicModel', e.target.value)}
          />
        </Row>
        <Row label="Gemini model">
          <input
            className="input"
            value={settings.geminiModel}
            onChange={(e) => patch('geminiModel', e.target.value)}
          />
        </Row>
      </section>

      <section className="card grid gap-5 p-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">Preferences</h2>
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

function KeyField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <Row label={label}>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          autoComplete="off"
          spellCheck={false}
          className="input font-mono"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
        <button
          type="button"
          className="btn-outline px-2"
          onClick={() => setVisible((v) => !v)}
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </Row>
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
