/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { ProviderType } from '../../src/enums/agentModel.enum.js';

let Claude3_5_SonnetProvider: any;

beforeAll(async () => {
  // Mock transitive deps used by provider.ts to avoid circular init
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
    randomInt: () => 111,
    randomTextResponse: () => 'alpha beta gamma',
    sleep: async () => undefined,
  }));

  const mod = await import('../../src/services/generativeAI/claude3_5_Sonnet_Provider.js');
  Claude3_5_SonnetProvider = (mod as any).Claude3_5_SonnetProvider;
});

describe('Claude3_5_SonnetProvider', () => {
  it('executeResponse concatenates choices and maps usage', async () => {
    const provider = new Claude3_5_SonnetProvider({ rateLimitChance: 0 });

    const out = await provider.executeResponse('sys', 'msg');

    expect(out.response).toContain('alpha beta gamma');
    expect(out.metadata.tokensIn).toBeGreaterThan(0);
    expect(out.metadata.tokensOut).toBeGreaterThan(0);
    expect((provider as any).provider).toBe(ProviderType.Claude3_5_Sonnet);
  });
});
