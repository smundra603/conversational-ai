import { prop as Property } from '@typegoose/typegoose';
import { StringObjectID } from '../../interfaces/entity.interface.js';

class APIKey {
  @Property({ required: true })
  public key!: string;

  @Property({ required: true })
  public name!: string;

  @Property({ required: true, type: Date })
  public createdAt!: Date;

  @Property({ required: false, type: Date })
  public expiresAt?: Date;
}

export class TenantType {
  _id!: StringObjectID;

  id!: string;

  @Property({ default: Date.now, type: Date })
  public createdAt!: Date;

  @Property({ default: Date.now, type: Date })
  public updatedAt!: Date;

  @Property({ required: true })
  public name!: string;

  @Property({ required: true, unique: true })
  public domain!: string;

  @Property({ required: true })
  public adminEmail!: string;

  @Property({ required: true, unique: true })
  public apiKey!: string;

  @Property({ required: true, default: [], type: () => APIKey })
  public apiKeys!: APIKey[];
}
