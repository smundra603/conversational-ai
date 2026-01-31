import { ProviderType } from '../enums/agentModel.enum.js';
import { CreateAgentInput } from '../interfaces/agent.interface.js';
import { Context } from '../interfaces/context.interface.js';
import { CreateTenantInput } from '../interfaces/tenant.interface.js';
import { TenantType } from '../models/tenant/tenant.schema.js';
import { agentService } from '../services/agent/agent.service.js';
import { tenantService } from '../services/tenant/tenant.service.js';
import { userService } from '../services/user/user.service.js';
import { uuid } from '../utils/idGenerator.js';

type PopulatedAgent = {
  _id: string;
  name: string;
  primaryProvider: ProviderType;
  fallbackProvider?: ProviderType | undefined;
};

type PopulatedTenant = {
  tenantId: string;
  domain: string;
  apiKey: string;
  agents: PopulatedAgent[];
  emailId: string;
};

export type PopulateResult = {
  tenants: PopulatedTenant[];
};

export async function runPopulate(): Promise<PopulateResult> {
  const results: PopulatedTenant[] = [];

  // Minimal public-like context (matches prehandler for public routes)
  const publicContext: Context = { requestId: uuid(), tenantId: 'null', userId: 'null' } as Context;

  for (let i = 0; i < 2; i++) {
    const domain = `demo${i + 1}.com`;
    const name = `Demo Tenant ${i + 1}`;

    const tenantInput: CreateTenantInput = {
      domain,
      adminEmail: 'admin@example.com',
      name,
      apiKey: `apikey-${i + 1}`,
    };

    let tenant: TenantType | undefined;
    try {
      tenant = await tenantService.createTenant(tenantInput, publicContext);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        const tenantPayload = await tenantService.getTenant({ domain }, publicContext);
        if (!tenantPayload?.tenant) {
          throw new Error(`Tenant with domain ${domain} not found after creation conflict`);
        }
        tenant = tenantPayload.tenant;
        continue;
      } else {
        throw error;
      }
    }

    if (!tenant) {
      throw new Error('Failed to create or retrieve tenant during population');
    }

    const systemContextForInitialUserLoad = await tenantService.systemContext(tenant._id.toString());

    const user = await userService.getUser({ emailId: 'admin@example.com' }, systemContextForInitialUserLoad);

    const systemContext = await tenantService.systemContext(tenant._id.toString(), user?.id);
    const agentInputs: CreateAgentInput[] = [
      {
        name: 'Assistant GPT',
        primaryProvider: ProviderType.GPT3_5,
        fallbackProvider: ProviderType.Claude3_5_Sonnet,
        prompt: 'You are a helpful general assistant.',
      },
      {
        name: 'Creative Claude',
        primaryProvider: ProviderType.Claude3_5_Sonnet,
        fallbackProvider: ProviderType.GoogleGemini1_5,
        prompt: 'You provide creative, articulate assistance.',
      },
      {
        name: 'Gemini Fast',
        primaryProvider: ProviderType.GoogleGemini1_5,
        prompt: 'You respond concisely and quickly.',
      },
    ];

    const agents: PopulatedAgent[] = [];
    for (const input of agentInputs) {
      const agent = await agentService.registerAgent(input, systemContext);
      if (agent?._id) {
        agents.push({
          _id: agent._id.toString(),
          name: agent.name,
          primaryProvider: agent.primaryProvider,
          fallbackProvider: agent.fallbackProvider,
        });
      }
    }

    results.push({
      tenantId: tenant.id,
      domain: tenant.domain,
      apiKey: tenant.apiKey!,
      agents,
      emailId: tenantInput.adminEmail,
    });
  }

  return { tenants: results };
}
