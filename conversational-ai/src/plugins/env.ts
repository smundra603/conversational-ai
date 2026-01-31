import envPlugin from '@fastify/env';
import type { FastifyPluginAsync } from 'fastify';
import fp from 'fastify-plugin';

import { envSchema } from '../config/env.js';

const envImpl: FastifyPluginAsync = async (app) => {
  await app.register(envPlugin, {
    schema: envSchema,
    dotenv: true,
    confKey: 'config',
  });
};

export const env = fp(envImpl, {
  name: 'env',
});
