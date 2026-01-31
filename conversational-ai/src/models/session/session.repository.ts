import { Types } from 'mongoose';
import { Context } from '../../interfaces/context.interface.js';
import { FilterQuery } from '../../interfaces/entity.interface.js';
import { GetAllSessionInput } from '../../interfaces/session.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import { SessionType } from './session.schema.js';

export class SessionRepository extends EntityBaseCrud<typeof SessionType> {
  public constructor() {
    super({
      modelClass: SessionType,
      schemaOptions: {
        collection: 'sessions',
        timestamps: true,
      },
      cacheModel: true,
    });
  }

  async createSession(agentId: string, context: Context): Promise<SessionType | undefined> {
    const SessionModel = await this.getModel(context, this.modelOptions);

    const sessionDoc = new SessionModel({
      agentId,
      createdById: context.userId,
      updatedById: context.userId,
      userId: context.userId,
    });

    const session = await this.create({
      doc: sessionDoc,
      context,
    });

    if (session) {
      return session;
    }
    return;
  }

  async getSessionById(sessionId: string, context: Context): Promise<SessionType | null> {
    const session = await this.findById({
      id: sessionId,
      context,
    });
    return session;
  }

  async getAllSessions(input: GetAllSessionInput, context: Context): Promise<SessionType[]> {
    const query: FilterQuery<SessionType> = {
      userId: new Types.ObjectId(context.userId),
    };

    if (input.agentIds && input.agentIds.length > 0) {
      query.agentId = { $in: input.agentIds };
    }
    if (input.sessionIds && input.sessionIds.length > 0) {
      query._id = { $in: input.sessionIds };
    }

    const paginationOptions = this.buildPaginationOption(input.pagination);
    const sessions = await this.findAll({
      query: query,
      context,
      options: {
        ...paginationOptions,
      },
    });
    return sessions;
  }
}

export const sessionRepository = new SessionRepository();
