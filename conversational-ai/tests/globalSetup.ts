import 'dotenv/config';

export default async function globalSetup(): Promise<void> {
  process.env.NODE_ENV = 'test';
  // if (process.env.TEST_MONGO_URI && !process.env.MONGO_URI) {
  //   process.env.MONGO_URI = process.env.TEST_MONGO_URI;
  // }
  // Nothing else needed: tests initialize the shared Fastify app on first load.
  // We keep one worker to ensure single app instance across suite.
}
