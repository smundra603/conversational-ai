import { FastifyRequest } from 'fastify';
import { SenderType } from '../enums/sender.enum.js';
import { MessageType } from '../models/message/message.schema.js';
import { Pagination, StringObjectID } from './entity.interface.js';

export type CreateSessionInput = {
  agentId: string;
};

export type CreateSessionRequest = FastifyRequest<{
  Body: CreateSessionInput;
}>;

export type GetSessionRequest = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

export type CreateSessionResponse = {
  sessionId: string;
  expiresAt: number;
};

export type MessageRequest = FastifyRequest<{
  Body: {
    message: string;
    uniqKey: string;
  };
  Params: {
    id: string;
  };
}>;

export type MessageResponse = {
  messageId: string;
};

export type TranscriptRequest = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

export type TranscriptResponse = {
  transcript: Array<MessageType>;
};

export type SendMessageInput = {
  sessionId: string;
  senderType: SenderType;
  content: string;
  uniqKey?: string;
  isGenerating?: boolean;
  replyToMessageId?: string;
};

export type UpdateMessageInput = Partial<MessageType> & {
  id: string;
};

export type CreateConversationInput = {
  sessionId: string;
  uniqKey: string;
  content: string;
};

export type CreateConversationPayload = {
  userMessage: MessageType;
  agentResponse: MessageType;
};

export type ConversationPayload = CreateConversationPayload;

export type GetAllMessagesInput = {
  sessionId?: StringObjectID;
  senderType?: SenderType;
  senderId?: StringObjectID;
};

export type GetMessageInput = {
  uniqKey?: string;
  sessionId?: string;
  replyToMessageId?: string;
  messageId?: string;
};

export type GetAllSessionInput = {
  sessionIds?: StringObjectID[];
  agentIds?: StringObjectID[];
  pagination?: Pagination;
};

export type GetAllSessionRequest = FastifyRequest<{
  Querystring: GetAllSessionInput;
}>;

export type GetSessionMessageRequest = FastifyRequest<{
  Params: {
    id: string;
    messageId: string;
  };
}>;
