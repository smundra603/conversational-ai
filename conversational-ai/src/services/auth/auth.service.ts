import { AccessType } from '../../enums/accessType.enum.js';
import { AuthInput, AuthPayload, RefreshTokenInput, RefreshTokenPayload } from '../../interfaces/auth.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { encryptor } from '../../utils/encrypt.js';
import { generateAccessToken, generatePublicToken, generateRefreshToken, verifyToken } from '../../utils/jwt.js';
import logger from '../../utils/logger.js';
import { tenantService } from '../tenant/tenant.service.js';
import { userService } from '../user/user.service.js';

export class AuthService {
  /**
   * Authenticates a user and generates access and refresh tokens.
   * @param authInput
   * @param context
   * @returns Tokens
   */
  async auth(authInput: AuthInput, context: Context): Promise<AuthPayload> {
    const { apiKey, emailId, domain } = authInput;

    // Implement your authentication logic here
    const { tenant } = await tenantService.getTenant(
      {
        domain,
      },
      context,
    );

    // Validate API key
    if (!tenant || !tenant.apiKey) {
      logger.warn(`Authentication failed for emailId: ${emailId} and domain: ${domain} - Tenant or API key not found`);
      return { success: false };
    }

    const isMatch = await encryptor.compare(apiKey, tenant.apiKey);
    if (!isMatch) {
      logger.warn(`Authentication failed for emailId: ${emailId} and domain: ${domain} - Invalid API key`);
      return { success: false };
    }

    //Fetch and validate user
    const systemContext = await tenantService.systemContext(tenant._id.toString());
    const user = await userService.getUser({ emailId }, systemContext);
    if (!user) {
      logger.warn(`Authentication failed for emailId: ${emailId} and domain: ${domain} - User not found`);
      return { success: false };
    }

    // Generate tokens
    const accessToken = generateAccessToken(tenant, user);

    const refreshToken = generateRefreshToken(tenant, user);

    logger.debug(`Authentication successful for emailId: ${emailId} and domain: ${domain}`);
    return { success: true, accessToken, refreshToken, user };
  }

  /**
   * Refreshes the access token using a valid refresh token.
   * @param input
   * @returns Tokens
   */
  async refreshToken(input: RefreshTokenInput): Promise<AuthPayload> {
    const { refreshToken } = input;

    // Implement your token refresh logic here
    const tokenPayload = verifyToken<RefreshTokenPayload>(refreshToken);
    if (!tokenPayload || tokenPayload.accessType !== AccessType.REFRESH) {
      logger.warn(`Refresh token invalid or expired`);
      return { success: false };
    }

    const systemContext = await tenantService.systemContext(tokenPayload.tenantId);

    const tenantPayload = await tenantService.getTenant({ tenantId: tokenPayload.tenantId }, systemContext);

    if (!tenantPayload?.tenant) {
      logger.warn(`Refresh token failed - Tenant not found for tenantId: ${tokenPayload.tenantId}`);
      return { success: false };
    }

    const user = await userService.getUser(
      {
        userId: tokenPayload.userId,
      },
      systemContext,
    );

    if (!user) {
      logger.warn(`Refresh token failed - User not found for emailId: ${tokenPayload.emailId}`);
      return { success: false };
    }

    const newAccessToken = generateAccessToken(tenantPayload.tenant, user);

    let newRefreshToken: string = refreshToken;
    // refresh token if exp is about to expire in 1 day
    if (!tokenPayload.exp || (tokenPayload.exp && Date.now() >= tokenPayload.exp * 1000 - 24 * 60 * 60 * 1000)) {
      newRefreshToken = generateRefreshToken(tenantPayload.tenant, user);
      logger.debug(`Refresh token renewed for tenantId: ${tokenPayload.tenantId} and emailId: ${tokenPayload.emailId}`);
    }

    logger.debug(`Access token refreshed for tenantId: ${tokenPayload.tenantId} and emailId: ${tokenPayload.emailId}`);

    return { success: true, accessToken: newAccessToken, user, refreshToken: newRefreshToken };
  }

  /**
   * Generates a public token with limited access.
   * @returns Public Token
   */
  async publicToken(): Promise<string> {
    const publicToken = generatePublicToken();

    logger.debug(`Public token generated`);
    return publicToken;
  }
}

export const authService = new AuthService();
