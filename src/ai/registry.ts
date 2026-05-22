import type { Settings, CloudProviderId } from '@core/types';
import { CLOUD_PROVIDER_META } from '@core/types';
import type { AIProvider } from './types';
import { ProviderError } from './types';
import { createLocalProvider } from './localProvider';
import { createOpenAIProvider } from './openai';
import { createAnthropicProvider } from './anthropic';
import { createGeminiProvider } from './gemini';

export function getActiveProvider(settings: Settings): AIProvider {
  if (settings.mode === 'local') {
    return buildLocalProvider(settings);
  }
  return buildCloudProvider(settings);
}

function buildLocalProvider(settings: Settings): AIProvider {
  const baseUrl = settings.localBaseUrl?.trim();
  if (!baseUrl) {
    throw new ProviderError(
      'Self-hosted endpoint URL is empty — set it in Settings.',
    );
  }
  const model = settings.localModel?.trim();
  if (!model) {
    throw new ProviderError(
      'Self-hosted model name is empty — set it in Settings.',
    );
  }
  return createLocalProvider({ baseUrl, model });
}

function buildCloudProvider(settings: Settings): AIProvider {
  const providerId: CloudProviderId = settings.cloudProvider;
  const meta = CLOUD_PROVIDER_META[providerId];
  const conf = settings.cloud[providerId];
  if (!conf?.apiKey?.trim()) {
    throw new ProviderError(
      `${meta.label} API key is empty — set it in Settings (Cloud API tab).`,
    );
  }
  if (!conf.model?.trim()) {
    throw new ProviderError(
      `${meta.label} model name is empty — set it in Settings.`,
    );
  }
  switch (providerId) {
    case 'openai':
      return createOpenAIProvider({ apiKey: conf.apiKey, model: conf.model });
    case 'anthropic':
      return createAnthropicProvider({ apiKey: conf.apiKey, model: conf.model });
    case 'gemini':
      return createGeminiProvider({ apiKey: conf.apiKey, model: conf.model });
    default: {
      const exhaustive: never = providerId;
      throw new ProviderError(`Unknown cloud provider: ${exhaustive as string}`);
    }
  }
}
