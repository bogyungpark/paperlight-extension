import type { Settings } from '@core/types';
import type { AIProvider } from './types';
import { ProviderError } from './types';
import { createLocalProvider } from './localProvider';

export function getActiveProvider(settings: Settings): AIProvider {
  const baseUrl = settings.baseUrl?.trim();
  if (!baseUrl) {
    throw new ProviderError(
      'Inference endpoint URL is empty — set it in Settings.',
    );
  }
  const model = settings.model?.trim();
  if (!model) {
    throw new ProviderError(
      'Model name is empty — set it in Settings.',
    );
  }
  return createLocalProvider({ baseUrl, model });
}
