import { useEffect } from 'react';
import { Header } from '@ui/components/Header';
import { EmptyState } from '@ui/components/EmptyState';
import { useChatStore, newMessageId } from '@core/store/chatStore';
import type { AIRequestMessage, AIIntent } from '@core/types';
import { ChatThread } from './ChatThread';
import { Composer } from './Composer';

const INTENT_LABEL: Record<AIIntent, string> = {
  explain: 'Explain this passage',
  translate: 'Translate this passage',
  summarize: 'Summarize this passage',
  chat: 'Ask AI about this passage',
};

export function SidePanelApp() {
  const { messages, appendMessage, updateMessage, setActiveDocument } = useChatStore();

  useEffect(() => {
    document.documentElement.classList.add('dark');
  }, []);

  useEffect(() => {
    const handler = (msg: unknown) => {
      if (!isAIRequest(msg)) return;
      if (msg.sourceUrl) setActiveDocument(msg.sourceUrl, msg.documentTitle ?? null);

      const userId = newMessageId();
      appendMessage({
        id: userId,
        role: 'user',
        intent: msg.intent,
        content: `**${INTENT_LABEL[msg.intent]}**\n\n> ${msg.selection.replace(/\n/g, '\n> ')}`,
        createdAt: Date.now(),
      });

      const assistantId = newMessageId();
      appendMessage({
        id: assistantId,
        role: 'assistant',
        intent: msg.intent,
        content: '',
        createdAt: Date.now(),
        pending: true,
      });

      // Placeholder until the AI provider layer lands in STEP 4.
      window.setTimeout(() => {
        updateMessage(assistantId, {
          pending: false,
          content:
            `_Paperlight AI layer arrives in STEP 4._\n\n` +
            `When configured it will ${msg.intent} the highlighted text` +
            (msg.pageNumber ? ` from page ${msg.pageNumber}` : '') +
            (msg.documentTitle ? `, drawn from "${msg.documentTitle}".` : '.') +
            `\n\nFor now, here's the captured selection so the round-trip is verifiable:\n\n` +
            `> ${msg.selection.slice(0, 280)}${msg.selection.length > 280 ? '…' : ''}`,
        });
      }, 240);
    };
    chrome.runtime.onMessage.addListener(handler);
    return () => chrome.runtime.onMessage.removeListener(handler);
  }, [appendMessage, updateMessage, setActiveDocument]);

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
        <Composer />
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
