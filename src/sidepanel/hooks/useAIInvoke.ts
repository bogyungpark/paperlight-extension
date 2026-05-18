import { useCallback, useRef } from 'react';
import { useChatStore, newMessageId } from '@core/store/chatStore';
import { useSettingsStore } from '@core/store/settingsStore';
import type { AIIntent } from '@core/types';
import { buildTurns } from '@ai/prompts';
import { getActiveProvider } from '@ai/registry';
import { ProviderError } from '@ai/types';

interface InvokeInput {
  intent: AIIntent;
  selection?: string | null;
  userMessage?: string | null;
  pageNumber?: number | null;
  documentTitle?: string | null;
  fullContext?: string | null;
}

export function useAIInvoke() {
  const controllerRef = useRef<AbortController | null>(null);
  const appendMessage = useChatStore((s) => s.appendMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const setPendingIntent = useChatStore((s) => s.setPendingIntent);

  const cancel = useCallback(() => {
    controllerRef.current?.abort();
    controllerRef.current = null;
    setPendingIntent(null);
  }, [setPendingIntent]);

  const invoke = useCallback(
    async (input: InvokeInput) => {
      const { settings, loaded } = useSettingsStore.getState();
      if (!loaded) await useSettingsStore.getState().load();

      const assistantId = newMessageId();
      appendMessage({
        id: assistantId,
        role: 'assistant',
        intent: input.intent,
        content: '',
        createdAt: Date.now(),
        pending: true,
      });

      let provider;
      try {
        provider = getActiveProvider(settings);
      } catch (e) {
        const msg = e instanceof ProviderError ? e.message : (e as Error).message;
        updateMessage(assistantId, {
          pending: false,
          error: msg,
          content: '',
        });
        return;
      }

      const history = useChatStore
        .getState()
        .messages.filter((m) => m.id !== assistantId)
        .slice(-12);

      const turns = buildTurns({
        intent: input.intent,
        selection: input.selection ?? null,
        userMessage: input.userMessage ?? null,
        documentTitle: input.documentTitle ?? null,
        pageNumber: input.pageNumber ?? null,
        targetLanguage: settings.targetLanguage,
        fullContext: input.fullContext ?? null,
        history,
      });

      const controller = new AbortController();
      controllerRef.current = controller;
      setPendingIntent(input.intent);

      let acc = '';
      try {
        await provider.stream({ turns, signal: controller.signal }, (delta) => {
          acc += delta;
          updateMessage(assistantId, { content: acc, pending: true });
        });
        updateMessage(assistantId, { pending: false, content: acc });
      } catch (e) {
        if ((e as Error).name === 'AbortError') {
          updateMessage(assistantId, { pending: false, content: acc, error: 'Cancelled.' });
        } else {
          const msg =
            e instanceof ProviderError
              ? e.message
              : (e as Error).message || 'Unknown provider error';
          updateMessage(assistantId, { pending: false, content: acc, error: msg });
        }
      } finally {
        if (controllerRef.current === controller) {
          controllerRef.current = null;
        }
        setPendingIntent(null);
      }
    },
    [appendMessage, updateMessage, setPendingIntent],
  );

  return { invoke, cancel };
}
