/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { ProviderType } from '../../src/enums/agentModel.enum.js';

let OpenAIGPT3_5Provider: any;

beforeAll(async () => {
  // Mock dependencies before importing provider (ESM)
  jest.unstable_mockModule('../../src/services/message/message.service.js', () => ({
    messageService: { updateMessage: jest.fn(async () => undefined) },
  }));

  jest.unstable_mockModule('../../src/services/usage/usageService.js', () => ({
    usageService: { trackUsage: jest.fn(async () => undefined) },
  }));

  jest.unstable_mockModule('../../src/utils/retry.js', () => ({
    withRetry: async (fn: any) => fn(),
  }));

  jest.unstable_mockModule('../../src/services/generativeAI/utils/failoverMock.utils.js', () => ({
    chance: () => false,
    randomInt: () => 123,
    randomTextResponse: () => 'unit test response',
    sleep: async () => undefined,
  }));

  const mod = await import('../../src/services/generativeAI/openAIGPT3_5_Provider.js');
  OpenAIGPT3_5Provider = (mod as any).OpenAIGPT3_5Provider;
});

describe('OpenAIGPT3_5Provider', () => {
  it('executeResponse maps fields into generic payload', async () => {
    const provider = new OpenAIGPT3_5Provider({ failureChance: 0, rateLimitChance: 0 });
    const out = await provider.executeResponse('system prompt', 'hello');

    expect(out.response).toBe('unit test response');
    expect(out.metadata.tokensIn).toBeGreaterThan(0);
    expect(out.metadata.tokensOut).toBe('unit test response'.split(' ').length);
    expect((provider as any).provider).toBe(ProviderType.GPT3_5);
  });
});
