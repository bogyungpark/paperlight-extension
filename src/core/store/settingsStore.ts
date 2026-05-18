import { create } from 'zustand';
import { DEFAULT_SETTINGS, type Settings } from '../types';

const STORAGE_KEY = 'paperlight:settings';

interface SettingsState {
  settings: Settings;
  loaded: boolean;
  load: () => Promise<void>;
  update: (patch: Partial<Settings>) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: DEFAULT_SETTINGS,
  loaded: false,

  async load() {
    try {
      const got = await chrome.storage.local.get(STORAGE_KEY);
      const stored = (got?.[STORAGE_KEY] ?? {}) as Partial<Settings>;
      set({ settings: { ...DEFAULT_SETTINGS, ...stored }, loaded: true });
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
    const incoming = (entry.newValue ?? {}) as Partial<Settings>;
    useSettingsStore.setState({ settings: { ...DEFAULT_SETTINGS, ...incoming } });
  });
}
