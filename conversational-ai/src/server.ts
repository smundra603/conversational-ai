import 'dotenv/config';
import 'reflect-metadata';
import { buildApp } from './app/index.js';
import { closeMongoDBConnection } from './database/mongoConnection.js';

const isProduction = process.env.NODE_ENV === 'production';

async function start() {
  const app = await buildApp({ logger: true });
  // populate demo data in non-production environments

  const port = Number(process.env.PORT ?? 3000);
  const host = process.env.HOST ?? (isProduction ? '0.0.0.0' : '127.0.0.1');

  const closeWithSignal = async (signal: NodeJS.Signals) => {
    app.log.info({ signal }, 'received shutdown signal');
    try {
      await closeMongoDBConnection();
      await app.close();
      app.log.info('server closed');
      process.exit(0);
    } catch (error) {
      app.log.error({ error }, 'error during shutdown');
      process.exit(1);
    }
  };

  process.on('SIGINT', closeWithSignal);
  process.on('SIGTERM', closeWithSignal);

  try {
    await app.ready();
    app.log.info(`\n${app.printRoutes()}`);
    await app.listen({ port, host });

    const { runPopulate } = await import('./populate/populate.service.js');
    await runPopulate();
  } catch (error) {
    app.log.error({ error }, 'failed to start');
    process.exit(1);
  }
}

await start();
