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
  label: string;
  /**
   * Stream the chat completion. The callback fires per token chunk; the
   * returned promise resolves once the stream finishes (or rejects on
   * abort / transport / parser errors).
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
