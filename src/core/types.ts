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
  targetLanguage: 'Korean',
  theme: 'dark',
};
