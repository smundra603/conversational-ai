import helmet from '@fastify/helmet';
import type { FastifyPluginAsync } from 'fastify';

export const helmetPlugin: FastifyPluginAsync = async (app) => {
  await app.register(helmet);
};
