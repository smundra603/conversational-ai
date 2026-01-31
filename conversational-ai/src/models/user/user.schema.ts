import { prop as Property } from '@typegoose/typegoose';
import { Role } from '../../enums/role.enum.js';
import { UserStatus } from '../../enums/userStatus.enum.js';
import { EntityBase } from '../base/entity.schema.js';

export class UserType extends EntityBase {
  @Property({ required: false })
  public name?: string;

  @Property({ required: true, unique: true })
  public emailId!: string;

  @Property({ required: true, default: UserStatus.ACTIVE, type: String })
  public status!: UserStatus;

  @Property({ required: true, type: [String], default: [Role.USER] })
  public roles!: Role[];
}
