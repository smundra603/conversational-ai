import { FastifyRequest } from 'fastify';
import { TenantType } from '../models/tenant/tenant.schema.js';

export type CreateTenantRequest = FastifyRequest<{
  Body: CreateTenantInput;
}>;

export type CreateTenantResponse = {
  tenantId: string;
  apiKey: string;
};

export type GetTenantInput = {
  tenantId?: string;
  domain?: string;
};

export type GetTenantPayload = {
  tenant?: TenantType | null;
};

export type CreateTenantInput = {
  name: string;
  adminEmail: string;
  domain: string;
  apiKey?: string;
};
