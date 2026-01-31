import mongoose from 'mongoose';
import { SenderType } from '../../enums/sender.enum.js';
import { Context } from '../../interfaces/context.interface.js';
import {
  ConversationPayload,
  CreateConversationInput,
  CreateConversationPayload,
  GetMessageInput,
  SendMessageInput,
  UpdateMessageInput,
} from '../../interfaces/session.interface.js';
import { messageRepository } from '../../models/message/message.repository.js';
import { MessageType } from '../../models/message/message.schema.js';
import { UsageType } from '../../models/usage/usage.schema.js';
import logger from '../../utils/logger.js';
import { generativeAgent } from '../generativeAI/generativeAgent.js';
import { sessionService } from '../session/session.service.js';
import { usageService } from '../usage/usageService.js';

export class MessageService {
  async sendMessage(sendMessageInput: SendMessageInput, context: Context): Promise<MessageType> {
    try {
      const { sessionId, senderType, isGenerating } = sendMessageInput;
      const toCreateMessage: Partial<MessageType> = {
        ...sendMessageInput,
        senderId: context.userId,
      };

      if (senderType === SenderType.AGENT) {
        const session = await sessionService.getSession(sessionId, context);
        if (!session) {
          throw new Error('Session not found');
        }
        toCreateMessage.isGenerating = isGenerating ?? true;
        toCreateMessage.senderId = session.agentId;
      }

      const message = await messageRepository.createMessage(toCreateMessage, context);

      if (!message) {
        throw new Error('Failed to send message');
      }
      return message;
    } catch (error) {
      logger.error('Error in sendMessage:', error);
      throw error;
    }
  }

  async updateMessage(updateMessageInput: UpdateMessageInput, context: Context): Promise<MessageType | null> {
    const { id, ...updateData } = updateMessageInput;
    const updatedMessage = await messageRepository.updateMessage(id, updateData, context);
    return updatedMessage;
  }

  async getUniqConversation(
    { sessionId, uniqKey }: { sessionId: string; uniqKey?: string },
    context: Context,
  ): Promise<ConversationPayload | null> {
    if (!uniqKey) {
      return null;
    }
    const existingMessage = await messageRepository.getMessage({ sessionId: sessionId, uniqKey: uniqKey }, context);
    if (!existingMessage) {
      return null;
    }

    const agentResponse = await messageRepository.getMessage(
      { replyToMessageId: existingMessage._id.toString() },
      context,
    );

    if (!agentResponse) {
      return null;
    }

    logger.info(`Idempotent conversation found for uniqKey: ${uniqKey}`);
    return {
      agentResponse,
      userMessage: existingMessage,
    };
  }

  /**
   * Create a conversation consisting of user message and agent response within a session
   * @param createConversationInput
   * @param context
   * @returns Conversation
   */
  async createConversation(
    createConversationInput: CreateConversationInput,
    context: Context,
  ): Promise<CreateConversationPayload> {
    // Initialize the message collection and start a MongoDB session for transaction
    await messageRepository.initCollection(context); // ensure model is initialized
    const mongoSession = await mongoose.startSession();
    mongoSession.startTransaction({ readConcern: { level: 'snapshot' }, writeConcern: { w: 'majority' } });

    try {
      // Validate uniqKey for idempotency
      if (!createConversationInput.uniqKey) {
        throw new Error('uniqKey is required for idempotent conversation creation');
      }

      // Pass the mongoSession in context for transactional operations
      const updatedContext = { ...context, session: mongoSession };

      // Check for existing conversation with the same uniqKey
      const session = await sessionService.getSession(createConversationInput.sessionId, context);
      if (!session) {
        throw new Error('Session not found');
      }

      // check if conversation with the same uniqKey exists and return it if found
      const existingConversation = await this.getUniqConversation(
        { sessionId: createConversationInput.sessionId, uniqKey: createConversationInput.uniqKey },
        updatedContext,
      );

      if (existingConversation) {
        await mongoSession.commitTransaction();
        await mongoSession.endSession();
        return existingConversation;
      }

      // Create user message
      const userMessage = await this.sendMessage(
        {
          sessionId: createConversationInput.sessionId,
          content: createConversationInput.content,
          senderType: SenderType.USER,
          uniqKey: createConversationInput.uniqKey,
        },
        updatedContext,
      );

      if (!userMessage) {
        throw new Error('Failed to create conversation');
      }

      // Create agent placeholder message
      const agentMessage = await this.sendMessage(
        {
          sessionId: createConversationInput.sessionId,
          content: 'Generating Response...',
          senderType: SenderType.AGENT,
          isGenerating: true,
          replyToMessageId: userMessage._id.toString(),
        },
        updatedContext,
      );

      // ask agent to generate response
      if (!agentMessage) {
        throw new Error('Failed to create conversation');
      }

      // commit transaction
      await mongoSession.commitTransaction();
      await mongoSession.endSession();

      // Call generative agent to converse asynchronously
      try {
        generativeAgent.converse(
          { content: agentMessage.content, generativeMessageId: agentMessage._id, session },
          context,
        );
      } catch (error) {
        logger.error('Error in agent converse:', error);
      }

      // Return the created conversation
      return {
        agentResponse: agentMessage,
        userMessage,
      };
    } catch (error) {
      logger.error('Error in createConversation:', error);
      throw error;
    } finally {
      if (mongoSession.inTransaction()) {
        await mongoSession.abortTransaction();
      }
      await mongoSession.endSession();
    }
  }

  /**
   * Get the transcript (all messages) of a session
   * @param sessionId
   * @param context
   * @returns Session Messages
   */
  async getTranscript(sessionId: string, context: Context): Promise<MessageType[]> {
    const messages = await messageRepository.getAllMessages({ sessionId }, context);

    const allUsages = await usageService.getAllUsages(
      {
        sessionIds: [sessionId],
      },
      context,
    );

    const usageMap: Record<string, UsageType> = {};
    allUsages.forEach((usage) => {
      if (usage.generativeResponseId) {
        usageMap[usage.generativeResponseId.toString()] = usage;
      }
    });

    messages.forEach((message) => {
      if (message.senderType === SenderType.AGENT && !message.isGenerating) {
        const usage = usageMap[message._id.toString()];
        if (usage) {
          message.metadata = usage;
        }
      }
    });

    return messages;
  }

  async getMessage(input: GetMessageInput, context: Context): Promise<MessageType | null> {
    const message = await messageRepository.getMessage(input, context);

    if (message?.senderType === SenderType.AGENT && !message.isGenerating) {
      const usage = await usageService.getUsage(
        {
          generativeResponseId: message._id.toString(),
        },
        context,
      );

      if (usage) {
        message.metadata = usage;
      }
    }
    return message;
  }
}

export const messageService = new MessageService();
