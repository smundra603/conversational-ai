import { ProviderType } from '../../src/enums/agentModel.enum.js';
import { CreateTenantResponse } from '../../src/interfaces/tenant.interface.js';
import { AgentType } from '../../src/models/agent/agent.schema.js';
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
const allAgents: AgentType[] = [];

describe('session', () => {
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

    const agent1 = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'GPT3_5 Agent with fallback to Gemini1_5',
        primaryProvider: ProviderType.GPT3_5,
        fallbackProvider: ProviderType.GoogleGemini1_5,
        prompt: 'You are a helpful assistant.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    allAgents.push(agent1.json());

    const agent2 = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Claude3_5_Sonnet Agent',
        primaryProvider: ProviderType.Claude3_5_Sonnet,
        prompt: 'You are a helpful assistant without fallback.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    allAgents.push(agent2.json());

    const agent3 = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Gemini1_5 Agent with fallback to Claude3_5_Sonnet',
        primaryProvider: ProviderType.GoogleGemini1_5,
        fallbackProvider: ProviderType.Claude3_5_Sonnet,
        prompt: 'You are a helpful assistant without fallback.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    allAgents.push(agent3.json());
  });

  it('Post /create valid session', async () => {
    const app = getTestApp();
    const agent = allAgents[0];
    if (!agent) {
      throw new Error('No agents available for session creation test');
    }

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/session/create',
      body: {
        agentId: agent._id,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(sessionRes.statusCode).toBe(200);
    const session = sessionRes.json();
    expect(session).toBeDefined();
    expect(session.agentId).toBe(agent._id);
  });

  it('Post /create session with invalid agentId returns error', async () => {
    const app = getTestApp();

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/session/create',
      body: {
        agentId: '6432b22a99df62571b2717e8',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(sessionRes.statusCode).toBe(500);
  });

  it('Get /:id valid session details', async () => {
    const app = getTestApp();
    const agent = allAgents[0];
    if (!agent) {
      throw new Error('No agents available for session details test');
    }

    const sessionRes = await app.inject({
      method: 'POST',
      url: '/session/create',
      body: {
        agentId: agent._id,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(sessionRes.statusCode).toBe(200);
    const session = sessionRes.json();

    const getSessionRes = await app.inject({
      method: 'GET',
      url: `/session/${session._id}`,
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(getSessionRes.statusCode).toBe(200);
    const fetchedSession = getSessionRes.json();
    expect(fetchedSession._id).toBe(session._id);
  });

  it('Get /list returns all sessions', async () => {
    const app = getTestApp();

    const listRes = await app.inject({
      method: 'GET',
      url: `/session/list`,
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(listRes.statusCode).toBe(200);
    const { sessions } = listRes.json();
    expect(Array.isArray(sessions)).toBe(true);
    expect(sessions.length).toBeGreaterThan(0);
  });

  it('Get /:id invalid session details returns null', async () => {
    const app = getTestApp();

    const getSessionRes = await app.inject({
      method: 'GET',
      url: `/session/6432b22a99df62571b2717e8`,
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(getSessionRes.statusCode).toBe(200);
    const fetchedSession = getSessionRes.json();
    expect(fetchedSession).toBeNull();
  });
});
