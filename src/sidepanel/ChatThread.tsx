import { useEffect, useRef } from 'react';
import type { ChatMessage } from '@core/types';
import { cn } from '@ui/lib/cn';

export function ChatThread({ messages }: { messages: ChatMessage[] }) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length, messages.at(-1)?.content.length]);

  return (
    <div className="flex-1 overflow-y-auto px-3 py-4">
      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <MessageBubble key={m.id} message={m} />
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  return (
    <div className={cn('flex flex-col gap-1', isUser ? 'items-end' : 'items-start')}>
      <div className="flex items-center gap-1.5 text-[10px] uppercase tracking-wider text-fg-subtle">
        {message.intent && <span className="chip">{message.intent}</span>}
        <span>{isUser ? 'you' : 'paperlight'}</span>
      </div>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl px-3 py-2 text-sm shadow-panel/40',
          isUser
            ? 'bg-accent text-white'
            : 'border border-border bg-bg-elevated text-fg',
          message.pending && !isUser && 'min-w-[80px]',
        )}
      >
        {message.pending && !message.content ? (
          <span className="inline-flex items-center gap-1 text-fg-muted">
            <DotPulse />
          </span>
        ) : (
          <RenderMarkdown text={message.content} />
        )}
        {message.error && (
          <p className="mt-2 text-xs text-danger">{message.error}</p>
        )}
      </div>
    </div>
  );
}

function RenderMarkdown({ text }: { text: string }) {
  // Minimal safe-ish renderer: bold (**...**), italics (_..._), inline code (`...`),
  // blockquotes (> ...), paragraph breaks. Sanitises by escaping HTML first.
  const lines = text.split('\n');
  const blocks: Array<{ kind: 'p' | 'quote'; text: string }> = [];
  let current: { kind: 'p' | 'quote'; text: string } | null = null;
  for (const raw of lines) {
    const isQuote = raw.startsWith('> ');
    const content = isQuote ? raw.slice(2) : raw;
    if (!content.trim()) {
      if (current) blocks.push(current);
      current = null;
      continue;
    }
    const kind = isQuote ? 'quote' : 'p';
    if (!current || current.kind !== kind) {
      if (current) blocks.push(current);
      current = { kind, text: content };
    } else {
      current.text += '\n' + content;
    }
  }
  if (current) blocks.push(current);

  return (
    <div className="flex flex-col gap-2 leading-relaxed">
      {blocks.map((b, i) =>
        b.kind === 'quote' ? (
          <blockquote
            key={i}
            className="border-l-2 border-accent/60 pl-3 text-fg-muted italic whitespace-pre-line"
            dangerouslySetInnerHTML={{ __html: applyInline(b.text) }}
          />
        ) : (
          <p
            key={i}
            className="whitespace-pre-wrap break-words"
            dangerouslySetInnerHTML={{ __html: applyInline(b.text) }}
          />
        ),
      )}
    </div>
  );
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function applyInline(s: string): string {
  const escaped = escapeHtml(s);
  return escaped
    .replace(/`([^`]+)`/g, '<code class="rounded bg-bg-subtle px-1 font-mono text-[12px]">$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|\s)_([^_]+)_(?=\s|$)/g, '$1<em>$2</em>');
}

function DotPulse() {
  return (
    <span className="inline-flex items-center gap-1">
      <span className="h-1.5 w-1.5 rounded-full bg-fg-subtle animate-pulse-soft" />
      <span
        className="h-1.5 w-1.5 rounded-full bg-fg-subtle animate-pulse-soft"
        style={{ animationDelay: '120ms' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-fg-subtle animate-pulse-soft"
        style={{ animationDelay: '240ms' }}
      />
    </span>
  );
}
