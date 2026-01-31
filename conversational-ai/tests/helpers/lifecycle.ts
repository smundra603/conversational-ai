import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';

const openApps = new Set<FastifyInstance>();

export function trackApp(app: FastifyInstance): FastifyInstance {
  openApps.add(app);
  // Remove from the set when app closes anywhere
  app.addHook('onClose', () => {
    openApps.delete(app);
  });
  return app;
}

export async function closeAllApps(): Promise<void> {
  for (const app of Array.from(openApps)) {
    try {
      await app.close();
    } catch {
      // ignore
    } finally {
      openApps.delete(app);
    }
  }
}

export async function disconnectMongo(): Promise<void> {
  try {
    await mongoose.connection.close();
  } catch {
    // ignore
  }
}
