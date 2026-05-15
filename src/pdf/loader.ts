import * as pdfjs from 'pdfjs-dist';
import type { PDFDocumentProxy } from 'pdfjs-dist';

let workerConfigured = false;

function configureWorker() {
  if (workerConfigured) return;
  workerConfigured = true;
  try {
    // Inside the extension the worker is shipped as web_accessible_resource.
    const workerUrl = chrome.runtime.getURL('pdf.worker.min.mjs');
    pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
  } catch {
    // Outside extension context (e.g. unit test) — let the bundler resolve.
    pdfjs.GlobalWorkerOptions.workerSrc = new URL(
      'pdfjs-dist/build/pdf.worker.min.mjs',
      import.meta.url,
    ).toString();
  }
}

export async function loadPdf(source: ArrayBuffer | string): Promise<PDFDocumentProxy> {
  configureWorker();
  if (typeof source === 'string') {
    const task = pdfjs.getDocument({ url: source });
    return task.promise;
  }
  const data = new Uint8Array(source.slice(0));
  const task = pdfjs.getDocument({ data });
  return task.promise;
}

export type { PDFDocumentProxy };
