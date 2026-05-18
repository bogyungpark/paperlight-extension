import { useEffect, useRef, useState } from 'react';
import { cn } from '@ui/lib/cn';

interface ComposerProps {
  pending: boolean;
  onSubmit: (text: string) => void;
  onCancel: () => void;
}

export function Composer({ pending, onSubmit, onCancel }: ComposerProps) {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  function submit() {
    if (pending) return;
    const trimmed = value.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
    setValue('');
  }

  return (
    <div className="border-t border-border bg-bg-elevated/80 p-2 backdrop-blur-xl">
      <div
        className={cn(
          'flex items-end gap-2 rounded-xl border bg-bg px-2 py-1.5 transition-colors',
          pending
            ? 'border-accent/60 ring-2 ring-accent/30'
            : 'border-border focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30',
        )}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder={pending ? 'Streaming…' : 'Ask anything about this paper…'}
          disabled={pending}
          className="flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none disabled:opacity-60"
        />
        {pending ? (
          <button
            type="button"
            onClick={onCancel}
            className="btn-outline h-8 px-2"
            title="Stop streaming"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <rect x="6" y="6" width="12" height="12" rx="2" />
            </svg>
            <span className="text-xs">Stop</span>
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={!value.trim()}
            className={cn(
              'btn-primary h-8 w-8 p-0',
              !value.trim() &&
                'opacity-50 cursor-not-allowed bg-bg-subtle text-fg-muted hover:bg-bg-subtle',
            )}
            title="Send (Enter)"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="m5 12 14-7-4 17-4-6-6-4Z" strokeLinejoin="round" />
            </svg>
          </button>
        )}
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-fg-subtle">
        Enter to send · Shift+Enter for newline · Esc clears menu
      </p>
    </div>
  );
}
