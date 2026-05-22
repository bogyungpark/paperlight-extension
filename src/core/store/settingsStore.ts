import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Settings } from '../types';

const STORAGE_KEY = 'paperlight:settings';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

/**
 * Merge a `chrome.storage.local` payload with `DEFAULT_SETTINGS`, tolerating
 * older snapshots that predate the tabbed (mode-based) layout. We accept the
 * old field names (`baseUrl`, `model`, `openaiKey`, etc.) and copy them into
 * the new slots so users don't have to re-enter anything after an upgrade.
 */
function migrate(stored: Record<string, unknown>): Settings {
  const next: Settings = {
    ...DEFAULT_SETTINGS,
    cloud: { ...DEFAULT_SETTINGS.cloud },
  };

  // Direct fields — covers the post-tab layout.
  for (const k of Object.keys(next) as Array<keyof Settings>) {
    if (k in stored) {
      // @ts-expect-error indexed write
      next[k] = stored[k];
    }
  }
  if (stored.cloud && typeof stored.cloud === 'object') {
    next.cloud = { ...DEFAULT_SETTINGS.cloud, ...(stored.cloud as object) } as Settings['cloud'];
  }

  // Legacy v1.0 self-hosted-only fields (`baseUrl`, `model`).
  if (typeof stored.baseUrl === 'string' && !('localBaseUrl' in stored)) {
    next.localBaseUrl = stored.baseUrl;
  }
  if (typeof stored.model === 'string' && !('localModel' in stored)) {
    next.localModel = stored.model;
  }

  // Legacy multi-provider snapshot (pre-tab layout).
  if (typeof stored.openaiKey === 'string') {
    next.cloud.openai.apiKey = stored.openaiKey;
  }
  if (typeof stored.anthropicKey === 'string') {
    next.cloud.anthropic.apiKey = stored.anthropicKey;
  }
  if (typeof stored.geminiKey === 'string') {
    next.cloud.gemini.apiKey = stored.geminiKey;
  }
  if (typeof stored.openaiModel === 'string') {
    next.cloud.openai.model = stored.openaiModel;
  }
  if (typeof stored.anthropicModel === 'string') {
    next.cloud.anthropic.model = stored.anthropicModel;
  }
  if (typeof stored.geminiModel === 'string') {
    next.cloud.gemini.model = stored.geminiModel;
  }
  if (typeof stored.openaiBaseUrl === 'string' && stored.openaiBaseUrl) {
    next.localBaseUrl = stored.openaiBaseUrl;
  }

  return next;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    try {
      const got = await chrome.storage.local.get(STORAGE_KEY);
      const stored = (got?.[STORAGE_KEY] ?? {}) as Record<string, unknown>;
      set({ settings: migrate(stored), loaded: true });
    } catch (e) {
      console.warn('[paperlight] settings load failed', e);
      set({ loaded: true });
    }
  },

  async update(patch) {
    const next = { ...get().settings, ...patch };
    set({ settings: next });
    try {
      await chrome.storage.local.set({ [STORAGE_KEY]: next });
    } catch (e) {
      console.warn('[paperlight] settings save failed', e);
    }
  },
}));

if (typeof chrome !== 'undefined' && chrome.storage?.onChanged) {
  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'local') return;
    const entry = changes[STORAGE_KEY];
    if (!entry) return;
    const incoming = (entry.newValue ?? {}) as Record<string, unknown>;
    useSettingsStore.setState({ settings: migrate(incoming) });
  });
}
