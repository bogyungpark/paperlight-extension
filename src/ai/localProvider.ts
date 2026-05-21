import type { AIProvider, ChatRequest, ChatResult } from './types';
import { ProviderError, assertOk } from './types';
import { readSseStream } from './sse';

export interface LocalProviderConfig {
  /** Base URL ending at `/v1`. */
  baseUrl: string;
  /** Model id as the endpoint exposes it via `GET /v1/models`. */
  model: string;
}

/**
 * Driver for any OpenAI-compatible inference endpoint (vLLM, Ollama,
 * LM Studio, llama.cpp server, …). Streams SSE-style chunks.
 *
 * Self-hosted servers ignore the Authorization header but require it to
 * parse, so we send a constant `Bearer local` token.
 */
export function createLocalProvider(config: LocalProviderConfig): AIProvider {
  const baseUrl = config.baseUrl.replace(/\/$/, '');

  return {
    label: 'Self-hosted',
    async stream(req: ChatRequest, onDelta) {
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Bearer local',
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
        throw new ProviderError('Inference endpoint returned an empty stream');
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
