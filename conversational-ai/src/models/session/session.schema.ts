import { prop as Property } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import type { StringObjectID } from '../../interfaces/entity.interface.js';
import { EntityBase } from '../base/entity.schema.js';

export class SessionType extends EntityBase {
  @Property({ required: true, type: Types.ObjectId })
  public userId!: StringObjectID;

  @Property({ required: true, type: Types.ObjectId })
  public agentId!: StringObjectID;
}
