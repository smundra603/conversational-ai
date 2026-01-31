import { logger } from '@typegoose/typegoose/lib/logSettings.js';
import type { FastifyInstance } from 'fastify';
import mongoose from 'mongoose';
import { buildApp } from '../../src/app/index.js';
import { trackApp } from './lifecycle.js';

let testApp: FastifyInstance | null = null;

let databaseReinitialized = false;

export async function initTestApp(): Promise<FastifyInstance> {
  if (!testApp) {
    process.env.NODE_ENV = process.env.NODE_ENV || 'test';
    const app = await buildApp({ logger: false });

    testApp = trackApp(app);
  }

  if (!databaseReinitialized) {
    const allTenants = await mongoose.connection.collection('tenants').find().toArray();
    logger.info('Reinitializing tenant databases...');

    if (allTenants.length > 0) {
      for (const tenant of allTenants) {
        await mongoose.connection.useDb(tenant._id.toString()).dropDatabase();
      }
    }

    await mongoose.connection.dropDatabase();
    logger.info('Reinitialized tenant databases complete.');
    databaseReinitialized = true;
  }
  return testApp;
}

export function getTestApp(): FastifyInstance {
  if (!testApp) {
    throw new Error('Test app not initialized. Ensure initTestApp() runs in beforeAll.');
  }
  return testApp;
}

export async function closeTestApp(): Promise<void> {
  if (testApp) {
    await testApp.close();
    testApp = null;
  }
}
