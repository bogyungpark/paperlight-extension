// Semantic Scholar Graph API client + local cache.
// Free tier — no API key required, but rate limits apply (~100 req / 5 min).

export interface CitationPaper {
  paperId: string;
  title: string;
  abstract: string | null;
  year: number | null;
  authors: string[];
  venue: string | null;
  url: string | null;
}

const ENDPOINT = 'https://api.semanticscholar.org/graph/v1';
const CACHE_KEY = 'paperlight:cite-cache';
const TTL_MS = 24 * 60 * 60 * 1000; // 24h
const FIELDS = 'title,abstract,year,authors.name,venue,url';

interface CacheEntry {
  paper: CitationPaper | null;
  ts: number;
}

let memCache: Record<string, CacheEntry> | null = null;

async function loadCache(): Promise<Record<string, CacheEntry>> {
  if (memCache) return memCache;
  if (typeof chrome === 'undefined' || !chrome.storage?.local) {
    memCache = {};
    return memCache;
  }
  try {
    const got = await chrome.storage.local.get(CACHE_KEY);
    memCache = (got?.[CACHE_KEY] as Record<string, CacheEntry>) ?? {};
  } catch {
    memCache = {};
  }
  return memCache;
}

async function saveCache(cache: Record<string, CacheEntry>): Promise<void> {
  memCache = cache;
  if (typeof chrome === 'undefined' || !chrome.storage?.local) return;
  // Prune to most recent 200 entries to stay under storage quotas.
  const entries = Object.entries(cache);
  if (entries.length > 200) {
    entries.sort((a, b) => b[1].ts - a[1].ts);
    const trimmed = Object.fromEntries(entries.slice(0, 200));
    memCache = trimmed;
    cache = trimmed;
  }
  try {
    await chrome.storage.local.set({ [CACHE_KEY]: cache });
  } catch {
    // ignore quota errors
  }
}

function isFresh(entry: CacheEntry | undefined): boolean {
  return !!entry && Date.now() - entry.ts < TTL_MS;
}

export interface CitationLookupInput {
  /** A snippet from the paper around the citation marker (e.g. "Smith et al., 2024"). */
  query: string;
}

export async function lookupCitation(
  input: CitationLookupInput,
  signal?: AbortSignal,
): Promise<CitationPaper | null> {
  const key = input.query.trim().toLowerCase();
  if (!key) return null;
  const cache = await loadCache();
  const cached = cache[key];
  if (isFresh(cached)) return cached.paper;

  const url = new URL(`${ENDPOINT}/paper/search`);
  url.searchParams.set('query', input.query);
  url.searchParams.set('limit', '1');
  url.searchParams.set('fields', FIELDS);

  let result: CitationPaper | null = null;
  try {
    const res = await fetch(url.toString(), { signal });
    if (res.ok) {
      const json = await res.json();
      const first = json?.data?.[0];
      if (first) {
        result = {
          paperId: first.paperId,
          title: first.title ?? '(no title)',
          abstract: first.abstract ?? null,
          year: typeof first.year === 'number' ? first.year : null,
          authors: Array.isArray(first.authors)
            ? first.authors.map((a: { name?: string }) => a?.name).filter(Boolean)
            : [],
          venue: first.venue ?? null,
          url: first.url ?? null,
        };
      }
    }
  } catch (e) {
    if ((e as Error).name === 'AbortError') throw e;
    console.warn('[paperlight] citation lookup failed', e);
  }

  cache[key] = { paper: result, ts: Date.now() };
  void saveCache(cache);
  return result;
}

// Patterns used to detect citation-like substrings in plain text.
// We intentionally keep these forgiving so we surface previews on best-effort.
const PATTERNS: Array<{ kind: string; re: RegExp }> = [
  // arXiv: arXiv:2401.12345 or 2401.12345
  { kind: 'arxiv', re: /\barxiv:\s*(\d{4}\.\d{4,5})\b/gi },
  { kind: 'arxiv-bare', re: /\b(\d{4}\.\d{4,5})\b/g },
  // DOI
  { kind: 'doi', re: /\b(10\.\d{4,9}\/[-._;()\/:A-Z0-9]+)\b/gi },
  // Author-year (Smith, 2024) (Smith et al., 2024) [Smith, 2024]
  {
    kind: 'author-year',
    re: /(?:\(|\[)([A-Z][a-z]+(?:\s+(?:et\s+al\.|and\s+[A-Z][a-z]+))?(?:,)?\s*\d{4}[a-z]?)(?:\)|\])/g,
  },
];

export interface CitationMatch {
  kind: 'arxiv' | 'arxiv-bare' | 'doi' | 'author-year' | string;
  raw: string;
  query: string;
  start: number;
  end: number;
}

export function findCitations(text: string): CitationMatch[] {
  const matches: CitationMatch[] = [];
  for (const { kind, re } of PATTERNS) {
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const value = m[1] ?? m[0];
      const start = m.index;
      const end = start + m[0].length;
      // Skip overlapping matches from earlier passes (favor specific patterns).
      if (matches.some((x) => start < x.end && end > x.start)) continue;
      matches.push({
        kind,
        raw: m[0],
        query: kind === 'doi' ? value : kind.startsWith('arxiv') ? `arxiv ${value}` : value,
        start,
        end,
      });
    }
  }
  matches.sort((a, b) => a.start - b.start);
  return matches;
}
