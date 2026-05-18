import { create } from 'zustand';
import type { AIIntent, ChatMessage, SelectionPayload } from '../types';

interface ChatState {
  messages: ChatMessage[];
  activeDocument: SelectionPayload['sourceUrl'];
  activeTitle: string | null;
  pendingIntent: AIIntent | null;

  appendMessage: (msg: ChatMessage) => void;
  updateMessage: (id: string, patch: Partial<ChatMessage>) => void;
  removeMessage: (id: string) => void;
  reset: () => void;

  setActiveDocument: (url: string | null, title: string | null) => void;
  setPendingIntent: (intent: AIIntent | null) => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  activeDocument: null,
  activeTitle: null,
  pendingIntent: null,

  appendMessage: (msg) =>
    set((s) => ({ messages: [...s.messages, msg] })),
  updateMessage: (id, patch) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    })),
  removeMessage: (id) =>
    set((s) => ({ messages: s.messages.filter((m) => m.id !== id) })),
  reset: () => set({ messages: [] }),

  setActiveDocument: (activeDocument, activeTitle) => set({ activeDocument, activeTitle }),
  setPendingIntent: (pendingIntent) => set({ pendingIntent }),
}));

export function newMessageId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
