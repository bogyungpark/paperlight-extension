import { useEffect, useState } from 'react';
import { Header } from '@ui/components/Header';
import { EmptyState } from '@ui/components/EmptyState';
import { useChatStore, newMessageId } from '@core/store/chatStore';
import { useSettingsStore } from '@core/store/settingsStore';
import {
  useHighlightStore,
  loadActiveDocumentIdFromStorage,
  subscribeActiveDocumentId,
} from '@core/store/highlightStore';
import type { AIRequestMessage, AIIntent } from '@core/types';
import { ChatThread } from './ChatThread';
import { Composer } from './Composer';
import { HighlightsPanel } from './HighlightsPanel';
import { useAIInvoke } from './hooks/useAIInvoke';
import { cn } from '@ui/lib/cn';

const INTENT_LABEL: Record<AIIntent, string> = {
  explain: 'Explain this passage',
  translate: 'Translate this passage',
  summarize: 'Summarize this passage',
  chat: 'Ask AI about this passage',
};

type Tab = 'chat' | 'highlights';

export function SidePanelApp() {
  const messages = useChatStore((s) => s.messages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const setActiveDocument = useChatStore((s) => s.setActiveDocument);
  const pendingIntent = useChatStore((s) => s.pendingIntent);

  const loadSettings = useSettingsStore((s) => s.load);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const { invoke, cancel } = useAIInvoke();

  const setHighlightDocId = useHighlightStore((s) => s.setDocumentId);
  const highlightCount = useHighlightStore((s) => s.rows.length);

  const [tab, setTab] = useState<Tab>('chat');

  useEffect(() => {
    document.documentElement.classList.add('dark');
    void loadSettings();
    void (async () => {
      const id = await loadActiveDocumentIdFromStorage();
      if (id) await setHighlightDocId(id);
    })();
    const unsub = subscribeActiveDocumentId(async (id) => {
      await setHighlightDocId(id);
    });
    return () => unsub();
  }, [loadSettings, setHighlightDocId]);

  useEffect(() => {
    const handler = (msg: unknown) => {
      if (!isAIRequest(msg)) return;
      if (msg.sourceUrl) setActiveDocument(msg.sourceUrl, msg.documentTitle ?? null);
      setTab('chat');

      appendMessage({
        id: newMessageId(),
        role: 'user',
        intent: msg.intent,
        content: `**${INTENT_LABEL[msg.intent]}**\n\n> ${msg.selection.replace(/\n/g, '\n> ')}`,
        createdAt: Date.now(),
      });

      void invoke({
        intent: msg.intent,
        selection: msg.selection,
        pageNumber: msg.pageNumber ?? null,
        documentTitle: msg.documentTitle ?? null,
        fullContext: msg.fullContext ?? null,
      });
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [appendMessage, setActiveDocument, invoke]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-bg text-fg">
      <Header />
      <Tabs tab={tab} setTab={setTab} highlightCount={highlightCount} />
      <main className="flex min-h-0 flex-1 flex-col">
        {tab === 'chat' ? (
          <>
            {messages.length === 0 ? (
              <div className="flex-1 overflow-y-auto">
                <EmptyState />
              </div>
            ) : (
              <ChatThread messages={messages} />
            )}
            {!settingsLoaded ? (
              <div className="border-t border-border bg-bg-elevated/80 px-3 py-2 text-xs text-fg-muted">
                Loading settings…
              </div>
            ) : (
              <Composer
                pending={pendingIntent != null}
                onCancel={cancel}
                onSubmit={(text) => {
                  appendMessage({
                    id: newMessageId(),
                    role: 'user',
                    intent: 'chat',
                    content: text,
                    createdAt: Date.now(),
                  });
                  void invoke({ intent: 'chat', userMessage: text });
                }}
              />
            )}
          </>
        ) : (
          <div className="flex-1 overflow-y-auto">
            <HighlightsPanel />
          </div>
        )}
      </main>
    </div>
  );
}

function Tabs({
  tab,
  setTab,
  highlightCount,
}: {
  tab: Tab;
  setTab: (t: Tab) => void;
  highlightCount: number;
}) {
  return (
    <div className="flex border-b border-border bg-bg-subtle/50 px-2">
      {([
        { id: 'chat', label: 'Chat' },
        { id: 'highlights', label: 'Highlights' },
      ] as Array<{ id: Tab; label: string }>).map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => setTab(t.id)}
          className={cn(
            'relative flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors',
            tab === t.id ? 'text-fg' : 'text-fg-muted hover:text-fg',
          )}
        >
          {t.label}
          {t.id === 'highlights' && highlightCount > 0 && (
            <span className="rounded-full bg-bg-elevated px-1.5 text-[10px] text-fg-muted">
              {highlightCount}
            </span>
          )}
          {tab === t.id && (
            <span className="absolute inset-x-2 -bottom-px h-px bg-accent" />
          )}
        </button>
      ))}
    </div>
  );
}

function isAIRequest(msg: unknown): msg is AIRequestMessage {
  return (
    typeof msg === 'object' &&
    msg !== null &&
    (msg as { type?: string }).type === 'paperlight:ai-request'
  );
}
