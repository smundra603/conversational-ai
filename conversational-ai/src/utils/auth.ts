import { FastifyRequest } from 'fastify';
import { AccessType } from '../enums/accessType.enum.js';
import { AccessTokenPayload, PublicTokenPayload } from '../interfaces/auth.interface.js';
import { Context } from '../interfaces/context.interface.js';
import { tenantService } from '../services/tenant/tenant.service.js';
import { verifyToken } from './jwt.js';
import logger from './logger.js';
import { getRequestId } from './request.js';

export interface AuthorisationPayload {
  context?: Context;
  success: boolean;
}

export async function authorizeRequest(req: FastifyRequest): Promise<AuthorisationPayload> {
  // add post /tenant/create to public methods
  logger.debug('Authorizing request for URL:', req.url);
  const publicMethods: Array<{ method: string; path: RegExp }> = [
    { method: 'GET', path: /^\/public\// },
    { method: 'POST', path: /^\/public\// },
    { method: 'POST', path: /^\/auth\/sso$/ },
    { method: 'POST', path: /^\/tenant\/create$/ },
  ];
  const authHeader = req.headers['authorization'];
  const authCookie = req.cookies['accessToken'];
  let token: string | null | undefined = authCookie;
  if (!token) {
    token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;
  }

  logger.debug('Authorizing request with token:', token);

  if (!token) {
    return { success: false };
  }
  // Implement your token validation logic here
  const tokenPayload = verifyToken<AccessTokenPayload | PublicTokenPayload>(token);

  if (!tokenPayload) {
    return { success: false };
  }

  const requestId = getRequestId(req);

  if (tokenPayload.accessType === AccessType.PUBLIC) {
    const isPublicMethod = publicMethods.some(
      (methodObj) => methodObj.method === req.method && methodObj.path.test(req.url),
    );

    if (!isPublicMethod) {
      return { success: false };
    }

    const host = req.headers['host'] || '';
    let tenant = null;

    if (host) {
      const tenantResult = await tenantService.getTenant(
        { domain: host },
        {
          requestId,
          tenantId: 'null',
          userId: 'null',
        },
      );
      tenant = tenantResult.tenant;
    }

    return {
      success: true,
      context: { requestId, tenantId: tenant?._id.toString() || 'null', userId: tenant?._id.toString() || 'null' },
    };
  }

  const context: Context = {
    requestId,
    tenantId: tokenPayload.tenantId,
    userId: tokenPayload.userId,
    scopes: tokenPayload.scopes || [],
  };

  return { success: true, context };
}
