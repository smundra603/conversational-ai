import { AgentConverseInput } from '../../interfaces/agent.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { isProviderError } from '../../utils/error.util.js';
import logger from '../../utils/logger.js';
import { agentService } from '../agent/agent.service.js';
import { messageService } from '../message/message.service.js';
import { ProviderFactory } from './providerFactory.js';

/**
 * GenerativeAgent handles conversations with agents using specified generative providers.
 */
class GenerativeAgent {
  constructor() {}

  /**
   * Converse with an agent using the appropriate generative provider.
   * @param AgentConverseInput
   * @returns Response
   */
  async converse({ session, content, generativeMessageId }: AgentConverseInput, context: Context): Promise<string> {
    // Validate agent existence
    const agent = await agentService.getAgent(session.agentId, context);
    if (!agent) {
      throw new Error(`Agent not found: ${String(session.agentId)}`);
    }

    const { primaryProvider, fallbackProvider } = agent;

    try {
      // Use primary provider to generate response
      const primary = ProviderFactory.get(primaryProvider);
      return await primary.generateResponse({ agent, content, generativeMessageId, session }, context);
    } catch (primaryErr) {
      // If primary provider fails, attempt fallback if available
      let errorToThrow: unknown = primaryErr;

      if (isProviderError(primaryErr) && fallbackProvider) {
        try {
          const fallback = ProviderFactory.get(fallbackProvider);
          return await fallback.generateResponse({ agent, session, content, generativeMessageId }, context);
        } catch (fallbackErr) {
          logger.error('Error in fallback provider converse:', fallbackErr);
          errorToThrow = fallbackErr;
        }
      }

      // If both providers fail, log and update message with error response
      logger.error('Error in converse:', errorToThrow);
      const errResponse = `Error generating response. Please try again later....`;
      await messageService.updateMessage(
        {
          id: generativeMessageId.toString(),
          isGenerating: false,
          content: errResponse,
        },
        context,
      );
      return errResponse;
    }
  }
}

export const generativeAgent = new GenerativeAgent();
