import { useEffect } from 'react';
import { Header } from '@ui/components/Header';
import { EmptyState } from '@ui/components/EmptyState';
import { useChatStore, newMessageId } from '@core/store/chatStore';
import { useSettingsStore } from '@core/store/settingsStore';
import type { AIRequestMessage, AIIntent } from '@core/types';
import { ChatThread } from './ChatThread';
import { Composer } from './Composer';
import { useAIInvoke } from './hooks/useAIInvoke';

const INTENT_LABEL: Record<AIIntent, string> = {
  explain: 'Explain this passage',
  translate: 'Translate this passage',
  summarize: 'Summarize this passage',
  chat: 'Ask AI about this passage',
};

export function SidePanelApp() {
  const messages = useChatStore((s) => s.messages);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const setActiveDocument = useChatStore((s) => s.setActiveDocument);
  const pendingIntent = useChatStore((s) => s.pendingIntent);

  const loadSettings = useSettingsStore((s) => s.load);
  const settingsLoaded = useSettingsStore((s) => s.loaded);
  const { invoke, cancel } = useAIInvoke();

  useEffect(() => {
    document.documentElement.classList.add('dark');
    void loadSettings();
  }, [loadSettings]);

  useEffect(() => {
    const handler = (msg: unknown) => {
      if (!isAIRequest(msg)) return;
      if (msg.sourceUrl) setActiveDocument(msg.sourceUrl, msg.documentTitle ?? null);

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
      <main className="flex min-h-0 flex-1 flex-col">
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
              const userId = newMessageId();
              appendMessage({
                id: userId,
                role: 'user',
                intent: 'chat',
                content: text,
                createdAt: Date.now(),
              });
              void invoke({ intent: 'chat', userMessage: text });
            }}
          />
        )}
      </main>
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
