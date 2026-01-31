import Fastify, { type FastifyBaseLogger, type FastifyInstance } from 'fastify';

import { connectMongoDB } from '../database/mongoConnection.js';
import { registerHooks } from '../hooks/index.js';
import { registerPlugins } from '../plugins/index.js';
import { registerRoutes } from '../routes/index.js';

export type BuildAppOptions = {
  logger: boolean | FastifyBaseLogger;
};

export async function buildApp(options: BuildAppOptions): Promise<FastifyInstance> {
  const app = Fastify({
    logger: options.logger,
    disableRequestLogging: false,
    ajv: {
      customOptions: {
        removeAdditional: 'all',
        coerceTypes: true,
        useDefaults: true,
      },
    },
  });

  // Load env and other plugins before connecting to Mongo so .env is available
  await registerPlugins(app);
  await connectMongoDB();
  await registerHooks(app);
  await registerRoutes(app);

  return app;
}
