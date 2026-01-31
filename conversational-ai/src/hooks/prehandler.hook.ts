import { FastifyInstance, FastifyReply, FastifyRequest } from 'fastify';
import { Context } from '../interfaces/context.interface.js';
import { authorizeRequest } from '../utils/auth.js';
import logger from '../utils/logger.js';
import { getRequestId as getIncomingRequestId } from '../utils/request.js';
import { requestContext } from '../utils/requestContext.js';

declare module 'fastify' {
  interface FastifyRequest {
    context: Context;
  }
}

export const registerOnRequestHook = async (app: FastifyInstance): Promise<void> => {
  app.addHook('onRequest', async (req: FastifyRequest, res: FastifyReply) => {
    const requestId = getIncomingRequestId(req);
    // Persist requestId in async context for downstream logs
    requestContext.enterWith({ requestId });

    // Surface request id to clients
    res.header('x-request-id', requestId);

    logger.debug(`Incoming request: ${req.method} ${req.url} `);

    // Allow public and health endpoints without authorization
    if (req.url === '/health' || req.url === '/ping' || req.url.startsWith('/public/') || req.url === '/auth/refresh') {
      logger.debug('Here public route', req.url);
      // Public route, no authorization needed
      // Optionally attach minimal context for public routes
      req.context = { requestId, tenantId: 'null', userId: 'null' } as Context;
      return;
    }
    const { success, context } = await authorizeRequest(req);
    if (!success || !context) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    // Ensure requestId from ALS is reflected in request context
    req.context = { ...context, requestId };
  });
};
