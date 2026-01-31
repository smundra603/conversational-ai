import { FastifyInstance } from 'fastify';
import { registerOnRequestHook } from './prehandler.hook.js';

export const registerHooks = (app: FastifyInstance): void => {
  registerOnRequestHook(app);
};
