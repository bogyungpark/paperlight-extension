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

export type ProviderId = 'openai' | 'anthropic' | 'gemini';

export interface Settings {
  provider: ProviderId;
  openaiKey: string;
  anthropicKey: string;
  geminiKey: string;
  openaiModel: string;
  anthropicModel: string;
  geminiModel: string;
  /**
   * Optional custom OpenAI-compatible endpoint.
   * Set this to point Paperlight at a self-hosted inference server
   * (Ollama, vLLM, LM Studio, llama.cpp server, etc.) — e.g.
   * `http://192.168.110.110:11434/v1` for Ollama on the LAN.
   */
  openaiBaseUrl: string;
  targetLanguage: string;
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = {
  provider: 'openai',
  openaiKey: '',
  anthropicKey: '',
  geminiKey: '',
  openaiModel: 'gpt-4o-mini',
  anthropicModel: 'claude-haiku-4-5-20251001',
  geminiModel: 'gemini-1.5-flash',
  openaiBaseUrl: '',
  targetLanguage: 'Korean',
  theme: 'dark',
};
