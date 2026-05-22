import type { AIProvider, ChatRequest, ChatResult } from './types';
import { ProviderError, assertOk } from './types';
import { readSseEvents } from './sse';

export interface AnthropicConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export function createAnthropicProvider(config: AnthropicConfig): AIProvider {
  const baseUrl = config.baseUrl?.replace(/\/$/, '') ?? 'https://api.anthropic.com/v1';

  return {
    label: 'Anthropic',
    async stream(req: ChatRequest, onDelta) {
      if (!config.apiKey) throw new ProviderError('Missing Anthropic API key');

      const systemTurns = req.turns.filter((t) => t.role === 'system');
      const otherTurns = req.turns.filter((t) => t.role !== 'system');
      const system = systemTurns.map((t) => t.content).join('\n\n') || undefined;

      const res = await fetch(`${baseUrl}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': config.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: config.model,
          max_tokens: 1024,
          stream: true,
          system,
          messages: otherTurns.map((t) => ({ role: t.role, content: t.content })),
        }),
        signal: req.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        assertOk(res, text);
        throw new ProviderError('Anthropic: empty stream');
      }

      let full = '';
      for await (const evt of readSseEvents(res.body)) {
        if (evt.event !== 'content_block_delta') continue;
        try {
          const json = JSON.parse(evt.data);
          const delta = json?.delta?.text;
          if (typeof delta === 'string' && delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          // ignore
        }
      }
      return { text: full } as ChatResult;
    },
  };
}
