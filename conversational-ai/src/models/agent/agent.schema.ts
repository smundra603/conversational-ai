import { prop as Property } from '@typegoose/typegoose';
import { ProviderType } from '../../enums/agentModel.enum.js';
import { EntityBase } from '../base/entity.schema.js';

export class AgentType extends EntityBase {
  @Property({ required: true })
  public name!: string;

  @Property({ required: true, enum: ProviderType, default: ProviderType.GPT3_5, type: String })
  public primaryProvider!: ProviderType;

  @Property({ required: false, enum: ProviderType, type: String })
  public fallbackProvider?: ProviderType;

  @Property({ required: true, type: String })
  public prompt!: string;
}
