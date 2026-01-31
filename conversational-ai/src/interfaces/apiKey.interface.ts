import { FastifyRequest } from 'fastify';

export type RegenerateAPIKeyRequest = FastifyRequest<{
  Body: {
    name: string;
    expiresAt?: string;
  };
}>;

export type RegenerateAPIKeyResponse = {
  apiKey: string;
  expiresAt?: number;
};

export type RevokeAPIKeyRequest = FastifyRequest<{
  Body: {
    apiKeyId: string;
  };
}>;

export type RevokeAPIKeyResponse = {
  revoked: boolean;
};
