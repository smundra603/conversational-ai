import { FastifyRequest } from 'fastify';
import { AccessType } from '../enums/accessType.enum.js';
import { Scope } from '../enums/scope.enum.js';
import { UserType } from '../models/user/user.schema.js';

export type AuthInput = {
  emailId: string;
  apiKey: string;
  domain: string;
};
export type AuthRequest = FastifyRequest<{
  Body: AuthInput;
}>;

export type RefreshTokenInput = {
  refreshToken: string;
};

export type AuthPayload = {
  accessToken?: string;
  refreshToken?: string;
  success: boolean;
  user?: UserType;
};

export type AuthResponse = {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
};

export type AccessTokenPayload = {
  tenantId: string;
  emailId: string;
  accessType: AccessType.ACCESS;
  userId: string;
  scopes?: Scope[];
};

export type RefreshTokenPayload = {
  tenantId: string;
  emailId: string;
  accessType: AccessType.REFRESH;
  userId: string;
};

export type PublicTokenPayload = {
  accessType: AccessType.PUBLIC;
};
