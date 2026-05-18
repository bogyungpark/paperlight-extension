import { useCallback, useEffect, useRef, useState } from 'react';
import { CitationCard } from '@ui/components/CitationCard';
import {
  findCitations,
  lookupCitation,
  type CitationMatch,
  type CitationPaper,
} from '@core/citations/semanticScholar';

type CardState =
  | { kind: 'loading' }
  | { kind: 'error'; message: string }
  | { kind: 'empty' }
  | { kind: 'ok'; paper: CitationPaper };

interface HoverInfo {
  rect: DOMRect;
  match: CitationMatch;
}

/**
 * Listens for mousemove over the viewer scroll area, scans the hovered
 * text-layer span for citation-shaped substrings, and shows a hover card.
 *
 * We avoid mutating pdf.js's TextLayer DOM (which gets rebuilt on every
 * render); instead we re-scan the text on demand. Citations within long
 * spans get a bounding rect approximated from a Range over the matched
 * characters.
 */
export function CitationHoverOverlay({ rootRef }: { rootRef: React.RefObject<HTMLElement> }) {
  const [hover, setHover] = useState<HoverInfo | null>(null);
  const [state, setState] = useState<CardState | null>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<number | null>(null);
  const cancelRef = useRef<AbortController | null>(null);

  const scheduleHide = useCallback(() => {
    if (hideTimer.current) window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => {
      setHover(null);
      setState(null);
      cancelRef.current?.abort();
    }, 180);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimer.current) {
      window.clearTimeout(hideTimer.current);
      hideTimer.current = null;
    }
  }, []);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const onMove = (e: MouseEvent) => {
      const target = e.target as Element | null;
      if (!target || !target.closest('.pdf-textlayer')) return;
      const span = target.closest('.pdf-textlayer > span');
      if (!(span instanceof HTMLElement)) return;
      const text = span.textContent ?? '';
      if (!text || text.length < 5) return;
      const matches = findCitations(text);
      if (matches.length === 0) return;

      // Find the match under the cursor by walking each match's character range.
      const node = span.firstChild;
      if (!(node instanceof Text)) return;
      let chosen: { match: CitationMatch; rect: DOMRect } | null = null;
      for (const m of matches) {
        try {
          const r = document.createRange();
          r.setStart(node, m.start);
          r.setEnd(node, Math.min(m.end, node.length));
          const rect = r.getBoundingClientRect();
          if (
            e.clientX >= rect.left - 2 &&
            e.clientX <= rect.right + 2 &&
            e.clientY >= rect.top - 2 &&
            e.clientY <= rect.bottom + 2
          ) {
            chosen = { match: m, rect };
            break;
          }
        } catch {
          // ignore range errors
        }
      }
      if (!chosen) return;
      if (
        hover &&
        hover.match.start === chosen.match.start &&
        hover.match.raw === chosen.match.raw
      ) {
        cancelHide();
        return;
      }
      cancelHide();
      setHover(chosen);
      setState({ kind: 'loading' });
      cancelRef.current?.abort();
      const controller = new AbortController();
      cancelRef.current = controller;
      void lookupCitation({ query: chosen.match.query }, controller.signal)
        .then((paper) => {
          if (controller.signal.aborted) return;
          if (paper) setState({ kind: 'ok', paper });
          else setState({ kind: 'empty' });
        })
        .catch((err) => {
          if (controller.signal.aborted) return;
          setState({ kind: 'error', message: (err as Error).message || 'Lookup failed' });
        });
    };

    const onLeave = (e: MouseEvent) => {
      const related = e.relatedTarget as Element | null;
      if (related?.closest('[data-paperlight-citation-card]')) return;
      scheduleHide();
    };

    root.addEventListener('mousemove', onMove);
    root.addEventListener('mouseleave', onLeave);
    return () => {
      root.removeEventListener('mousemove', onMove);
      root.removeEventListener('mouseleave', onLeave);
      cancelRef.current?.abort();
      if (hideTimer.current) window.clearTimeout(hideTimer.current);
    };
  }, [rootRef, hover, scheduleHide, cancelHide]);

  if (!hover || !state) return null;
  const placement = chooseCardPosition(hover.rect, cardRef.current);

  return (
    <div
      ref={cardRef}
      data-paperlight-citation-card
      onMouseEnter={cancelHide}
      onMouseLeave={scheduleHide}
      className="fixed z-[60] rounded-xl border border-border/60 bg-bg-elevated/95 p-3 shadow-glass backdrop-blur-xl"
      style={{ left: placement.left, top: placement.top }}
    >
      <CitationCard state={state} />
    </div>
  );
}

function chooseCardPosition(target: DOMRect, card: HTMLElement | null) {
  const cardW = card?.offsetWidth ?? 380;
  const cardH = card?.offsetHeight ?? 200;
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const margin = 8;

  let left = target.left;
  if (left + cardW + margin > vw) left = vw - cardW - margin;
  if (left < margin) left = margin;

  let top = target.bottom + margin;
  if (top + cardH + margin > vh) top = target.top - cardH - margin;
  if (top < margin) top = margin;

  return { left, top };
}
