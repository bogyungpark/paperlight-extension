import { useEffect, useRef, useState } from 'react';
import { newMessageId, useChatStore } from '@core/store/chatStore';
import { cn } from '@ui/lib/cn';

export function Composer() {
  const [value, setValue] = useState('');
  const taRef = useRef<HTMLTextAreaElement>(null);
  const { appendMessage, updateMessage, activeTitle } = useChatStore();

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = `${Math.min(ta.scrollHeight, 180)}px`;
  }, [value]);

  function send() {
    const trimmed = value.trim();
    if (!trimmed) return;
    const userId = newMessageId();
    appendMessage({
      id: userId,
      role: 'user',
      intent: 'chat',
      content: trimmed,
      createdAt: Date.now(),
    });
    const assistantId = newMessageId();
    appendMessage({
      id: assistantId,
      role: 'assistant',
      intent: 'chat',
      content: '',
      createdAt: Date.now(),
      pending: true,
    });
    setValue('');
    window.setTimeout(() => {
      updateMessage(assistantId, {
        pending: false,
        content:
          '_Paperlight AI layer arrives in STEP 4._ Once a provider is configured, replies will be grounded in the open paper' +
          (activeTitle ? ` ("${activeTitle}")` : '') +
          '.',
      });
    }, 220);
  }

  return (
    <div className="border-t border-border bg-bg-elevated/80 p-2 backdrop-blur-xl">
      <div className="flex items-end gap-2 rounded-xl border border-border bg-bg px-2 py-1.5 focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/30">
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder="Ask anything about this paper…"
          className="flex-1 resize-none bg-transparent px-1 py-1.5 text-sm text-fg placeholder:text-fg-subtle focus:outline-none"
        />
        <button
          type="button"
          onClick={send}
          disabled={!value.trim()}
          className={cn(
            'btn-primary h-8 w-8 p-0',
            !value.trim() && 'opacity-50 cursor-not-allowed bg-bg-subtle text-fg-muted hover:bg-bg-subtle',
          )}
          title="Send (Enter)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m5 12 14-7-4 17-4-6-6-4Z" strokeLinejoin="round" />
          </svg>
        </button>
      </div>
      <p className="mt-1.5 px-1 text-[10px] text-fg-subtle">
        Enter to send · Shift+Enter for newline · Esc clears menu
      </p>
    </div>
  );
}
