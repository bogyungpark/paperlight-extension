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

/**
 * Where chat completions are routed.
 * - `local`: a self-hosted OpenAI-compatible endpoint (vLLM / Ollama / …)
 * - `cloud`: a managed AI provider, picked by `cloudProvider`
 */
export type Mode = 'local' | 'cloud';

export type CloudProviderId = 'openai' | 'anthropic' | 'gemini';

export interface CloudProviderSettings {
  apiKey: string;
  model: string;
}

export interface Settings {
  mode: Mode;

  /** Self-hosted endpoint, base URL ending at `/v1` */
  localBaseUrl: string;
  /** Model id as that endpoint reports it */
  localModel: string;

  /** Active cloud provider when `mode === 'cloud'` */
  cloudProvider: CloudProviderId;
  /** Per-provider key + model (kept around so switching providers is non-destructive) */
  cloud: Record<CloudProviderId, CloudProviderSettings>;

  targetLanguage: string;
  theme: 'system' | 'light' | 'dark';
}

export const DEFAULT_SETTINGS: Settings = {
  mode: 'local',
  localBaseUrl: 'http://192.168.110.106:8001/v1',
  localModel: 'Qwen/Qwen2.5-32B-Instruct-AWQ',
  cloudProvider: 'openai',
  cloud: {
    openai: { apiKey: '', model: 'gpt-4o-mini' },
    anthropic: { apiKey: '', model: 'claude-haiku-4-5-20251001' },
    gemini: { apiKey: '', model: 'gemini-1.5-flash' },
  },
  targetLanguage: 'Korean',
  theme: 'dark',
};

/**
 * UI metadata for each cloud provider. Centralised so the Options form
 * can render dynamically and the EmptyState can name the active service.
 */
export interface CloudProviderMeta {
  id: CloudProviderId;
  label: string;
  tagline: string;
  keyPlaceholder: string;
  keyDocsUrl: string;
  modelPlaceholder: string;
  modelPresets: string[];
}

export const CLOUD_PROVIDER_META: Record<CloudProviderId, CloudProviderMeta> = {
  openai: {
    id: 'openai',
    label: 'OpenAI',
    tagline: 'GPT-4o family',
    keyPlaceholder: 'sk-…',
    keyDocsUrl: 'https://platform.openai.com/api-keys',
    modelPlaceholder: 'gpt-4o-mini',
    modelPresets: ['gpt-4o-mini', 'gpt-4o', 'gpt-4.1-mini', 'o4-mini'],
  },
  anthropic: {
    id: 'anthropic',
    label: 'Anthropic',
    tagline: 'Claude 4.x family',
    keyPlaceholder: 'sk-ant-…',
    keyDocsUrl: 'https://console.anthropic.com/settings/keys',
    modelPlaceholder: 'claude-haiku-4-5-20251001',
    modelPresets: [
      'claude-haiku-4-5-20251001',
      'claude-sonnet-4-6',
      'claude-opus-4-7',
    ],
  },
  gemini: {
    id: 'gemini',
    label: 'Google Gemini',
    tagline: 'AI Studio · free tier available',
    keyPlaceholder: 'AIza…',
    keyDocsUrl: 'https://aistudio.google.com/apikey',
    modelPlaceholder: 'gemini-1.5-flash',
    modelPresets: ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.0-flash'],
  },
};
