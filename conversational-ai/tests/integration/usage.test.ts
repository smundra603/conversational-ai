import { ProviderType } from '../../src/enums/agentModel.enum.js';
import { UsageAnalyticInput, UsageAnalyticsResponse } from '../../src/interfaces/analytics.interface.js';
import { CreateTenantResponse } from '../../src/interfaces/tenant.interface.js';
import { AgentType } from '../../src/models/agent/agent.schema.js';
import { SessionType } from '../../src/models/session/session.schema.js';
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
let agent: AgentType;
let session: SessionType;

describe('usage', () => {
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
    agent = agent1.json();
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
    session = sessionRes.json();
    expect(session).toBeDefined();
    expect(session.agentId).toBe(agent._id);

    // generate 10 conversations for usage testing
    for (let i = 0; i < 10; i++) {
      const converseRes = await app.inject({
        method: 'POST',
        url: `/session/${session._id}/converse`,
        body: {
          message: `Test message ${i + 1}`,
          uniqKey: uuid(),
        },
        headers: {
          cookie: buildCookieHeader(),
        },
      });
      expect(converseRes.statusCode).toBe(200);
    }
  });

  it('Post /usage should return correct usage data', async () => {
    const usageInput: UsageAnalyticInput = {
      filters: {},
      metrics: ['total_cost', 'total_sessions', 'total_tokens'],
      dimension: 'provider',
    };
    const app = getTestApp();
    const usageRes = await app.inject({
      method: 'POST',
      url: '/analytics/usage',
      body: {
        ...usageInput,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(usageRes.statusCode).toBe(200);
    const usages: UsageAnalyticsResponse[] = usageRes.json();
    expect(usages).toBeDefined();
    expect(usages.length).toBeGreaterThanOrEqual(1);
  });

  it('Post /usage should return correct usage data by agentId', async () => {
    const usageInput: UsageAnalyticInput = {
      filters: {},
      metrics: ['total_cost', 'total_sessions', 'total_tokens'],
      dimension: 'agentId',
    };
    const app = getTestApp();
    const usageRes = await app.inject({
      method: 'POST',
      url: '/analytics/usage',
      body: {
        ...usageInput,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(usageRes.statusCode).toBe(200);
    const usages: UsageAnalyticsResponse[] = usageRes.json();
    expect(usages).toBeDefined();
    expect(usages.length).toBeGreaterThanOrEqual(1);
    const agentUsage = usages.find((u) => u._id === agent.name);
    expect(agentUsage).toBeDefined();
  });

  it('Post /usage should return total usages', async () => {
    const usageInput: UsageAnalyticInput = {
      filters: {},
      metrics: ['total_cost', 'total_sessions', 'total_tokens'],
    };
    const app = getTestApp();
    const usageRes = await app.inject({
      method: 'POST',
      url: '/analytics/usage',
      body: {
        ...usageInput,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(usageRes.statusCode).toBe(200);
    const usages: UsageAnalyticsResponse[] = usageRes.json();
    expect(usages).toBeDefined();
    expect(usages.length).toBeGreaterThanOrEqual(1);
  });

  it('Post /usage should return topN data', async () => {
    const usageInput: UsageAnalyticInput = {
      filters: {},
      metrics: ['total_cost', 'total_sessions', 'total_tokens'],
      dimension: 'provider',
      topN: {
        n: 1,
        property: 'total_cost',
      },
    };
    const app = getTestApp();
    const usageRes = await app.inject({
      method: 'POST',
      url: '/analytics/usage',
      body: {
        ...usageInput,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(usageRes.statusCode).toBe(200);
    const usages: UsageAnalyticsResponse[] = usageRes.json();
    expect(usages).toBeDefined();
    expect(usages.length).toBeGreaterThanOrEqual(1);
  });

  it('Post /usage should restrict user without permission', async () => {
    const usageInput: UsageAnalyticInput = {
      filters: {},
      metrics: ['total_cost', 'total_sessions', 'total_tokens'],
      dimension: 'provider',
    };
    const app = getTestApp();
    const usageRes = await app.inject({
      method: 'POST',
      url: '/analytics/usage',
      body: {
        ...usageInput,
      },
      headers: {
        cookie: buildCookieHeader(true), // public cookie without auth
      },
    });
    expect(usageRes.statusCode).toBe(401);
  });
});
