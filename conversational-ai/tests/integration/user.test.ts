import { Role } from '../../src/enums/role.enum.js';
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

describe('user', () => {
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
  });

  it('Post /create valid user returns ok', async () => {
    const app = getTestApp();

    const user = await app.inject({
      method: 'POST',
      url: '/user/create',
      body: {
        emailId: 'user@example.com',
        name: 'Test User',
        roles: [Role.USER],
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(user.statusCode).toBe(200);
    const userId = user.json()._id;
    expect(userId).toBeDefined();
  });

  it('Get /list users returns ok', async () => {
    const app = getTestApp();

    const users = await app.inject({
      method: 'GET',
      url: '/user/list',
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(users.statusCode).toBe(200);
    const usersList = users.json().users;
    expect(Array.isArray(usersList)).toBe(true);
    expect(usersList.length).toEqual(2); // Admin user + created user
  });

  it('Post /:id/update updates user and returns ok', async () => {
    const app = getTestApp();

    // First, get the list of users to obtain a user ID
    const usersResponse = await app.inject({
      method: 'GET',
      url: '/user/list',
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(usersResponse.statusCode).toBe(200);
    const usersList = usersResponse.json().users;
    expect(Array.isArray(usersList)).toBe(true);
    expect(usersList.length).toBeGreaterThan(0);
    const userId = usersList[0]._id;
    // Now, update the user's information
    const updatedRoles = [Role.ADMIN];
    const updateResponse = await app.inject({
      method: 'POST',
      url: `/user/${userId}/update`,
      body: {
        roles: updatedRoles,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    const updatedUser = updateResponse.json();
    expect(updatedUser).toBeDefined();
    expect(updatedUser.roles).toEqual(updatedRoles);
  });
});
