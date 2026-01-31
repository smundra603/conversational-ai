import type { FastifyInstance } from 'fastify';

import { cookiePlugin } from './cookie.js';
import { corsPlugin } from './cors.js';
import { env } from './env.js';
import { helmetPlugin } from './helmet.js';
import { sensiblePlugin } from './sensible.js';

export async function registerPlugins(app: FastifyInstance): Promise<void> {
  // Order matters: env first so config is available to later plugins.
  await app.register(env);
  await app.register(cookiePlugin);
  await app.register(sensiblePlugin);
  await app.register(corsPlugin);
  await app.register(helmetPlugin);
}
