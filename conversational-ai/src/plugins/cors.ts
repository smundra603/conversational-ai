import cors from '@fastify/cors';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

export const corsPluginImpl: FastifyPluginAsync = async (app) => {
  await app.register(cors, {
    origin: app.config.CORS_ORIGIN,
    credentials: true,
  });
};

export const corsPlugin = fp(corsPluginImpl, {
  name: 'corsPlugin',
});
