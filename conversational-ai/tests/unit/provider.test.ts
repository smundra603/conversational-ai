/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { ProviderType } from '../../src/enums/agentModel.enum.js';
import { SessionType } from '../../src/models/session/session.schema.js';

let GenerativeProvider: any;
let messageService: any;
let usageService: any;

beforeAll(async () => {
  jest.unstable_mockModule('../../src/services/message/message.service.js', () => ({
    messageService: { updateMessage: jest.fn(async () => undefined) },
  }));

  jest.unstable_mockModule('../../src/services/usage/usageService.js', () => ({
    usageService: { trackUsage: jest.fn(async () => undefined) },
  }));

  jest.unstable_mockModule('../../src/utils/retry.js', () => ({
    withRetry: async (fn: any) => fn(),
  }));

  const providerMod = await import('../../src/services/generativeAI/generativeProvider.js');
  GenerativeProvider = (providerMod as any).GenerativeProvider;

  const msgMod = await import('../../src/services/message/message.service.js');
  messageService = (msgMod as any).messageService;

  const usageMod = await import('../../src/services/usage/usageService.js');
  usageService = (usageMod as any).usageService;
});

// type Session = { _id: { toString(): string }; agentId: { toString(): string } };

describe('GenerativeProvider base', () => {
  let DummyProvider: any;

  beforeAll(() => {
    // Define the subclass after GenerativeProvider is initialized
    DummyProvider = class extends GenerativeProvider<any> {
      protected provider = ProviderType.GPT3_5;
      protected pricing = 0.002; // $ per 1K tokens

      async callLLM(): Promise<any> {
        return {};
      }
      async executeResponse(): Promise<any> {
        return {
          response: 'hello world',
          metadata: { tokensIn: 10, tokensOut: 20, latencyMs: 100 },
        };
      }
    };
  });

  it('generateResponse updates message, tracks usage and returns tagged response', async () => {
    const prov = new DummyProvider();
    const session: SessionType = { _id: { toString: () => 'sess1' }, agentId: { toString: () => 'agent1' } } as any;
    const context = { requestId: 'req1', tenantId: 't1', userId: 'u1' } as any;

    const result = await prov.generateResponse(
      { session, generativeMessageId: 'msg1', content: 'hi', agent: { prompt: 'p' } as any },
      context,
    );

    expect(result).toBe(`Response from ${ProviderType.GPT3_5}: hello world`);
    expect(messageService.updateMessage).toHaveBeenCalledWith(
      { id: 'msg1', content: result, isGenerating: false },
      context,
    );
    // cost = (10+20)/1000 * 0.002 = 0.00006
    expect(usageService.trackUsage).toHaveBeenCalledWith(
      {
        agentId: 'agent1',
        provider: ProviderType.GPT3_5,
        sessionId: 'sess1',
        tokensIn: 10,
        tokensOut: 20,
        totalTokens: 30,
        cost: (30 / 1000) * 0.002,
      },
      context,
    );
  });
});
