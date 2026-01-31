import { ProviderType } from '../../enums/agentModel.enum.js';
import { GenerateResponseInput } from '../../interfaces/agent.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { StringObjectID } from '../../interfaces/entity.interface.js';
import { ExecuteResponsePayload, ResponseMetadata } from '../../interfaces/generative.interface.js';
import { SessionType } from '../../models/session/session.schema.js';
import { withRetry } from '../../utils/retry.js';
import { messageService } from '../message/message.service.js';
import { usageService } from '../usage/usageService.js';

export abstract class GenerativeProvider<T> {
  protected abstract provider: ProviderType;
  protected abstract pricing: number;

  constructor() {}

  protected abstract callLLM(prompt: string, message: string): Promise<T>;
  protected abstract executeResponse(prompt: string, message: string): Promise<ExecuteResponsePayload>;

  private async trackUsage(
    session: SessionType,
    generativeMessageId: StringObjectID,
    metadata: ResponseMetadata,
    context: Context,
  ): Promise<void> {
    await usageService.trackUsage(
      {
        agentId: session.agentId.toString(),
        generativeResponseId: generativeMessageId.toString(),
        provider: this.provider,
        sessionId: session._id.toString(),
        tokensIn: metadata.tokensIn,
        tokensOut: metadata.tokensOut,
        totalTokens: metadata.tokensIn + metadata.tokensOut,
        cost: ((metadata.tokensIn + metadata.tokensOut) / 1000) * this.pricing,
      },
      context,
    );
  }

  private async markGenerationComplete(generativeMessageId: string, content: string, context: Context): Promise<void> {
    await messageService.updateMessage({ id: generativeMessageId, content, isGenerating: false }, context);
  }

  async generateResponse(
    { session, generativeMessageId, content, agent }: GenerateResponseInput,
    context: Context,
  ): Promise<string> {
    // Call LLM with retry logic
    const { metadata, response } = await withRetry<ExecuteResponsePayload>(() =>
      this.executeResponse(agent.prompt, content),
    );

    // Added for clarity and demo purposes
    const updatedResponse = `Response from ${this.provider}: ${response}`;

    // Parallel tasks: mark generation complete and track usage.
    // Should add mongo transactions for consistency.
    await Promise.all([
      this.markGenerationComplete(generativeMessageId.toString(), updatedResponse, context),
      this.trackUsage(session, generativeMessageId, metadata, context),
    ]);

    return updatedResponse;
  }
}
