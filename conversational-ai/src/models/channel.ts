import { prop as Property } from '@typegoose/typegoose';
export class Channel {
  @Property({ required: true })
  public name!: string;
}
