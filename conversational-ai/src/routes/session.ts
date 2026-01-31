import { FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  CreateSessionRequest,
  GetAllSessionRequest,
  GetSessionMessageRequest,
  GetSessionRequest,
  MessageRequest,
  TranscriptRequest,
} from '../interfaces/session.interface.js';
import { messageService } from '../services/message/message.service.js';
import { sessionService } from '../services/session/session.service.js';
import logger from '../utils/logger.js';

export const sessionRoutes: FastifyPluginAsync = async (app) => {
  app.post('/create', async (req: CreateSessionRequest, res: FastifyReply) => {
    const { agentId } = req.body;
    logger.info(`Creating session for agentId: ${agentId}`);
    const session = await sessionService.createSession({ agentId }, req.context);
    res.send(session).status(200);
  });

  app.get('/list', async (req: GetAllSessionRequest, res: FastifyReply) => {
    logger.info('Fetching all sessions', req.query);
    const sessions = await sessionService.getAllSessions(req.query, req.context);
    res.send({ sessions }).status(200);
  });

  app.get('/:id', async (req: GetSessionRequest, res: FastifyReply) => {
    const { id } = req.params;
    logger.info(`Fetching session details for sessionId: ${id}`);
    const session = await sessionService.getSession(id, req.context);
    res.send(session).status(200);
  });

  app.post('/:id/converse', async (req: MessageRequest, res: FastifyReply) => {
    const { id } = req.params;
    const { message, uniqKey } = req.body;

    logger.info(`Conversing in sessionId: ${id} `);

    const conversation = await messageService.createConversation(
      { content: message, sessionId: id, uniqKey },
      req.context,
    );
    res.send(conversation).status(200);
  });

  app.get('/:id/transcript', async (req: TranscriptRequest, res: FastifyReply) => {
    const { id } = req.params;
    logger.info(`Fetching transcript for sessionId: ${id}`);
    const transcript = await messageService.getTranscript(id, req.context);
    res.send(transcript).status(200);
  });

  app.get('/:id/message/:messageId', async (req: GetSessionMessageRequest, res: FastifyReply) => {
    const { id, messageId } = req.params;
    logger.info(`Fetching messageId: ${messageId} for sessionId: ${id}`);

    const message = await messageService.getMessage({ sessionId: id, messageId }, req.context);
    res.send(message).status(200);
  });
};
