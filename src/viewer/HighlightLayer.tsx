import { useMemo, useState } from 'react';
import type { HighlightColor, HighlightRow } from '@core/store/highlightStore';
import { useHighlightStore } from '@core/store/highlightStore';
import { cn } from '@ui/lib/cn';

const COLOR_BG: Record<HighlightColor, string> = {
  yellow: 'rgba(250, 204, 21, 0.32)',
  pink: 'rgba(244, 114, 182, 0.32)',
  green: 'rgba(74, 222, 128, 0.32)',
  blue: 'rgba(96, 165, 250, 0.32)',
};

export function HighlightLayer({
  pageNumber,
  scale,
}: {
  pageNumber: number;
  scale: number;
}) {
  const rows = useHighlightStore((s) => s.rows.filter((r) => r.pageNumber === pageNumber));
  const [openId, setOpenId] = useState<string | null>(null);
  const update = useHighlightStore((s) => s.update);
  const remove = useHighlightStore((s) => s.remove);

  const rendered = useMemo(() => rows, [rows]);

  return (
    <div className="pointer-events-none absolute inset-0" data-paperlight-highlight-layer>
      {rendered.map((row) => (
        <HighlightItem
          key={row.id}
          row={row}
          scale={scale}
          open={openId === row.id}
          onToggle={() => setOpenId(openId === row.id ? null : row.id)}
          onUpdate={(patch) => update(row.id, patch)}
          onRemove={() => {
            void remove(row.id);
            setOpenId(null);
          }}
        />
      ))}
    </div>
  );
}

function HighlightItem({
  row,
  scale,
  open,
  onToggle,
  onUpdate,
  onRemove,
}: {
  row: HighlightRow;
  scale: number;
  open: boolean;
  onToggle: () => void;
  onUpdate: (patch: { color?: HighlightColor; note?: string | null }) => void;
  onRemove: () => void;
}) {
  const factor = row.rects[0] ? scale / row.rects[0].scale : 1;
  const bg = COLOR_BG[row.color];

  return (
    <>
      {row.rects.map((rect, i) => (
        <div
          key={i}
          className="pointer-events-auto absolute cursor-pointer rounded-[2px] transition-colors hover:brightness-110"
          style={{
            left: rect.left * factor,
            top: rect.top * factor,
            width: rect.width * factor,
            height: rect.height * factor,
            background: bg,
            mixBlendMode: 'multiply',
          }}
          onClick={(e) => {
            e.stopPropagation();
            onToggle();
          }}
          title={row.note ? `Note: ${row.note}` : 'Click to edit highlight'}
        />
      ))}
      {open && row.rects[0] && (
        <HighlightPopover
          left={row.rects[0].left * factor}
          top={(row.rects[0].top + row.rects[0].height) * factor + 6}
          row={row}
          onUpdate={onUpdate}
          onRemove={onRemove}
          onClose={onToggle}
        />
      )}
    </>
  );
}

function HighlightPopover({
  left,
  top,
  row,
  onUpdate,
  onRemove,
  onClose,
}: {
  left: number;
  top: number;
  row: HighlightRow;
  onUpdate: (patch: { color?: HighlightColor; note?: string | null }) => void;
  onRemove: () => void;
  onClose: () => void;
}) {
  return (
    <div
      data-paperlight-popup
      onClick={(e) => e.stopPropagation()}
      className="pointer-events-auto absolute z-20 w-[260px] animate-slide-up rounded-xl border border-border/60 bg-bg-elevated/95 p-2.5 shadow-glass backdrop-blur-xl"
      style={{ left, top }}
    >
      <div className="flex items-center gap-1.5">
        {(['yellow', 'pink', 'green', 'blue'] as HighlightColor[]).map((c) => (
          <button
            key={c}
            type="button"
            className={cn(
              'h-5 w-5 rounded-full border transition-transform hover:scale-110',
              row.color === c ? 'border-fg' : 'border-border',
            )}
            style={{ background: COLOR_BG[c] }}
            onClick={() => onUpdate({ color: c })}
            title={c}
          />
        ))}
        <button
          type="button"
          className="btn-ghost ml-auto h-7 px-2 text-xs text-danger hover:bg-danger/10"
          onClick={onRemove}
        >
          Delete
        </button>
      </div>
      <textarea
        defaultValue={row.note ?? ''}
        placeholder="Add a note…"
        className="input mt-2 min-h-[64px] text-xs"
        onBlur={(e) => {
          const v = e.target.value.trim();
          onUpdate({ note: v || null });
        }}
      />
      <div className="mt-1 flex justify-end">
        <button type="button" className="btn-ghost px-2 text-[11px]" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
