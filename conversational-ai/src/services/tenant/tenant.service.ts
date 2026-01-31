import { Role } from '../../enums/role.enum.js';
import { Context } from '../../interfaces/context.interface.js';
import { CreateTenantInput, GetTenantInput, GetTenantPayload } from '../../interfaces/tenant.interface.js';
import { tenantRepository } from '../../models/tenant/tenant.repository.js';
import { TenantType } from '../../models/tenant/tenant.schema.js';
import { uuid } from '../../utils/idGenerator.js';
import { userService } from '../user/user.service.js';
import { generateApiKey } from './utils/apiKey.js';

class TenantService {
  async getTenant(tenantInput: GetTenantInput, context: Context): Promise<GetTenantPayload> {
    const tenant = await tenantRepository.getTenant(tenantInput, context);
    // Implement your authentication logic here
    return { tenant };
  }

  /**
   * Creates a new tenant.
   * @param input
   * @param context
   * @returns New tenant
   */
  async createTenant(input: CreateTenantInput, context: Context): Promise<TenantType | undefined> {
    // Check if tenant with the same domain already exists
    const { tenant } = await this.getTenant({ domain: input.domain }, context);
    if (tenant) {
      throw new Error('Tenant with this domain already exists');
    }

    // Generate API key for the new tenant
    const { encryptedKey, plainKey } = await generateApiKey(input.apiKey);
    const createdTenant = await tenantRepository.createTenant({ ...input, apiKey: encryptedKey }, context);
    if (!createdTenant) {
      return;
    }
    createdTenant.apiKey = plainKey;

    // Create an admin user for the tenant
    const systemContext = await this.systemContext(createdTenant.id);
    await userService.createUser(
      {
        emailId: input.adminEmail,
        name: 'Admin User',
        roles: [Role.ADMIN],
      },
      systemContext,
    );

    return createdTenant;
  }

  /**
   * Regenerates the API key for a given tenant.
   * @param tenantId
   * @param context
   * @returns new plain API key
   */
  async regenerateApiKey(tenantId: string, context: Context): Promise<string> {
    // Ensure the tenant exists
    const { tenant } = await this.getTenant({ tenantId }, context);
    if (!tenant) {
      throw new Error('Tenant does not exist');
    }
    // Generate a new API key
    const { encryptedKey, plainKey } = await generateApiKey();
    // Update the tenant with the new API key
    await tenantRepository.updateTenant(
      tenantId,
      {
        apiKey: encryptedKey,
      },
      context,
    );
    return plainKey;
  }

  /**
   * Generates a system context for a given tenant ID.
   * @param tenantId
   * @returns System Context
   */
  async systemContext(tenantId: string, userId?: string): Promise<Context> {
    const systemContext: Context = {
      tenantId,
      userId: userId ?? tenantId,
      requestId: uuid(),
    };
    return systemContext;
  }
}

export const tenantService = new TenantService();
