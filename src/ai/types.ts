import type { ProviderId } from '@core/types';

export interface ChatTurn {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface ChatRequest {
  turns: ChatTurn[];
  signal?: AbortSignal;
}

export interface ChatResult {
  text: string;
}

export interface AIProvider {
  id: ProviderId;
  label: string;
  /**
   * Send a chat request and return the complete reply.
   * `stream` is the streaming variant; non-streaming calls into it and joins chunks.
   */
  stream(req: ChatRequest, onDelta: (chunk: string) => void): Promise<ChatResult>;
}

export class ProviderError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
  }
}

export function assertOk(res: Response, body?: string): void {
  if (!res.ok) {
    const snippet = body && body.length > 0 ? ` — ${body.slice(0, 200)}` : '';
    throw new ProviderError(`${res.status} ${res.statusText}${snippet}`, res.status);
  }
}
