import { prop as Property } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import { ProviderType } from '../../enums/agentModel.enum.js';
import type { StringObjectID } from '../../interfaces/entity.interface.js';
import { EntityBase } from '../base/entity.schema.js';

export class UsageType extends EntityBase {
  @Property({ required: true, type: Types.ObjectId })
  agentId!: StringObjectID;

  @Property({ required: true, type: () => String, enum: ProviderType })
  provider!: ProviderType;

  @Property({ required: true, type: Types.ObjectId })
  sessionId!: StringObjectID;

  @Property({ required: false, type: Types.ObjectId })
  generativeResponseId?: StringObjectID;

  @Property({ required: true })
  tokensIn!: number;

  @Property({ required: true })
  tokensOut!: number;

  @Property({ required: true })
  totalTokens!: number;

  @Property({ required: true })
  cost!: number;
}
