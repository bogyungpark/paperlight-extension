import { useRef } from 'react';
import { Logo } from '@ui/components/Logo';

export function ViewerToolbar({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onPickFile,
  onToggleOutline,
  outlineOpen,
  fileName,
  numPages,
}: {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onPickFile: (file: File) => void;
  onToggleOutline: () => void;
  outlineOpen: boolean;
  fileName: string | null;
  numPages: number | null;
}) {
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <header className="z-10 flex h-12 items-center justify-between border-b border-border bg-bg/85 px-3 backdrop-blur-xl">
      <div className="flex items-center gap-2">
        <button className="btn-ghost" onClick={onToggleOutline} title="Toggle outline">
          <PanelIcon open={outlineOpen} />
        </button>
        <Logo className="h-5 w-5 text-accent" />
        <div className="flex items-baseline gap-2">
          <span className="text-sm font-semibold">Paperlight</span>
          {fileName && (
            <>
              <span className="text-fg-subtle">·</span>
              <span className="max-w-[260px] truncate text-xs text-fg-muted" title={fileName}>
                {fileName}
              </span>
            </>
          )}
          {numPages != null && <span className="chip">{numPages} pages</span>}
        </div>
      </div>
      <div className="flex items-center gap-1.5">
        <button className="btn-ghost" onClick={onZoomOut} title="Zoom out">
          −
        </button>
        <button className="btn-ghost min-w-[56px] font-mono text-xs" onClick={onZoomReset}>
          {Math.round(zoom * 100)}%
        </button>
        <button className="btn-ghost" onClick={onZoomIn} title="Zoom in">
          +
        </button>
        <span className="mx-1 h-5 w-px bg-border" />
        <button className="btn-outline" onClick={() => fileInput.current?.click()}>
          Open PDF
        </button>
        <input
          ref={fileInput}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onPickFile(f);
            e.target.value = '';
          }}
        />
      </div>
    </header>
  );
}

function PanelIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <line x1="9" y1="4" x2="9" y2="20" />
      {open && <line x1="6" y1="9" x2="6" y2="15" />}
    </svg>
  );
}
