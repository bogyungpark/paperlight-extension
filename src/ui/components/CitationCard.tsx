import type { CitationPaper } from '@core/citations/semanticScholar';

export function CitationCard({
  state,
}: {
  state:
    | { kind: 'loading' }
    | { kind: 'error'; message: string }
    | { kind: 'empty' }
    | { kind: 'ok'; paper: CitationPaper };
}) {
  if (state.kind === 'loading') {
    return (
      <div className="w-[340px] animate-fade-in">
        <Skeleton />
      </div>
    );
  }
  if (state.kind === 'error') {
    return (
      <div className="w-[280px] text-xs text-danger animate-fade-in">{state.message}</div>
    );
  }
  if (state.kind === 'empty') {
    return (
      <div className="w-[280px] text-xs text-fg-muted animate-fade-in">
        No matching paper found on Semantic Scholar.
      </div>
    );
  }
  const { paper } = state;
  return (
    <div className="w-[360px] animate-fade-in">
      <h3 className="text-sm font-semibold leading-snug text-fg">{paper.title}</h3>
      <p className="mt-1 text-[11px] text-fg-muted">
        {paper.authors.slice(0, 3).join(', ')}
        {paper.authors.length > 3 ? ' et al.' : ''}
        {paper.year ? ` · ${paper.year}` : ''}
        {paper.venue ? ` · ${paper.venue}` : ''}
      </p>
      {paper.abstract && (
        <p className="mt-2 line-clamp-5 text-xs leading-relaxed text-fg-muted">
          {paper.abstract}
        </p>
      )}
      {paper.url && (
        <a
          href={paper.url}
          target="_blank"
          rel="noreferrer"
          className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-accent hover:underline"
        >
          Open on Semantic Scholar
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M7 17 17 7M9 7h8v8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </a>
      )}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="space-y-2">
      <div className="h-3.5 w-3/4 animate-pulse-soft rounded bg-bg-subtle" />
      <div className="h-2.5 w-1/2 animate-pulse-soft rounded bg-bg-subtle" />
      <div className="space-y-1.5 pt-1.5">
        <div className="h-2 w-full animate-pulse-soft rounded bg-bg-subtle" />
        <div className="h-2 w-full animate-pulse-soft rounded bg-bg-subtle" />
        <div className="h-2 w-4/5 animate-pulse-soft rounded bg-bg-subtle" />
      </div>
    </div>
  );
}
