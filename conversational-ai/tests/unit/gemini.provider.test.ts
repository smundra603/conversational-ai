/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { ProviderType } from '../../src/enums/agentModel.enum.js';

// Make provider utils deterministic (hoisted by Jest)
// jest.mock('../../src/services/generativeAI/utils/failoverMock.utils.js', () => ({
//   chance: () => false,
//   randomInt: () => 101,
//   randomTextResponse: () => 'gemini output',
//   sleep: async () => undefined,
// }));

// import { GoogleGemini1_5Provider } from '../../src/services/generativeAI/googleGemini1_5_Provider.js';

// Mock transitive deps to avoid circular init via provider.ts
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
  randomInt: () => 101,
  randomTextResponse: () => 'gemini output',
  sleep: async () => undefined,
}));

// ✅ Import AFTER mock registration
const { GoogleGemini1_5Provider } = await import('../../src/services/generativeAI/googleGemini1_5_Provider.js');

describe('GoogleGemini1_5_Provider', () => {
  it('executeResponse maps result and token usage', async () => {
    const provider = new GoogleGemini1_5Provider({ failureChance: 0 });
    const out = await provider.executeResponse('sys', 'msg');

    expect(out.response).toBe('gemini output');
    expect(out.metadata.tokensIn).toBeGreaterThan(0);
    expect(out.metadata.tokensOut).toBe('gemini output'.split(' ').length);
    expect((provider as any).provider).toBe(ProviderType.GoogleGemini1_5);
  });
});
