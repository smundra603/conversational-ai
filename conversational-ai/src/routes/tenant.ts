import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { RegenerateAPIKeyRequest } from '../interfaces/apiKey.interface.js';
import { CreateTenantRequest, CreateTenantResponse } from '../interfaces/tenant.interface.js';
import { tenantService } from '../services/tenant/tenant.service.js';
import logger from '../utils/logger.js';

export const tenantRoutes: FastifyPluginAsync = async (app) => {
  app.post('/create', async (req: CreateTenantRequest, res: FastifyReply) => {
    try {
      const { adminEmail, domain, name } = req.body;
      const tenant = await tenantService.createTenant(
        {
          adminEmail,
          domain,
          name,
        },
        req.context,
      );

      if (!tenant) {
        res.status(500).send({ error: 'Failed to create tenant' });
        return;
      }
      logger.info(`Creating tenant: ${name} for domain: ${domain} and adminEmail: ${adminEmail}`);
      const response: CreateTenantResponse = {
        apiKey: tenant.apiKey,
        tenantId: tenant.id,
      };
      res.send(response).status(200);
    } catch (error: unknown) {
      res.status(500).send({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  app.post('/regenerate-key', async (req: RegenerateAPIKeyRequest, res: FastifyReply) => {
    const { name, expiresAt } = req.body;
    logger.info(`Adding API key: ${name} with expiry: ${expiresAt}`);
    const apiKey = await tenantService.regenerateApiKey(req.context.tenantId, req.context);

    res.send(apiKey).status(200);
  });
};
