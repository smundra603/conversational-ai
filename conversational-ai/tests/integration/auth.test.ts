import { CreateTenantResponse } from '../../src/interfaces/tenant.interface.js';
import { uuid } from '../../src/utils/idGenerator.js';
import { getTestApp } from '../helpers/appProvider.js';

// Simple cookie jar for Fastify inject
const cookieJar = new Map<string, string>();
const publicCookieJar = new Map<string, string>();

function addSetCookie(setCookie: string | string[] | undefined, isPublic = false) {
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
        if (isPublic) {
          publicCookieJar.set(name, value);
        } else {
          cookieJar.set(name, value);
        }
      }
    }
  }
}

function buildCookieHeader(isPublic = false): string {
  const jar = isPublic ? publicCookieJar : cookieJar;
  return Array.from(jar.entries())
    .map(([k, v]) => `${k}=${v}`)
    .join('; ');
}

const domain = uuid() + '.com';
const name = uuid();
let tenant: CreateTenantResponse;

describe('auth', () => {
  beforeAll(async () => {
    // Ensure the test app is initialized
    const app = getTestApp();
    const publicToken = await app.inject({
      method: 'GET',
      url: '/public/public-token',
    });
    expect(publicToken.statusCode).toBe(200);
    addSetCookie(publicToken.headers['set-cookie'], true);
    const res = await app.inject({
      method: 'POST',
      url: '/tenant/create',
      body: {
        domain: domain,
        adminEmail: 'admin@example.com',
        name: name,
      },
      headers: {
        cookie: buildCookieHeader(true),
      },
    });
    tenant = res.json();
    expect(res.statusCode).toBe(200);
  });

  it('Post /sso returns ok', async () => {
    const app = getTestApp();
    const { apiKey } = tenant;
    const ssoRes = await app.inject({
      method: 'POST',
      url: '/auth/sso',
      body: {
        domain,
        apiKey,
        emailId: 'admin@example.com',
      },
      headers: {
        cookie: buildCookieHeader(true),
      },
    });
    expect(ssoRes.statusCode).toBe(200);
    expect(ssoRes.json().success).toBe(true);
    expect(ssoRes.cookies.find((c) => c.name === 'accessToken')).toBeDefined();
    expect(ssoRes.cookies.find((c) => c.name === 'refreshToken')).toBeDefined();
  });

  it('Post /refresh returns ok', async () => {
    const app = getTestApp();
    const { apiKey } = tenant;
    const ssoRes = await app.inject({
      method: 'POST',
      url: '/auth/sso',
      body: {
        domain,
        apiKey,
        emailId: 'admin@example.com',
      },
      headers: {
        cookie: buildCookieHeader(true),
      },
    });
    expect(ssoRes.statusCode).toBe(200);
    const refreshToken = ssoRes.cookies.find((c) => c.name === 'refreshToken')?.value;
    expect(refreshToken).toBeDefined();

    addSetCookie(ssoRes.headers['set-cookie']);

    const refreshRes = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      body: {
        refreshToken,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(refreshRes.statusCode).toBe(200);
    expect(refreshRes.json().success).toBe(true);
    expect(refreshRes.cookies.find((c) => c.name === 'accessToken')).toBeDefined();
  });

  it('Post /sso with invalid apiKey returns 401', async () => {
    const app = getTestApp();
    const ssoRes = await app.inject({
      method: 'POST',
      url: '/auth/sso',
      body: {
        domain,
        apiKey: 'invalid-api-key',
        emailId: 'admin@example.com',
      },
      headers: {
        cookie: buildCookieHeader(true),
      },
    });
    expect(ssoRes.statusCode).toBe(401);
  });

  it('Post /refresh with invalid refreshToken returns 401', async () => {
    const app = getTestApp();
    const refreshRes = await app.inject({
      method: 'POST',
      url: '/auth/refresh',
      body: {
        refreshToken: 'invalid-refresh-token',
      },
      headers: {
        cookie: buildCookieHeader(true),
      },
    });
    expect(refreshRes.statusCode).toBe(400);
  });
});
