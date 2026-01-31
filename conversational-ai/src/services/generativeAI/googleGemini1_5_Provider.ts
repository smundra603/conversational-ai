import { ProviderType } from '../../enums/agentModel.enum.js';
import { LLMResponseTypeC } from '../../interfaces/agent.interface.js';
import { ExecuteResponsePayload } from '../../interfaces/generative.interface.js';
import { ProviderError } from '../../utils/error.util.js';
import { GenerativeProvider } from './generativeProvider.js';

import { chance, randomInt, randomTextResponse, sleep } from './utils/failoverMock.utils.js';

/**
 * GoogleGemini1_5Provider provides interaction with the Google Gemini 1.5 model.
 * It extends the GenerativeProvider abstract class and implements the required methods.
 */
export class GoogleGemini1_5Provider extends GenerativeProvider<LLMResponseTypeC> {
  protected provider: ProviderType = ProviderType.GoogleGemini1_5;
  protected pricing: number = 0.003; // $0.003 per 1K tokens

  private failureChance = 0.2;

  constructor({ failureChance = 0.2 } = {}) {
    super();
    if (failureChance !== undefined) {
      this.failureChance = failureChance;
    }
  }

  async callLLM(prompt: string, message: string): Promise<LLMResponseTypeC> {
    const latency = randomInt(150, 400);
    await sleep(latency);
    // fail
    if (chance(this.failureChance)) {
      throw new ProviderError(`${this.provider} internal error`, 500);
    }

    const randomResponse = randomTextResponse();

    return {
      result: `${randomResponse}`,
      token_usage: {
        in: prompt.split(' ').length + message.split(' ').length,
        out: randomResponse.split(' ').length,
      },
    };
  }

  async executeResponse(prompt: string, message: string): Promise<ExecuteResponsePayload> {
    const response = await this.callLLM(prompt, message);

    return {
      response: response.result,
      metadata: {
        tokensIn: response.token_usage.in,
        tokensOut: response.token_usage.out,
      },
    };
  }
}
