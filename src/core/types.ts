export type AIIntent = 'explain' | 'translate' | 'summarize' | 'chat';

export interface SelectionPayload {
  text: string;
  sourceUrl: string | null;
  pageNumber?: number | null;
  documentTitle?: string | null;
}

export interface AIRequestMessage {
  type: 'paperlight:ai-request';
  intent: AIIntent;
  selection: string;
  sourceUrl: string | null;
  pageNumber?: number | null;
  documentTitle?: string | null;
  fullContext?: string | null;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: number;
  intent?: AIIntent;
  citations?: ChatCitation[];
  pending?: boolean;
  error?: string | null;
}

export interface ChatCitation {
  pageNumber: number;
  snippet: string;
}

export interface Settings {
  /**
   * Base URL of an OpenAI-compatible inference endpoint (vLLM / Ollama /
   * LM Studio / llama.cpp server / …). The path ends at `/v1` —
   * `chat/completions` and friends are appended automatically.
   */
  baseUrl: string;
  /**
   * Model id as the endpoint reports it via `GET /v1/models`.
   * For vLLM this is the HF repo, e.g. `Qwen/Qwen2.5-32B-Instruct-AWQ`.
   * For Ollama this is the tag, e.g. `qwen2.5:32b-instruct-q4_K_M`.
   */
  model: string;
  targetLanguage: string;
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = {
  baseUrl: 'http://192.168.110.106:8001/v1',
  model: 'Qwen/Qwen2.5-32B-Instruct-AWQ',
  targetLanguage: 'Korean',
  theme: 'dark',
};
