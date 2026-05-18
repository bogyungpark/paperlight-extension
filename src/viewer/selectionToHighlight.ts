import type { HighlightRect } from '@core/store/highlightStore';

export interface CapturedSelection {
  pageNumber: number;
  text: string;
  rects: HighlightRect[];
}

/**
 * Walk up from the selection node to find a `[data-page]` ancestor.
 * Returns the page element + its parsed page number, or null.
 */
function findPageHost(node: Node | null): { el: HTMLElement; pageNumber: number } | null {
  let cur: Node | null = node;
  while (cur) {
    if (cur instanceof HTMLElement) {
      const attr = cur.getAttribute('data-page');
      if (attr) {
        const n = parseInt(attr, 10);
        if (!Number.isNaN(n)) return { el: cur, pageNumber: n };
      }
    }
    cur = (cur as { parentNode?: Node | null }).parentNode ?? null;
  }
  return null;
}

/**
 * Capture the current window selection as a normalized highlight payload.
 * Returns null when the selection doesn't lie inside a data-page host.
 */
export function captureSelection(scale: number): CapturedSelection | null {
  const sel = window.getSelection();
  if (!sel || sel.rangeCount === 0) return null;
  const text = sel.toString().trim();
  if (!text) return null;
  const range = sel.getRangeAt(0);
  const host = findPageHost(range.startContainer);
  if (!host) return null;
  const pageRect = host.el.getBoundingClientRect();

  const clientRects = Array.from(range.getClientRects()).filter(
    (r) => r.width > 0 && r.height > 0,
  );
  if (clientRects.length === 0) return null;

  const rects: HighlightRect[] = clientRects.map((r) => ({
    left: (r.left - pageRect.left) / scale,
    top: (r.top - pageRect.top) / scale,
    width: r.width / scale,
    height: r.height / scale,
    scale,
  }));

  return { pageNumber: host.pageNumber, text, rects };
}
