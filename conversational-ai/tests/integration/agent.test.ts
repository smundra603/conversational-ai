import { ProviderType } from '../../src/enums/agentModel.enum.js';
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

describe('agent', () => {
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

  it('Post /register valid agent returns ok', async () => {
    const app = getTestApp();

    const agent = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Test Agent',
        primaryProvider: ProviderType.GPT3_5,
        fallbackProvider: ProviderType.GoogleGemini1_5,
        prompt: 'You are a helpful assistant.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agent.statusCode).toBe(200);
    const agentId = agent.json()._id;
    expect(agentId).toBeDefined();
  });

  it('Get /list agents returns ok', async () => {
    const app = getTestApp();

    const agents = await app.inject({
      method: 'GET',
      url: '/agent/list',
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agents.statusCode).toBe(200);
    const agentsList = agents.json().agents;
    expect(Array.isArray(agentsList)).toBe(true);
    expect(agentsList.length).toEqual(1);
  });

  it('Post /:id/configure updates agent and returns ok', async () => {
    const app = getTestApp();

    // First, get the list of agents to obtain an agent ID
    const agentsResponse = await app.inject({
      method: 'GET',
      url: '/agent/list',
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agentsResponse.statusCode).toBe(200);
    const agentsList = agentsResponse.json().agents;
    expect(Array.isArray(agentsList)).toBe(true);
    expect(agentsList.length).toBeGreaterThan(0);
    const agentId = agentsList[0]._id;

    // Now, update the agent's configuration
    const updatedPrompt = 'You are an updated helpful assistant.';
    const updateResponse = await app.inject({
      method: 'POST',
      url: `/agent/${agentId}/configure`,
      body: {
        prompt: updatedPrompt,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(updateResponse.statusCode).toBe(200);
    const updatedAgent = updateResponse.json();
    expect(updatedAgent).toBeDefined();
    expect(updatedAgent.prompt).toBe(updatedPrompt);
  });

  it('Post /create agent without fallbackProvider returns ok', async () => {
    const app = getTestApp();

    const agent = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Test Agent No Fallback',
        primaryProvider: ProviderType.Claude3_5_Sonnet,
        prompt: 'You are a helpful assistant without fallback.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agent.statusCode).toBe(200);
    const agentId = agent.json()._id;
    expect(agentId).toBeDefined();
  });

  it('Post /create agent with invalid provider returns error', async () => {
    const app = getTestApp();

    const agent = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Invalid Provider Agent',
        primaryProvider: 'invalid_provider',
        prompt: 'This should fail.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agent.statusCode).toBe(500);
  });

  it('Post /create with same provider and fallbackProvider returns error', async () => {
    const app = getTestApp();

    const agent = await app.inject({
      method: 'POST',
      url: '/agent/register',
      body: {
        name: 'Same Provider Agent',
        primaryProvider: ProviderType.Claude3_5_Sonnet,
        fallbackProvider: ProviderType.Claude3_5_Sonnet,
        prompt: 'This should fail due to same providers.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agent.statusCode).toBe(500);
  });

  it('Post /configure with invalid agent ID returns error', async () => {
    const app = getTestApp();

    const agent = await app.inject({
      method: 'POST',
      url: `/agent/6432b22a99df62571b2717e8/configure`,
      body: {
        prompt: 'Attempting to update with invalid ID.',
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(agent.statusCode).toBe(500);
  });
});
