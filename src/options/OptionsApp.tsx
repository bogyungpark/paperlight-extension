import { useEffect, useState } from 'react';
import { useSettingsStore } from '@core/store/settingsStore';
import { useTheme } from '@ui/hooks/useTheme';
import { Logo } from '@ui/components/Logo';
import { cn } from '@ui/lib/cn';
import {
  CLOUD_PROVIDER_META,
  type CloudProviderId,
  type Mode,
  type Settings,
} from '@core/types';

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

const LOCAL_MODEL_PRESETS = [
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

  async function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    await update({ [key]: value } as Partial<Settings>);
    setSavedAt(Date.now());
  }

  async function patchCloud(provider: CloudProviderId, patch: Partial<{ apiKey: string; model: string }>) {
    const next = {
      ...settings.cloud,
      [provider]: { ...settings.cloud[provider], ...patch },
    };
    await update({ cloud: next });
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
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">Paperlight Settings</h1>
          <p className="text-sm text-fg-muted">
            Pick how Paperlight reaches its LLM — your own server, or a managed
            cloud provider.
          </p>
        </div>
        {savedAt && (
          <span className="chip animate-fade-in" key={savedAt}>
            Saved {new Date(savedAt).toLocaleTimeString()}
          </span>
        )}
      </header>

      <ModeTabs mode={settings.mode} onChange={(m) => patch('mode', m)} />

      {settings.mode === 'local' ? (
        <SelfHostedSection
          settings={settings}
          onBaseUrl={(v) => patch('localBaseUrl', v)}
          onModel={(v) => patch('localModel', v)}
        />
      ) : (
        <CloudSection
          settings={settings}
          onProvider={(p) => patch('cloudProvider', p)}
          onCloudPatch={patchCloud}
        />
      )}

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

function ModeTabs({ mode, onChange }: { mode: Mode; onChange: (m: Mode) => void }) {
  const tabs: Array<{ id: Mode; label: string; hint: string }> = [
    { id: 'local', label: 'Self-hosted server', hint: 'vLLM · Ollama · LM Studio' },
    { id: 'cloud', label: 'Cloud API', hint: 'OpenAI · Anthropic · Gemini' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2 rounded-xl border border-border bg-bg-subtle/40 p-1">
      {tabs.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            'flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition-colors',
            mode === t.id
              ? 'bg-bg-elevated shadow-panel text-fg'
              : 'text-fg-muted hover:bg-bg-elevated/60 hover:text-fg',
          )}
        >
          <span className="flex items-center gap-2 text-sm font-semibold">
            {t.label}
            {mode === t.id && (
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-accent animate-pulse-soft" />
            )}
          </span>
          <span className="text-[11px] text-fg-subtle">{t.hint}</span>
        </button>
      ))}
    </div>
  );
}

function SelfHostedSection({
  settings,
  onBaseUrl,
  onModel,
}: {
  settings: Settings;
  onBaseUrl: (v: string) => void;
  onModel: (v: string) => void;
}) {
  return (
    <section className="card grid gap-5 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
        Self-hosted endpoint
      </h2>

      <Row label="Base URL">
        <input
          className="input font-mono"
          placeholder="http://192.168.110.106:8001/v1"
          value={settings.localBaseUrl}
          onChange={(e) => onBaseUrl(e.target.value)}
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
              onClick={() => onBaseUrl(p.value)}
              className={cn(
                'btn-outline text-xs',
                settings.localBaseUrl === p.value &&
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
          value={settings.localModel}
          onChange={(e) => onModel(e.target.value)}
          spellCheck={false}
          autoComplete="off"
        />
      </Row>
      <Row label="Model presets">
        <div className="flex flex-wrap gap-2">
          {LOCAL_MODEL_PRESETS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onModel(m)}
              className={cn(
                'btn-outline font-mono text-[11px]',
                settings.localModel === m &&
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
        <code className="mx-1 rounded bg-bg-subtle px-1 font-mono">
          GET {settings.localBaseUrl || '<base>'}/models
        </code>
        . For vLLM that's the Hugging Face repo
        (<code className="rounded bg-bg-subtle px-1 font-mono">Qwen/Qwen2.5-32B-Instruct-AWQ</code>);
        for Ollama it's the tag
        (<code className="rounded bg-bg-subtle px-1 font-mono">qwen2.5:32b-instruct-q4_K_M</code>).
      </p>
    </section>
  );
}

function CloudSection({
  settings,
  onProvider,
  onCloudPatch,
}: {
  settings: Settings;
  onProvider: (p: CloudProviderId) => void;
  onCloudPatch: (p: CloudProviderId, patch: Partial<{ apiKey: string; model: string }>) => void;
}) {
  const active = settings.cloudProvider;
  const meta = CLOUD_PROVIDER_META[active];
  const conf = settings.cloud[active];
  const [revealKey, setRevealKey] = useState(false);

  // Re-hide the key whenever the active provider changes.
  useEffect(() => {
    setRevealKey(false);
  }, [active]);

  return (
    <section className="card grid gap-5 p-5">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-fg-muted">
        Cloud provider
      </h2>

      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        {(Object.values(CLOUD_PROVIDER_META) as Array<typeof meta>).map((p) => {
          const filled = !!settings.cloud[p.id]?.apiKey;
          return (
            <button
              key={p.id}
              type="button"
              onClick={() => onProvider(p.id)}
              className={cn(
                'flex flex-col items-start gap-1 rounded-xl border px-3 py-2.5 text-left transition-colors',
                active === p.id
                  ? 'border-accent bg-accent-subtle/40 shadow-glow'
                  : 'border-border bg-bg-elevated hover:border-border-strong',
              )}
            >
              <span className="flex w-full items-center justify-between text-sm font-semibold">
                {p.label}
                {filled && (
                  <span
                    className="h-1.5 w-1.5 rounded-full bg-success"
                    title="API key saved"
                  />
                )}
              </span>
              <span className="text-xs text-fg-muted">{p.tagline}</span>
            </button>
          );
        })}
      </div>

      <Row label={`${meta.label} API key`}>
        <div className="flex gap-2">
          <input
            type={revealKey ? 'text' : 'password'}
            autoComplete="off"
            spellCheck={false}
            className="input font-mono"
            placeholder={meta.keyPlaceholder}
            value={conf.apiKey}
            onChange={(e) => onCloudPatch(active, { apiKey: e.target.value })}
          />
          <button
            type="button"
            className="btn-outline px-2 text-xs"
            onClick={() => setRevealKey((v) => !v)}
            title={revealKey ? 'Hide' : 'Show'}
          >
            {revealKey ? 'Hide' : 'Show'}
          </button>
        </div>
      </Row>

      <Row label={`${meta.label} model`}>
        <input
          className="input font-mono"
          placeholder={meta.modelPlaceholder}
          value={conf.model}
          onChange={(e) => onCloudPatch(active, { model: e.target.value })}
          spellCheck={false}
          autoComplete="off"
        />
      </Row>
      <Row label="Model presets">
        <div className="flex flex-wrap gap-2">
          {meta.modelPresets.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onCloudPatch(active, { model: m })}
              className={cn(
                'btn-outline font-mono text-[11px]',
                conf.model === m && 'border-accent bg-accent-subtle/40 text-fg',
              )}
              title={m}
            >
              {m}
            </button>
          ))}
        </div>
      </Row>

      <p className="rounded-lg border border-border bg-bg-subtle/60 px-3 py-2 text-[11px] leading-relaxed text-fg-muted">
        Keys stay in
        <code className="mx-1 rounded bg-bg-subtle px-1 font-mono">chrome.storage.local</code>
        and are sent only to {meta.label}'s API directly from your browser.
        Don't have a key?{' '}
        <a
          href={meta.keyDocsUrl}
          target="_blank"
          rel="noreferrer"
          className="text-accent hover:underline"
        >
          Get one here ↗
        </a>
        .
      </p>
    </section>
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
