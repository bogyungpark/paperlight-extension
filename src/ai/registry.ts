import type { Settings } from '@core/types';
import type { AIProvider } from './types';
import { ProviderError } from './types';
import { createOpenAIProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGeminiProvider } from './gemini';

export function getActiveProvider(settings: Settings): AIProvider {
  switch (settings.provider) {
    case 'openai':
      if (!settings.openaiKey) throw new ProviderError('OpenAI API key is empty — set it in Settings.');
      return createOpenAIProvider({ apiKey: settings.openaiKey, model: settings.openaiModel });
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
