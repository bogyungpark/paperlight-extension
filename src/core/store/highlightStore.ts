import { create } from 'zustand';
import {
  deleteHighlight,
  listHighlightsForDoc,
  putHighlight,
  type HighlightColor,
  type HighlightRect,
  type HighlightRow,
} from '../storage/db';

const ACTIVE_DOC_KEY = 'paperlight:active-document-id';

interface HighlightState {
  documentId: string | null;
  rows: HighlightRow[];
  loading: boolean;
  defaultColor: HighlightColor;

  setDocumentId: (id: string | null) => Promise<void>;
  refresh: () => Promise<void>;
  add: (
    input: Omit<HighlightRow, 'id' | 'createdAt' | 'updatedAt' | 'documentId'>,
  ) => Promise<HighlightRow | null>;
  update: (id: string, patch: Partial<Pick<HighlightRow, 'color' | 'note'>>) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setDefaultColor: (c: HighlightColor) => void;
}

function newId() {
  return `hl-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

export const useHighlightStore = create<HighlightState>((set, get) => ({
  documentId: null,
  rows: [],
  loading: false,
  defaultColor: 'yellow',

  async setDocumentId(id) {
    set({ documentId: id, rows: [] });
    if (typeof chrome !== 'undefined' && chrome.storage?.local) {
      try {
        if (id) await chrome.storage.local.set({ [ACTIVE_DOC_KEY]: id });
        else await chrome.storage.local.remove(ACTIVE_DOC_KEY);
      } catch (e) {
        console.warn('[paperlight] active doc id persist failed', e);
      }
    }
    if (!id) return;
    await get().refresh();
  },

  async refresh() {
    const id = get().documentId;
    if (!id) return;
    set({ loading: true });
    try {
      const rows = await listHighlightsForDoc(id);
      set({ rows, loading: false });
    } catch (e) {
      console.warn('[paperlight] highlights refresh failed', e);
      set({ loading: false });
    }
  },

  async add(input) {
    const id = get().documentId;
    if (!id) return null;
    const now = Date.now();
    const row: HighlightRow = {
      id: newId(),
      documentId: id,
      pageNumber: input.pageNumber,
      text: input.text,
      color: input.color,
      note: input.note,
      rects: input.rects,
      createdAt: now,
      updatedAt: now,
    };
    await putHighlight(row);
    set((s) => ({ rows: [...s.rows, row] }));
    return row;
  },

  async update(id, patch) {
    const existing = get().rows.find((r) => r.id === id);
    if (!existing) return;
    const next: HighlightRow = { ...existing, ...patch, updatedAt: Date.now() };
    await putHighlight(next);
    set((s) => ({ rows: s.rows.map((r) => (r.id === id ? next : r)) }));
  },

  async remove(id) {
    await deleteHighlight(id);
    set((s) => ({ rows: s.rows.filter((r) => r.id !== id) }));
  },

  setDefaultColor(c) {
    set({ defaultColor: c });
  },
}));

export type { HighlightRect, HighlightRow, HighlightColor };

export async function loadActiveDocumentIdFromStorage(): Promise<string | null> {
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return null;
  try {
    const got = await chrome.storage.local.get(ACTIVE_DOC_KEY);
    return (got?.[ACTIVE_DOC_KEY] as string | undefined) ?? null;
  } catch {
    return null;
  }
}

export function subscribeActiveDocumentId(
  callback: (id: string | null) => void,
): () => void {
  if (typeof chrome === 'undefined' || !chrome.storage?.onChanged) return () => {};
  const handler = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
    if (area !== 'local') return;
    const entry = changes[ACTIVE_DOC_KEY];
    if (!entry) return;
    callback((entry.newValue as string | undefined) ?? null);
  };
  chrome.storage.onChanged.addListener(handler);
  return () => chrome.storage.onChanged.removeListener(handler);
}
