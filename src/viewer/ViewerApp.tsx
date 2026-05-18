import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { loadPdf, type PDFDocumentProxy } from '@pdf/loader';
import { extractDocument } from '@pdf/extract';
import type { ParsedDocument } from '@pdf/types';
import { PdfPage } from './PdfPage';
import { ViewerToolbar } from './ViewerToolbar';
import { Outline } from './Outline';
import { FloatingMenu } from '@ui/components/FloatingMenu';
import { useTextSelection } from '@ui/hooks/useTextSelection';
import { dispatchSelectionToSidePanel, findPageNumberFromNode } from '@core/messaging';
import type { AIIntent } from '@core/types';
import { hashBuffer, putDocument } from '@core/storage/db';
import { useHighlightStore, type HighlightColor } from '@core/store/highlightStore';
import { captureSelection } from './selectionToHighlight';
import { cn } from '@ui/lib/cn';

export function ViewerApp() {
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [parsed, setParsed] = useState<ParsedDocument | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [zoom, setZoom] = useState(1.2);
  const [outlineOpen, setOutlineOpen] = useState(true);
  const [fileName, setFileName] = useState<string | null>(null);
  const pageRefs = useRef<Map<number, HTMLDivElement>>(new Map());
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const src = params.get('src');
    if (src) {
      void openByUrl(src);
    }
  }, []);

  const setHighlightDocId = useHighlightStore((s) => s.setDocumentId);

  const registerDocument = useCallback(
    async (buf: ArrayBuffer, title: string | null, sourceUrl: string | null, numPages: number) => {
      const id = await hashBuffer(buf);
      await putDocument({
        id,
        title,
        sourceUrl,
        numPages,
        openedAt: Date.now(),
      });
      await setHighlightDocId(id);
      return id;
    },
    [setHighlightDocId],
  );

  const openByUrl = useCallback(
    async (url: string) => {
      setLoading(true);
      setError(null);
      try {
        const buf = await fetch(url).then((r) => {
          if (!r.ok) throw new Error(`fetch failed: ${r.status}`);
          return r.arrayBuffer();
        });
        const d = await loadPdf(buf);
        setDoc(d);
        setFileName(url.split('/').pop() ?? null);
        const parsedDoc = await extractDocument(d);
        setParsed(parsedDoc);
        await registerDocument(buf, parsedDoc.title, url, parsedDoc.numPages);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [registerDocument],
  );

  const openByFile = useCallback(
    async (file: File) => {
      setLoading(true);
      setError(null);
      try {
        const buf = await file.arrayBuffer();
        const d = await loadPdf(buf);
        setDoc(d);
        setFileName(file.name);
        const parsedDoc = await extractDocument(d);
        setParsed(parsedDoc);
        await registerDocument(buf, parsedDoc.title, file.name, parsedDoc.numPages);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    },
    [registerDocument],
  );

  const pages = useMemo(() => {
    if (!doc) return [];
    return Array.from({ length: doc.numPages }, (_, i) => i + 1);
  }, [doc]);

  const goToPage = useCallback((n: number) => {
    const el = pageRefs.current.get(n);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const selection = useTextSelection();
  const [menuDismissed, setMenuDismissed] = useState(false);
  useEffect(() => {
    setMenuDismissed(false);
  }, [selection?.text]);

  const handlePick = useCallback(
    async (intent: AIIntent) => {
      if (!selection?.text) return;
      const sel = window.getSelection();
      const anchorNode = sel?.anchorNode ?? null;
      const pageNumber = findPageNumberFromNode(anchorNode);
      const params = new URLSearchParams(location.search);
      const sourceUrl = params.get('src') ?? location.href;
      await dispatchSelectionToSidePanel({
        intent,
        selection: selection.text,
        sourceUrl,
        pageNumber,
        documentTitle: parsed?.title ?? fileName ?? null,
        fullContext: parsed?.fullText ?? null,
      });
      setMenuDismissed(true);
      window.getSelection()?.removeAllRanges();
    },
    [selection, parsed, fileName],
  );

  const addHighlight = useHighlightStore((s) => s.add);
  const handleHighlight = useCallback(
    async (color: HighlightColor) => {
      const captured = captureSelection(zoom);
      if (!captured) return;
      await addHighlight({
        pageNumber: captured.pageNumber,
        text: captured.text,
        rects: captured.rects,
        color,
        note: null,
      });
      setMenuDismissed(true);
      window.getSelection()?.removeAllRanges();
    },
    [addHighlight, zoom],
  );

  return (
    <div className="flex h-screen min-h-0 flex-col bg-bg text-fg">
      <ViewerToolbar
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(3, +(z + 0.1).toFixed(2)))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, +(z - 0.1).toFixed(2)))}
        onZoomReset={() => setZoom(1.2)}
        onPickFile={openByFile}
        onToggleOutline={() => setOutlineOpen((v) => !v)}
        outlineOpen={outlineOpen}
        fileName={fileName}
        numPages={doc?.numPages ?? null}
      />
      <div className="flex min-h-0 flex-1">
        <Outline
          open={outlineOpen}
          sections={parsed?.sections ?? []}
          onJump={(s) => goToPage(s.startPage)}
        />
        <div
          ref={scrollRef}
          className={cn(
            'flex-1 overflow-y-auto px-6 py-8',
            'bg-bg-subtle [scrollbar-gutter:stable]',
          )}
        >
          {!doc && !loading && (
            <DropZone
              onFile={openByFile}
              onError={setError}
              error={error}
            />
          )}
          {loading && (
            <div className="grid h-full place-items-center">
              <div className="flex items-center gap-2 text-sm text-fg-muted animate-pulse-soft">
                <Spinner /> Loading paper…
              </div>
            </div>
          )}
          {error && doc && (
            <div className="mb-4 rounded-lg border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">
              {error}
            </div>
          )}
          {doc && (
            <div className="mx-auto flex max-w-[900px] flex-col items-center gap-6">
              {pages.map((n) => (
                <div
                  key={n}
                  ref={(el) => {
                    if (el) pageRefs.current.set(n, el);
                    else pageRefs.current.delete(n);
                  }}
                >
                  <PdfPage doc={doc} pageNumber={n} scale={zoom} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      <FloatingMenu
        anchorRect={!menuDismissed && selection ? selection.rect : null}
        selection={selection?.text ?? ''}
        onPick={handlePick}
        onClose={() => setMenuDismissed(true)}
        onHighlight={handleHighlight}
      />
    </div>
  );
}

function DropZone({
  onFile,
  onError,
  error,
}: {
  onFile: (f: File) => void;
  onError: (msg: string | null) => void;
  error: string | null;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  return (
    <div className="grid h-full place-items-center">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const file = e.dataTransfer.files?.[0];
          if (!file) return;
          if (file.type !== 'application/pdf') {
            onError('Please drop a PDF file.');
            return;
          }
          onError(null);
          onFile(file);
        }}
        className={cn(
          'flex w-full max-w-md cursor-pointer flex-col items-center gap-3 rounded-2xl border border-dashed px-8 py-12 text-center transition-colors',
          dragging
            ? 'border-accent bg-accent-subtle/30'
            : 'border-border bg-bg-elevated hover:border-border-strong',
        )}
      >
        <div className="grid h-12 w-12 place-items-center rounded-2xl bg-accent-subtle text-accent">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M12 3v12" strokeLinecap="round" />
            <path d="m6 9 6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
          </svg>
        </div>
        <div>
          <div className="text-sm font-semibold">Drop a PDF here</div>
          <div className="text-xs text-fg-muted">or click to choose a file from your device</div>
        </div>
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onError(null);
              onFile(file);
            }
          }}
        />
        {error && (
          <div className="mt-2 rounded-md bg-danger/10 px-2 py-1 text-xs text-danger">{error}</div>
        )}
      </label>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin text-accent" viewBox="0 0 24 24" fill="none">
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}
