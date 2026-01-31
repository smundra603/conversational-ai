// providers/ProviderFactory.ts

import { ProviderType } from '../../enums/agentModel.enum.js';
import { Claude3_5_SonnetProvider } from './claude3_5_Sonnet_Provider.js';
import { GenerativeProvider } from './generativeProvider.js';
import { GoogleGemini1_5Provider } from './googleGemini1_5_Provider.js';
import { OpenAIGPT3_5Provider } from './openAIGPT3_5_Provider.js';

/**
 * Factory class to get instances of Generative Providers based on ProviderType
 */
export class ProviderFactory {
  private static providers: Record<ProviderType, GenerativeProvider<unknown>> = {
    [ProviderType.GPT3_5]: new OpenAIGPT3_5Provider(),
    [ProviderType.Claude3_5_Sonnet]: new Claude3_5_SonnetProvider(),
    [ProviderType.GoogleGemini1_5]: new GoogleGemini1_5Provider(), // Placeholder for GPT-4 provider
  };

  /**
   * Get GenerativeProvider by ProviderType
   * @param type
   * @returns GenerativeProvider
   */
  static get(type: ProviderType): GenerativeProvider<unknown> {
    return this.providers[type];
  }
}
