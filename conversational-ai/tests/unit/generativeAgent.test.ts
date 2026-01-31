/* eslint-disable @typescript-eslint/no-explicit-any */
import { jest } from '@jest/globals';
import { ProviderType } from '../../src/enums/agentModel.enum.js';

let generativeAgent: any;
let ProviderFactory: any;
let messageService: any;

beforeAll(async () => {
  jest.unstable_mockModule('../../src/services/message/message.service.js', () => ({
    messageService: { updateMessage: jest.fn(async () => undefined) },
  }));

  jest.unstable_mockModule('../../src/services/agent/agent.service.js', () => ({
    agentService: {
      getAgent: jest.fn(async () => ({
        _id: 'agent1',
        prompt: 'You are helpful',
        primaryProvider: ProviderType.GPT3_5,
        fallbackProvider: ProviderType.GoogleGemini1_5,
      })),
    },
  }));

  jest.unstable_mockModule('../../src/services/generativeAI/providerFactory.js', () => ({
    ProviderFactory: {
      get: jest.fn(),
    },
  }));

  jest.unstable_mockModule('../../src/utils/retry.js', () => ({
    withRetry: async (fn: any) => fn(),
  }));

  // Ensure fallback path executes by treating all errors as provider errors
  jest.unstable_mockModule('../../src/utils/error.util.js', () => ({
    isProviderError: () => true,
    ProviderError: class {},
  }));

  const agentMod = await import('../../src/services/generativeAI/generativeAgent.js');
  generativeAgent = (agentMod as any).generativeAgent;

  const providerFactoryModule = await import('../../src/services/generativeAI/providerFactory.js');
  ProviderFactory = (providerFactoryModule as any).ProviderFactory;

  const messageModule = await import('../../src/services/message/message.service.js');
  messageService = (messageModule as any).messageService;
});

const session: any = { _id: 's1', agentId: 'agent1' };
const context: any = { requestId: 'r1', tenantId: 't1', userId: 'u1' };

function makeProvider(ok: boolean, tag: string) {
  return {
    generateResponse: ok
      ? (jest.fn(async () => `ok-${tag}`) as any)
      : (jest.fn(async () => {
          throw new Error(`fail-${tag}`);
        }) as any),
  } as any;
}

describe('GenerativeAgent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    if (ProviderFactory && ProviderFactory.get && 'mockReset' in ProviderFactory.get) {
      ProviderFactory.get.mockReset();
    }
  });

  it('uses primary provider on success', async () => {
    ProviderFactory.get
      .mockReturnValueOnce(makeProvider(true, 'primary'))
      .mockReturnValueOnce(makeProvider(true, 'fallback'));

    const out = await generativeAgent.converse({ session, content: 'hi', generativeMessageId: 'm1' } as any, context);

    expect(out).toBe('ok-primary');
    expect(ProviderFactory.get).toHaveBeenCalledWith(ProviderType.GPT3_5);
  });

  it('falls back when primary fails and fallback succeeds', async () => {
    ProviderFactory.get
      .mockReturnValueOnce(makeProvider(false, 'primary'))
      .mockReturnValueOnce(makeProvider(true, 'fallback'));

    const out = await generativeAgent.converse({ session, content: 'hi', generativeMessageId: 'm2' } as any, context);

    expect(out).toBe('ok-fallback');
    expect(ProviderFactory.get).toHaveBeenCalledTimes(2);
  });

  it('returns error response when both fail', async () => {
    ProviderFactory.get
      .mockReturnValueOnce(makeProvider(false, 'primary'))
      .mockReturnValueOnce(makeProvider(false, 'fallback'));

    const out = await generativeAgent.converse({ session, content: 'hi', generativeMessageId: 'm3' } as any, context);

    expect(out).toBe('Error generating response. Please try again later....');
    expect(messageService.updateMessage).toHaveBeenCalledWith(
      { id: 'm3', isGenerating: false, content: expect.any(String) },
      context,
    );
  });
});
