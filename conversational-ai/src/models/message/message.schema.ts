import { prop as Property } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { SenderType } from '../../enums/sender.enum.js';
import type { StringObjectID } from '../../interfaces/entity.interface.js';
import { EntityBase } from '../base/entity.schema.js';
import { UsageType } from '../usage/usage.schema.js';

export class MessageType extends EntityBase {
  @Property({ required: true })
  public content!: string;

  @Property({ required: true, type: Types.ObjectId })
  public senderId!: StringObjectID;

  @Property({ required: true, enum: SenderType, type: String })
  public senderType!: SenderType;

  @Property({ required: true, type: Types.ObjectId })
  public sessionId!: StringObjectID;

  @Property({ default: false, required: true, type: Boolean })
  public isGenerating!: boolean;

  @Property({ required: false })
  public uniqKey?: string;

  @Property({ required: false, type: Types.ObjectId })
  public replyToMessageId?: StringObjectID;

  public metadata?: UsageType;
}

export type MessageInput = Partial<MessageType>;
