import jwt from 'jsonwebtoken';
import { AccessType } from '../enums/accessType.enum.js';
import { AccessTokenPayload, PublicTokenPayload, RefreshTokenPayload } from '../interfaces/auth.interface.js';
import { TenantType } from '../models/tenant/tenant.schema.js';
import { UserType } from '../models/user/user.schema.js';
import logger from './logger.js';
import { getPermittedScopes } from './rbac.js';

const RAW_JWT_SECRET = process.env.JWT_SECRET;

if (!RAW_JWT_SECRET) {
  logger.warn('JWT_SECRET not set; using insecure default key. Set JWT_SECRET in environment.');
}

const JWT_SECRET = RAW_JWT_SECRET || 'default_secret_key';

export const generateToken = <T extends object>(payload: T, expiresIn: jwt.SignOptions['expiresIn'] = '1h'): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

export const verifyToken = <T>(token: string): (T & { exp?: number }) | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as T & { exp?: number };
  } catch (error) {
    logger.error('Invalid token:', error);
    return null;
  }
};

export const generateAccessToken = (tenant: TenantType, user: UserType): string => {
  const scopes = getPermittedScopes(user);
  return generateToken<AccessTokenPayload>({
    tenantId: tenant._id.toString(),
    emailId: user.emailId,
    accessType: AccessType.ACCESS,
    userId: user._id.toString(),
    scopes,
  });
};

export const generateRefreshToken = (tenant: TenantType, user: UserType): string => {
  return generateToken<RefreshTokenPayload>(
    {
      tenantId: tenant._id.toString(),
      emailId: user.emailId,
      accessType: AccessType.REFRESH,
      userId: user._id.toString(),
    },
    '7d',
  );
};

export const generatePublicToken = (): string => {
  return generateToken<PublicTokenPayload>(
    {
      accessType: AccessType.PUBLIC,
    },
    '1h',
  ); // Public token valid for 1 hour
};
