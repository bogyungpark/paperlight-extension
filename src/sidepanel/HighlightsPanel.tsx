import { useEffect } from 'react';
import { useHighlightStore, type HighlightColor } from '@core/store/highlightStore';
import { cn } from '@ui/lib/cn';

const SWATCH: Record<HighlightColor, string> = {
  yellow: 'bg-yellow-400/70',
  pink: 'bg-pink-400/70',
  green: 'bg-green-400/70',
  blue: 'bg-blue-400/70',
};

export function HighlightsPanel() {
  const { rows, documentId, loading, refresh, remove, update } = useHighlightStore();

  useEffect(() => {
    if (documentId) void refresh();
  }, [documentId, refresh]);

  if (!documentId) {
    return (
      <div className="grid h-full place-items-center px-6 py-12 text-center">
        <p className="max-w-[260px] text-sm text-fg-muted">
          Open a PDF in Paperlight to start saving highlights here.
        </p>
      </div>
    );
  }

  if (loading) {
    return <div className="px-4 py-6 text-sm text-fg-muted">Loading highlights…</div>;
  }

  if (rows.length === 0) {
    return (
      <div className="grid h-full place-items-center px-6 py-12 text-center">
        <p className="max-w-[280px] text-sm text-fg-muted">
          Drag-select any text in the viewer, then pick a color from the floating menu to save your
          first highlight.
        </p>
      </div>
    );
  }

  return (
    <ul className="flex flex-col gap-2 px-3 py-3">
      {rows.map((r) => (
        <li
          key={r.id}
          className="card relative flex flex-col gap-2 px-3 py-2.5 transition-colors hover:border-border-strong"
        >
          <header className="flex items-center gap-2 text-xs">
            <span className={cn('h-2.5 w-2.5 rounded-full', SWATCH[r.color])} />
            <span className="font-mono text-fg-subtle">p.{r.pageNumber}</span>
            <span className="ml-auto text-fg-subtle">
              {new Date(r.createdAt).toLocaleDateString()}
            </span>
            <button
              type="button"
              className="text-fg-subtle hover:text-danger"
              onClick={() => void remove(r.id)}
              title="Delete"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          </header>
          <blockquote className="border-l-2 border-accent/60 pl-2 text-sm text-fg-muted">
            {r.text.length > 220 ? `${r.text.slice(0, 220)}…` : r.text}
          </blockquote>
          <textarea
            defaultValue={r.note ?? ''}
            placeholder="Add a note…"
            className="input min-h-[42px] text-xs"
            onBlur={(e) => {
              const v = e.target.value.trim();
              if ((r.note ?? '') !== v) {
                void update(r.id, { note: v || null });
              }
            }}
          />
        </li>
      ))}
    </ul>
  );
}
