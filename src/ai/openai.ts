import type { AIProvider, ChatRequest, ChatResult } from './types';
import { ProviderError, assertOk } from './types';
import { readSseStream } from './sse';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

export function createOpenAIProvider(config: OpenAIConfig): AIProvider {
  const baseUrl = config.baseUrl?.replace(/\/$/, '') ?? 'https://api.openai.com/v1';

  return {
    id: 'openai',
    label: 'OpenAI',
    async stream(req: ChatRequest, onDelta) {
      if (!config.apiKey) throw new ProviderError('Missing OpenAI API key');
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          stream: true,
          messages: req.turns.map((t) => ({ role: t.role, content: t.content })),
        }),
        signal: req.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        assertOk(res, text);
        throw new ProviderError('OpenAI: empty stream');
      }

      let full = '';
      for await (const line of readSseStream(res.body)) {
        if (!line || line === '[DONE]') continue;
        try {
          const json = JSON.parse(line);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === 'string' && delta) {
            full += delta;
            onDelta(delta);
          }
        } catch {
          // ignore malformed line
        }
      }
      const result: ChatResult = { text: full };
      return result;
    },
  };
}
