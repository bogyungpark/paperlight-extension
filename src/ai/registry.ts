import type { Settings } from '@core/types';
import type { AIProvider } from './types';
import { ProviderError } from './types';
import { createOpenAIProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGeminiProvider } from './gemini';

export function getActiveProvider(settings: Settings): AIProvider {
  switch (settings.provider) {
    case 'openai': {
      const baseUrl = settings.openaiBaseUrl?.trim() || undefined;
      const usingLocalServer = !!baseUrl;
      if (!settings.openaiKey && !usingLocalServer) {
        throw new ProviderError('OpenAI API key is empty — set it in Settings.');
      }
      return createOpenAIProvider({
        // Local OpenAI-compatible servers (Ollama, vLLM, LM Studio) typically
        // ignore the key, but the Authorization header must still parse.
        apiKey: settings.openaiKey || 'local',
        model: settings.openaiModel,
        baseUrl,
      });
    }
    case 'anthropic':
      if (!settings.anthropicKey)
        throw new ProviderError('Anthropic API key is empty — set it in Settings.');
      return createAnthropicProvider({
        apiKey: settings.anthropicKey,
        model: settings.anthropicModel,
      });
    case 'gemini':
      if (!settings.geminiKey) throw new ProviderError('Gemini API key is empty — set it in Settings.');
      return createGeminiProvider({ apiKey: settings.geminiKey, model: settings.geminiModel });
    default:
      throw new ProviderError(`Unknown provider: ${settings.provider as string}`);
  }
}
