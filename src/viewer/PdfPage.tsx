import { useEffect, useRef, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { TextLayer } from 'pdfjs-dist';
import { HighlightLayer } from './HighlightLayer';
import { cn } from '@ui/lib/cn';

export function PdfPage({
  doc,
  pageNumber,
  scale,
}: {
  doc: PDFDocumentProxy;
  pageNumber: number;
  scale: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState<{ w: number; h: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    let renderTask: ReturnType<ReturnType<PDFDocumentProxy['getPage']> extends Promise<infer P> ? (P extends { render: (a: any) => infer R } ? () => R : never) : never> | { cancel: () => void } | null = null;

    (async () => {
      const page = await doc.getPage(pageNumber);
      if (cancelled) return;
      const viewport = page.getViewport({ scale });
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d')!;
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.floor(viewport.width * dpr);
      canvas.height = Math.floor(viewport.height * dpr);
      canvas.style.width = `${viewport.width}px`;
      canvas.style.height = `${viewport.height}px`;
      setDims({ w: viewport.width, h: viewport.height });
      const task = page.render({
        canvasContext: ctx,
        viewport,
        transform: dpr !== 1 ? [dpr, 0, 0, dpr, 0, 0] : undefined,
      } as Parameters<typeof page.render>[0]);
      renderTask = task;
      try {
        await task.promise;
        if (cancelled) return;
        const textContent = await page.getTextContent();
        const layer = textLayerRef.current;
        if (!layer || cancelled) return;
        layer.innerHTML = '';
        layer.style.setProperty('--scale-factor', String(viewport.scale));
        const textLayer = new TextLayer({
          textContentSource: textContent,
          container: layer,
          viewport,
        });
        await textLayer.render();
      } catch (e) {
        if ((e as Error)?.name !== 'RenderingCancelledException') {
          console.error('[paperlight] page render error', e);
        }
      } finally {
        page.cleanup();
      }
    })();

    return () => {
      cancelled = true;
      renderTask?.cancel?.();
    };
  }, [doc, pageNumber, scale]);

  return (
    <div
      className={cn(
        'relative rounded-md bg-bg-elevated shadow-panel',
        'ring-1 ring-border/60',
        !dims && 'min-h-[400px] min-w-[700px] animate-pulse-soft',
      )}
      style={dims ? { width: dims.w, height: dims.h } : undefined}
      data-page={pageNumber}
    >
      <canvas ref={canvasRef} className="block" />
      <div ref={textLayerRef} className="pdf-textlayer" />
      <HighlightLayer pageNumber={pageNumber} scale={scale} />
      <div className="pointer-events-none absolute right-2 top-2 rounded-md bg-bg/60 px-1.5 py-0.5 text-[10px] font-mono text-fg-subtle backdrop-blur">
        p.{pageNumber}
      </div>
    </div>
  );
}
