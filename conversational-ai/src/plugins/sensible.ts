import sensible from '@fastify/sensible';
import type { FastifyPluginAsync } from 'fastify';

export const sensiblePlugin: FastifyPluginAsync = async (app) => {
  await app.register(sensible);
};
