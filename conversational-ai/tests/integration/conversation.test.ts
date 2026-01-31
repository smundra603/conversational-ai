import { ProviderType } from '../../src/enums/agentModel.enum.js';
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

describe('conversation', () => {
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
  });

  it('Post /:id/converse should create a user message and initial agent message in the session', async () => {
    const app = getTestApp();
    const converseRes = await app.inject({
      method: 'POST',
      url: `/session/${session._id}/converse`,
      body: {
        message: 'Hello, how are you?',
        uniqKey: uuid(),
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(converseRes.statusCode).toBe(200);
    const conversation = converseRes.json();
    expect(conversation).toBeDefined();
    expect(conversation.userMessage).toBeDefined();
    expect(conversation.userMessage.content).toBe('Hello, how are you?');
    expect(conversation.agentResponse).toBeDefined();
    expect(conversation.agentResponse.content).toBe('Generating Response...');
  });

  it('Get /:id/message/:messageId should return the specific message in the session', async () => {
    const app = getTestApp();
    // First, create a message to fetch
    const converseRes = await app.inject({
      method: 'POST',
      url: `/session/${session._id}/converse`,
      body: {
        message: 'What is the weather today?',
        uniqKey: uuid(),
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(converseRes.statusCode).toBe(200);
    const conversation = converseRes.json();
    expect(conversation).toBeDefined();
    expect(conversation.userMessage).toBeDefined();
    const messageId = conversation.userMessage._id;

    // Now, fetch the message by ID
    const messageRes = await app.inject({
      method: 'GET',
      url: `/session/${session._id}/message/${messageId}`,
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(messageRes.statusCode).toBe(200);
    const message = messageRes.json();
    expect(message).toBeDefined();
    expect(message._id).toBe(messageId);
    expect(message.content).toBe('What is the weather today?');
  });

  it('Get /:id/transcript should return the message transcript for the session', async () => {
    const app = getTestApp();
    const transcriptRes = await app.inject({
      method: 'GET',
      url: `/session/${session._id}/transcript`,
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(transcriptRes.statusCode).toBe(200);
    const transcript = transcriptRes.json();
    expect(transcript).toBeDefined();
    expect(Array.isArray(transcript)).toBe(true);
    expect(transcript.length).toBeGreaterThanOrEqual(2); // At least user and agent messages
  });

  it('/:id/converse with uniqKey should create idempotent user message', async () => {
    const app = getTestApp();
    const uniqKey = uuid();

    const firstRes = await app.inject({
      method: 'POST',
      url: `/session/${session._id}/converse`,
      body: {
        message: 'This is an idempotent test message.',
        uniqKey,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(firstRes.statusCode).toBe(200);
    const firstConversation = firstRes.json();
    expect(firstConversation).toBeDefined();
    expect(firstConversation.userMessage).toBeDefined();
    expect(firstConversation.userMessage.content).toBe('This is an idempotent test message.');

    const secondRes = await app.inject({
      method: 'POST',
      url: `/session/${session._id}/converse`,
      body: {
        message: 'This is an idempotent test message.',
        uniqKey,
      },
      headers: {
        cookie: buildCookieHeader(),
      },
    });
    expect(secondRes.statusCode).toBe(200);
    const secondConversation = secondRes.json();
    expect(secondConversation).toBeDefined();
    expect(secondConversation.userMessage).toBeDefined();
    expect(secondConversation.userMessage._id).toBe(firstConversation.userMessage._id);
    expect(secondConversation.agentResponse).toBeDefined();
    expect(secondConversation.agentResponse._id).toBe(firstConversation.agentResponse._id);
  });
});
