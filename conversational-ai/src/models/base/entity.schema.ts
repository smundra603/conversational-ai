import { prop as Property } from '@typegoose/typegoose';
import { Types } from 'mongoose';
import * as entity from '../../interfaces/entity.interface.js';

/**
 * Base entity schema with common fields for all entities.
 */
export class EntityBase {
  _id!: entity.StringObjectID;

  id!: string;

  @Property({ default: Date.now, type: Date })
  public createdAt!: Date;

  @Property({ default: Date.now, type: Date })
  public updatedAt!: Date;

  @Property({ required: true, type: Types.ObjectId })
  public createdById!: entity.StringObjectID;

  @Property({ required: true, type: Types.ObjectId })
  public updatedById!: entity.StringObjectID;
}
