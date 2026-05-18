import type { AIIntent, AIRequestMessage } from './types';

export interface DispatchSelectionInput {
  intent: AIIntent;
  selection: string;
  sourceUrl?: string | null;
  pageNumber?: number | null;
  documentTitle?: string | null;
  fullContext?: string | null;
}

export function buildAIRequest(input: DispatchSelectionInput): AIRequestMessage {
  return {
    type: 'paperlight:ai-request',
    intent: input.intent,
    selection: input.selection,
    sourceUrl: input.sourceUrl ?? null,
    pageNumber: input.pageNumber ?? null,
    documentTitle: input.documentTitle ?? null,
    fullContext: input.fullContext ?? null,
  };
}

export async function dispatchSelectionToSidePanel(input: DispatchSelectionInput): Promise<void> {
  const msg = buildAIRequest(input);
  try {
    await chrome.runtime.sendMessage({ type: 'paperlight:open-sidepanel' });
  } catch {
    // ignore — best-effort open
  }
  try {
    await chrome.runtime.sendMessage(msg);
  } catch (e) {
    console.warn('[paperlight] dispatch failed', e);
  }
}

export function findPageNumberFromNode(node: Node | null): number | null {
  let el: Node | null = node;
  while (el) {
    if (el instanceof HTMLElement) {
      const pageAttr = el.getAttribute('data-page');
      if (pageAttr) {
        const n = parseInt(pageAttr, 10);
        if (!Number.isNaN(n)) return n;
      }
    }
    el = (el as { parentNode?: Node | null }).parentNode ?? null;
  }
  return null;
}
