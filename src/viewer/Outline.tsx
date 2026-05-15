import type { PaperSection } from '@pdf/types';
import { cn } from '@ui/lib/cn';

export function Outline({
  open,
  sections,
  onJump,
}: {
  open: boolean;
  sections: PaperSection[];
  onJump: (s: PaperSection) => void;
}) {
  if (!open) return null;
  return (
    <aside className="hidden h-full w-[260px] shrink-0 overflow-y-auto border-r border-border bg-bg px-3 py-4 md:block">
      <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-fg-subtle">
        Outline
      </div>
      {sections.length === 0 ? (
        <p className="px-2 text-xs text-fg-subtle">
          Section detection waits for the document to finish parsing.
        </p>
      ) : (
        <ul className="space-y-0.5">
          {sections.map((s, i) => (
            <li key={i}>
              <button
                onClick={() => onJump(s)}
                className={cn(
                  'group flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                  'hover:bg-bg-subtle text-fg-muted hover:text-fg',
                )}
                style={{ paddingLeft: 8 + Math.min(s.level - 1, 3) * 12 }}
              >
                <span className="line-clamp-1">{s.title}</span>
                <span className="ml-auto text-[10px] font-mono text-fg-subtle group-hover:text-fg-muted">
                  p.{s.startPage}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
