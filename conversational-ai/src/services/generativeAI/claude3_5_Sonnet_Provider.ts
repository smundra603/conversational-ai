import { ProviderType } from '../../enums/agentModel.enum.js';
import { LLMResponseTypeB } from '../../interfaces/agent.interface.js';
import { ExecuteResponsePayload } from '../../interfaces/generative.interface.js';
import { ProviderError } from '../../utils/error.util.js';
import { GenerativeProvider } from './generativeProvider.js';
import { chance, randomInt, randomTextResponse, sleep } from './utils/failoverMock.utils.js';

/**
 * Claude3_5_SonnetProvider provides interaction with the Claude 3.5 Sonnet model.
 * It extends the GenerativeProvider abstract class and implements the required methods.
 */
export class Claude3_5_SonnetProvider extends GenerativeProvider<LLMResponseTypeB> {
  protected provider: ProviderType = ProviderType.Claude3_5_Sonnet;
  protected pricing: number = 0.001; // $0.001 per 1K tokens

  private rateLimitChance = 0.15;

  constructor({ rateLimitChance = 0.15 } = {}) {
    super();
    if (rateLimitChance !== undefined) {
      this.rateLimitChance = rateLimitChance;
    }
  }

  async callLLM(prompt: string, message: string): Promise<LLMResponseTypeB> {
    const latency = randomInt(150, 400);
    await sleep(latency);

    //retry
    if (chance(this.rateLimitChance)) {
      const retryAfterMs = randomInt(500, 2000);
      throw new ProviderError('Rate limited', 429, retryAfterMs);
    }

    const randomResponse1 = randomTextResponse();
    const randomResponse2 = randomTextResponse();

    return {
      choices: [
        {
          message: { content: `${randomResponse1}` },
        },
        {
          message: { content: `${randomResponse2}` },
        },
      ],
      usage: {
        input_tokens: prompt.split(' ').length + message.split(' ').length,
        output_tokens: randomResponse1.split(' ').length + randomResponse2.split(' ').length,
      },
    };
  }

  async executeResponse(prompt: string, message: string): Promise<ExecuteResponsePayload> {
    const response = await this.callLLM(prompt, message);

    return {
      response: response.choices.map((choice) => choice.message.content).join(' '),
      metadata: {
        tokensIn: response.usage.input_tokens,
        tokensOut: response.usage.output_tokens,
      },
    };
  }
}
