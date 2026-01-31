import { getTestApp } from '../helpers/appProvider.js';

describe('health', () => {
  it('GET /health returns ok', async () => {
    const app = getTestApp();

    const res = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(res.statusCode).toBe(200);
    expect(res.json()).toEqual({ status: 'ok' });
    // App closed in global teardown
  });
});
