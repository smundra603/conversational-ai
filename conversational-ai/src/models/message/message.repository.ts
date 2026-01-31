import { Types, UpdateQuery } from 'mongoose';
import { Context } from '../../interfaces/context.interface.js';
import { FilterQuery } from '../../interfaces/entity.interface.js';
import { GetAllMessagesInput, GetMessageInput } from '../../interfaces/session.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import { MessageInput, MessageType } from './message.schema.js';

export class MessageRepository extends EntityBaseCrud<typeof MessageType> {
  public constructor() {
    super({
      modelClass: MessageType,
      schemaOptions: {
        collection: 'messages',
        timestamps: true,
      },
      cacheModel: true,
    });
  }

  async createMessage(messageInput: MessageInput, context: Context): Promise<MessageType | undefined> {
    const MessageModel = await this.getModel(context, this.modelOptions);

    const messageDoc = new MessageModel({
      ...messageInput,
      createdById: context.userId,
      updatedById: context.userId,
    });

    const message = await this.create({
      doc: messageDoc,
      context,
    });

    if (message) {
      return message;
    }
    return;
  }

  async updateMessage(
    messageId: string,
    updateData: Partial<MessageInput>,
    context: Context,
  ): Promise<MessageType | null> {
    const updateQuery: UpdateQuery<MessageType> = {
      $set: {
        ...updateData,
      },
    };

    const updatedMessage = await this.findOneAndUpdate({
      query: { _id: new Types.ObjectId(messageId) },
      updateQuery: updateQuery,
      options: { new: true },
      context,
    });

    return updatedMessage;
  }

  async getMessageById(context: Context, messageId: string): Promise<MessageType | null> {
    const message = await this.findById({
      id: new Types.ObjectId(messageId),
      context,
    });
    return message;
  }

  async getAllMessages(input: GetAllMessagesInput, context: Context): Promise<MessageType[]> {
    const { sessionId, senderId, senderType } = input;
    const query: FilterQuery<MessageType> = {};

    if (sessionId) {
      query.sessionId = new Types.ObjectId(sessionId.toString());
    }
    if (senderId) {
      query.senderId = new Types.ObjectId(senderId.toString());
    }
    if (senderType) {
      query.senderType = senderType;
    }

    const messages = await this.findAll({
      query,
      context,
    });

    return messages;
  }

  async getMessage(input: GetMessageInput, context: Context): Promise<MessageType | null> {
    const { sessionId, uniqKey, replyToMessageId, messageId } = input;
    const query: FilterQuery<MessageType> = {};

    if (sessionId) {
      query.sessionId = new Types.ObjectId(sessionId.toString());
    }
    if (uniqKey) {
      query.uniqKey = uniqKey;
    }
    if (replyToMessageId) {
      query.replyToMessageId = new Types.ObjectId(replyToMessageId.toString());
    }
    if (messageId) {
      query._id = new Types.ObjectId(messageId.toString());
    }
    const message = await this.findOne({
      query,
      context,
    });

    return message;
  }
}

export const messageRepository = new MessageRepository();
