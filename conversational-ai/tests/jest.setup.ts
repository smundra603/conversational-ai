import 'dotenv/config';

// Skip building Fastify app for unit tests to avoid open handles
if (process.env.UNIT_TESTS !== '1') {
  beforeAll(async () => {
    console.log('Initializing shared test app...');
    const { initTestApp } = await import('./helpers/appProvider.js');
    await initTestApp();
  });
}

// Cleanup moved to globalTeardown
