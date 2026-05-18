import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { AIIntent } from '@core/types';
import type { HighlightColor } from '@core/store/highlightStore';
import { cn } from '@ui/lib/cn';

interface FloatingMenuProps {
  anchorRect: DOMRect | null;
  selection: string;
  onPick: (intent: AIIntent) => void;
  onClose: () => void;
  onHighlight?: (color: HighlightColor) => void;
}

const HIGHLIGHT_COLORS: Array<{ id: HighlightColor; swatch: string }> = [
  { id: 'yellow', swatch: 'rgba(250, 204, 21, 0.65)' },
  { id: 'pink', swatch: 'rgba(244, 114, 182, 0.65)' },
  { id: 'green', swatch: 'rgba(74, 222, 128, 0.65)' },
  { id: 'blue', swatch: 'rgba(96, 165, 250, 0.65)' },
];

const ACTIONS: Array<{ intent: AIIntent; label: string; icon: () => JSX.Element; shortcut?: string }> = [
  { intent: 'explain', label: 'Explain', icon: SparklesIcon, shortcut: 'E' },
  { intent: 'translate', label: 'Translate', icon: GlobeIcon, shortcut: 'T' },
  { intent: 'summarize', label: 'Summarize', icon: ListIcon, shortcut: 'S' },
  { intent: 'chat', label: 'Ask AI', icon: ChatIcon, shortcut: 'A' },
];

export function FloatingMenu({ anchorRect, selection, onPick, onClose, onHighlight }: FloatingMenuProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ left: number; top: number; placement: 'top' | 'bottom' } | null>(
    null,
  );

  useLayoutEffect(() => {
    if (!anchorRect || !ref.current) {
      setPos(null);
      return;
    }
    const menu = ref.current;
    const menuRect = menu.getBoundingClientRect();
    const margin = 8;
    const viewportW = window.innerWidth;
    const viewportH = window.innerHeight;

    let left = anchorRect.left + anchorRect.width / 2 - menuRect.width / 2;
    left = Math.max(margin, Math.min(left, viewportW - menuRect.width - margin));

    const aboveTop = anchorRect.top - menuRect.height - margin;
    const belowTop = anchorRect.bottom + margin;
    const fitsAbove = aboveTop > margin;
    const fitsBelow = belowTop + menuRect.height < viewportH - margin;
    let top: number;
    let placement: 'top' | 'bottom';
    if (fitsAbove) {
      top = aboveTop;
      placement = 'top';
    } else if (fitsBelow) {
      top = belowTop;
      placement = 'bottom';
    } else {
      top = Math.max(margin, viewportH - menuRect.height - margin);
      placement = 'top';
    }
    setPos({ left, top, placement });
  }, [anchorRect]);

  useEffect(() => {
    if (!anchorRect) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      const k = e.key.toLowerCase();
      const action = ACTIONS.find((a) => a.shortcut?.toLowerCase() === k);
      if (action && !e.metaKey && !e.ctrlKey && !e.altKey) {
        // require shift to avoid catching plain typing on selection
        if (e.shiftKey) {
          e.preventDefault();
          onPick(action.intent);
        }
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [anchorRect, onPick, onClose]);

  if (!anchorRect) return null;

  return (
    <div
      ref={ref}
      data-paperlight-popup
      role="menu"
      aria-label="Paperlight actions"
      className={cn(
        'fixed z-[2147483646] flex items-center gap-0.5 rounded-xl border border-border/60 bg-bg-elevated/95 p-1 shadow-glass backdrop-blur-xl',
        'animate-slide-up',
      )}
      style={{
        left: pos?.left ?? -9999,
        top: pos?.top ?? -9999,
        visibility: pos ? 'visible' : 'hidden',
        transformOrigin: pos?.placement === 'top' ? 'bottom center' : 'top center',
      }}
    >
      {ACTIONS.map((a) => {
        const Icon = a.icon;
        return (
          <button
            key={a.intent}
            type="button"
            className={cn(
              'group inline-flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium',
              'text-fg-muted hover:bg-bg-subtle hover:text-fg',
              'transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60',
            )}
            onMouseDown={(e) => {
              e.preventDefault();
              onPick(a.intent);
            }}
            title={`${a.label}${a.shortcut ? ` (Shift+${a.shortcut})` : ''}`}
          >
            <Icon />
            <span>{a.label}</span>
          </button>
        );
      })}
      {onHighlight && (
        <>
          <span className="mx-1 h-4 w-px bg-border" />
          <div className="flex items-center gap-1 px-1" role="group" aria-label="Highlight color">
            {HIGHLIGHT_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                title={`Highlight ${c.id}`}
                aria-label={`Highlight ${c.id}`}
                onMouseDown={(e) => {
                  e.preventDefault();
                  onHighlight(c.id);
                }}
                className="h-4 w-4 rounded-full border border-border/60 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60"
                style={{ background: c.swatch }}
              />
            ))}
          </div>
        </>
      )}
      <span className="mx-1 hidden h-4 w-px bg-border sm:block" />
      <span className="hidden truncate px-1 text-[10px] font-mono text-fg-subtle sm:inline-block max-w-[140px]">
        {selection.length > 38 ? `${selection.slice(0, 36)}…` : selection}
      </span>
    </div>
  );
}

function SparklesIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M12 3v3m0 12v3M3 12h3m12 0h3M5.6 5.6l2.1 2.1m8.6 8.6 2.1 2.1M5.6 18.4l2.1-2.1m8.6-8.6 2.1-2.1" strokeLinecap="round" />
    </svg>
  );
}
function GlobeIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" />
    </svg>
  );
}
function ListIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  );
}
function ChatIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 12a8 8 0 0 1-12.5 6.6L4 20l1.4-4.5A8 8 0 1 1 21 12Z" strokeLinejoin="round" />
    </svg>
  );
}
