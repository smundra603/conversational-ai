import { uuid } from '../../src/utils/idGenerator.js';
import { getTestApp } from '../helpers/appProvider.js';

// Simple cookie jar for Fastify inject
const cookieJar = new Map<string, string>();

function addSetCookie(setCookie: string | string[] | undefined) {
  if (!setCookie) return;
  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  for (const v of values) {
    const nameValue = (v?.split(';')?.[0] ?? '').trim();
    if (!nameValue) continue;
    const eqIdx = nameValue.indexOf('=');
    if (eqIdx > 0) {
      const name = nameValue.slice(0, eqIdx).trim();
      const value = nameValue.slice(eqIdx + 1).trim();
      if (name && value) {
        cookieJar.set(name, value);
      }
    }
  }
}

function buildCookieHeader(): string {
  return Array.from(cookieJar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

describe('tenant', () => {
  beforeAll(async () => {
    // Ensure the test app is initialized
    const app = getTestApp();
    const publicToken = await app.inject({
      method: 'GET',
      url: '/public/public-token',
    });
    expect(publicToken.statusCode).toBe(200);
    addSetCookie(publicToken.headers['set-cookie']);
  });

  it('Post /create returns ok', async () => {
    const app = getTestApp();

    const domain = uuid() + '.com';
    const name = uuid();
    const res = await app.inject({
      method: 'POST',
      url: '/tenant/create',
      body: {
        domain: domain,
        adminEmail: 'admin@example.com',
        name: name,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });

    expect(res.statusCode).toBe(200);
    const { apiKey, tenantId } = res.json();
    expect(apiKey).toBeTruthy();
    expect(tenantId).toBeTruthy();
    // App closed in global teardown
  });

  it('Post /create with existing domain returns 500', async () => {
    const app = getTestApp();

    const domain = uuid() + '.com';
    const name = uuid();
    // Create a tenant using public cookie
    const createRes1 = await app.inject({
      method: 'POST',
      url: '/tenant/create',
      body: {
        domain: domain,
        adminEmail: 'admin@example.com',
        name: name,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(createRes1.statusCode).toBe(200);

    // Try to create another tenant with same domain
    const createRes2 = await app.inject({
      method: 'POST',
      url: '/tenant/create',
      body: {
        domain: domain,
        adminEmail: 'admin@example.com',
        name: name,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(createRes2.statusCode).toBe(500);
    expect(createRes2.json().error).toBe('Tenant with this domain already exists');
  });

  it('Post /regenerate-key returns ok', async () => {
    const app = getTestApp();

    const domain = uuid() + '.com';
    const name = uuid();
    // Create a tenant using public cookie
    const createRes = await app.inject({
      method: 'POST',
      url: '/tenant/create',
      body: {
        domain: domain,
        adminEmail: 'admin@example.com',
        name: name,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(createRes.statusCode).toBe(200);
    const { tenantId, apiKey } = createRes.json();
    expect(apiKey).toBeTruthy();

    // Exchange API key for access token via SSO (uses public cookie)
    const ssoRes = await app.inject({
      method: 'POST',
      url: '/auth/sso',
      body: {
        domain,
        apiKey,
        emailId: 'admin@example.com',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(ssoRes.statusCode).toBe(200);
    addSetCookie(ssoRes.headers['set-cookie']);

    const regenRes = await app.inject({
      method: 'POST',
      url: '/tenant/regenerate-key',
      body: {
        tenantId: tenantId,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });

    expect(regenRes.statusCode).toBe(200);
    // App closed in global teardown
  });
});
