// Tiny IndexedDB wrapper for highlights + notes.
// Schema (v1):
//   - documents:  keyPath 'id'   (the SHA-1 of the PDF bytes)
//   - highlights: keyPath 'id'   index 'by_doc' on 'documentId'

export interface DocumentRow {
  id: string;
  title: string | null;
  sourceUrl: string | null;
  numPages: number;
  openedAt: number;
}

export type HighlightColor = 'yellow' | 'pink' | 'green' | 'blue';

export interface HighlightRow {
  id: string;
  documentId: string;
  pageNumber: number;
  text: string;
  color: HighlightColor;
  note: string | null;
  createdAt: number;
  updatedAt: number;
  rects: HighlightRect[];
}

export interface HighlightRect {
  // Normalized to the page's CSS pixel space at the time of capture.
  // The PdfPage component re-projects with its current scale.
  left: number;
  top: number;
  width: number;
  height: number;
  scale: number;
}

const DB_NAME = 'paperlight';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('documents')) {
        db.createObjectStore('documents', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('highlights')) {
        const store = db.createObjectStore('highlights', { keyPath: 'id' });
        store.createIndex('by_doc', 'documentId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

async function tx<T>(
  store: 'documents' | 'highlights',
  mode: IDBTransactionMode,
  fn: (s: IDBObjectStore) => IDBRequest<T> | Promise<T>,
): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(store, mode);
    const s = t.objectStore(store);
    Promise.resolve(fn(s)).then(
      (result) => {
        if (result && typeof (result as IDBRequest).onsuccess === 'object') {
          const req = result as IDBRequest<T>;
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        } else {
          t.oncomplete = () => resolve(result as T);
          t.onerror = () => reject(t.error);
        }
      },
      (err) => reject(err),
    );
  });
}

export async function putDocument(row: DocumentRow): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('documents', 'readwrite');
    t.objectStore('documents').put(row);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function getDocument(id: string): Promise<DocumentRow | null> {
  return tx<DocumentRow | null>('documents', 'readonly', (s) => s.get(id) as IDBRequest<DocumentRow | null>);
}

export async function putHighlight(row: HighlightRow): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('highlights', 'readwrite');
    t.objectStore('highlights').put(row);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function deleteHighlight(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const t = db.transaction('highlights', 'readwrite');
    t.objectStore('highlights').delete(id);
    t.oncomplete = () => resolve();
    t.onerror = () => reject(t.error);
  });
}

export async function listHighlightsForDoc(documentId: string): Promise<HighlightRow[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('highlights', 'readonly');
    const idx = t.objectStore('highlights').index('by_doc');
    const req = idx.getAll(documentId);
    req.onsuccess = () => {
      const rows = (req.result ?? []) as HighlightRow[];
      rows.sort((a, b) => a.pageNumber - b.pageNumber || a.createdAt - b.createdAt);
      resolve(rows);
    };
    req.onerror = () => reject(req.error);
  });
}

export async function listAllHighlights(): Promise<HighlightRow[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const t = db.transaction('highlights', 'readonly');
    const req = t.objectStore('highlights').getAll();
    req.onsuccess = () => resolve((req.result ?? []) as HighlightRow[]);
    req.onerror = () => reject(req.error);
  });
}

export async function hashBuffer(buf: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-1', buf);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
