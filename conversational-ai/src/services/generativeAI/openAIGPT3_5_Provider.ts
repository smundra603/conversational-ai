import { ProviderType } from '../../enums/agentModel.enum.js';
import { LLMResponseTypeA } from '../../interfaces/agent.interface.js';
import { ExecuteResponsePayload } from '../../interfaces/generative.interface.js';
import { ProviderError } from '../../utils/error.util.js';
import { GenerativeProvider } from './generativeProvider.js';
import { chance, randomInt, randomTextResponse, sleep } from './utils/failoverMock.utils.js';

/**
 * OpenAIGPT3_5Provider provides interaction with the OpenAI GPT-3.5 model.
 * It extends the GenerativeProvider abstract class and implements the required methods.
 */
export class OpenAIGPT3_5Provider extends GenerativeProvider<LLMResponseTypeA> {
  protected provider: ProviderType = ProviderType.GPT3_5;
  protected pricing: number = 0.002; // $0.002 per 1K tokens

  private failureChance = 0.1; // 10% chance to simulate failure
  private rateLimitChance = 0.15; // 15% chance to simulate rate limiting

  constructor({ failureChance = 0.1, rateLimitChance = 0.15 } = {}) {
    super();
    if (failureChance !== undefined) {
      this.failureChance = failureChance;
    }
    if (rateLimitChance !== undefined) {
      this.rateLimitChance = rateLimitChance;
    }
  }

  async callLLM(prompt: string, message: string): Promise<LLMResponseTypeA> {
    const latency = chance(0.3) ? randomInt(800, 1500) : randomInt(100, 300);
    await sleep(latency);

    // fail
    if (chance(this.failureChance)) {
      throw new ProviderError(`${this.provider} internal error`, 500);
    }

    if (chance(this.rateLimitChance)) {
      const retryAfterMs = randomInt(500, 2000);
      throw new ProviderError('Rate limited', 429, retryAfterMs);
    }

    const randomResponse = randomTextResponse();

    return {
      outputText: `${randomResponse}`,
      tokensIn: prompt.split(' ').length + message.split(' ').length,
      tokensOut: randomResponse.split(' ').length,
      latencyMs: latency,
    };
  }

  async executeResponse(prompt: string, message: string): Promise<ExecuteResponsePayload> {
    const response = await this.callLLM(prompt, message);

    return {
      response: response.outputText,
      metadata: {
        tokensIn: response.tokensIn,
        tokensOut: response.tokensOut,
        latencyMs: response.latencyMs,
      },
    };
  }
}
