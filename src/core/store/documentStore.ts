import { create } from 'zustand';
import type { ParsedDocument } from '@pdf/types';

interface DocumentState {
  parsed: ParsedDocument | null;
  documentId: string | null;
  setParsed: (id: string, parsed: ParsedDocument | null) => void;
  clear: () => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  parsed: null,
  documentId: null,
  setParsed: (documentId, parsed) => set({ documentId, parsed }),
  clear: () => set({ parsed: null, documentId: null }),
}));
