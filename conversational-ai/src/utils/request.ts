import { FastifyRequest } from 'fastify';
import { uuid } from './idGenerator.js';

export const getRequestId = (req: FastifyRequest): string => {
  return (req.headers['x-request-id'] as string) || uuid();
};
