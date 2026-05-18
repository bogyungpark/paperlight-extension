import type { AIProvider, ChatRequest, ChatResult } from './types';
import { ProviderError, assertOk } from './types';

export interface GeminiConfig {
  apiKey: string;
  model: string;
  baseUrl?: string;
}

interface GeminiPart {
  text: string;
}
interface GeminiContent {
  role: 'user' | 'model';
  parts: GeminiPart[];
}

export function createGeminiProvider(config: GeminiConfig): AIProvider {
  const baseUrl = config.baseUrl?.replace(/\/$/, '') ?? 'https://generativelanguage.googleapis.com/v1beta';

  return {
    id: 'gemini',
    label: 'Gemini',
    async stream(req: ChatRequest, onDelta) {
      if (!config.apiKey) throw new ProviderError('Missing Gemini API key');

      const systemTurns = req.turns.filter((t) => t.role === 'system');
      const contents: GeminiContent[] = req.turns
        .filter((t) => t.role !== 'system')
        .map((t) => ({
          role: t.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: t.content }],
        }));
      const systemInstruction =
        systemTurns.length > 0
          ? { role: 'user', parts: [{ text: systemTurns.map((t) => t.content).join('\n\n') }] }
          : undefined;

      const url = `${baseUrl}/models/${encodeURIComponent(config.model)}:streamGenerateContent?alt=sse&key=${encodeURIComponent(config.apiKey)}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents, systemInstruction }),
        signal: req.signal,
      });
      if (!res.ok || !res.body) {
        const text = await res.text().catch(() => '');
        assertOk(res, text);
        throw new ProviderError('Gemini: empty stream');
      }

      let full = '';
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const raw of lines) {
          const line = raw.trim();
          if (!line.startsWith('data:')) continue;
          const data = line.slice(5).trim();
          if (!data || data === '[DONE]') continue;
          try {
            const json = JSON.parse(data);
            const parts = json?.candidates?.[0]?.content?.parts ?? [];
            for (const p of parts) {
              if (typeof p?.text === 'string' && p.text) {
                full += p.text;
                onDelta(p.text);
              }
            }
          } catch {
            // ignore
          }
        }
      }
      return { text: full } as ChatResult;
    },
  };
}
