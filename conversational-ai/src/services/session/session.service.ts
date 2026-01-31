import { Context } from '../../interfaces/context.interface.js';
import { CreateSessionInput, GetAllSessionInput } from '../../interfaces/session.interface.js';
import { sessionRepository } from '../../models/session/session.repository.js';
import { SessionType } from '../../models/session/session.schema.js';
import { agentService } from '../agent/agent.service.js';

class SessionService {
  async getSession(sessionId: string, context: Context): Promise<SessionType | null> {
    const session = await sessionRepository.getSessionById(sessionId, context);
    return session;
  }

  async getAllSessions(input: GetAllSessionInput, context: Context): Promise<SessionType[] | null> {
    const sessions = await sessionRepository.getAllSessions(input, context);
    return sessions;
  }

  /**
   * Create a new session with the given agentId
   * @param input
   * @param context
   * @returns Session
   */

  async createSession(input: CreateSessionInput, context: Context): Promise<SessionType | undefined> {
    // Validate if agent exists
    const agent = await agentService.getAgent(input.agentId, context);
    if (!agent) {
      throw new Error(`Agent with id ${input.agentId} not found`);
    }

    const session = await sessionRepository.createSession(input.agentId, context);
    return session;
  }
}

export const sessionService = new SessionService();
