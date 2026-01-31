import type { FastifyInstance } from 'fastify';

import { agentRoutes } from './agents.js';
import { analyticsRoutes } from './analytics.js';
import { authRoutes } from './auth.js';
import { healthRoutes } from './health.js';
import { publicRoutes } from './public.js';
import { sessionRoutes } from './session.js';
import { tenantRoutes } from './tenant.js';
import { userRoutes } from './user.js';

export async function registerRoutes(app: FastifyInstance): Promise<void> {
  await app.register(healthRoutes, { prefix: '/' });
  await app.register(agentRoutes, { prefix: '/agent' });
  await app.register(analyticsRoutes, { prefix: '/analytics' });
  await app.register(authRoutes, { prefix: '/auth' });
  await app.register(sessionRoutes, { prefix: '/session' });
  await app.register(publicRoutes, { prefix: '/public' });
  // Expose population under public to avoid auth for local/dev usage
  await app.register(tenantRoutes, { prefix: '/tenant' });
  await app.register(userRoutes, { prefix: '/user' });

  app.get('/', async () => ({ service: app.config.SERVICE_NAME }));
}
