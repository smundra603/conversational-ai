import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import { AuthRequest, AuthResponse } from '../interfaces/auth.interface.js';
import { authService } from '../services/auth/auth.service.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/sso', async (req: AuthRequest, res: FastifyReply) => {
    const { apiKey, emailId, domain } = req.body;
    const response: AuthResponse = {
      success: true,
    };

    const { success, accessToken, refreshToken, user } = await authService.auth(
      {
        domain,
        apiKey,
        emailId,
      },
      req.context,
    );
    if (!success || !accessToken || !refreshToken || !user) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    // Set secured cookies. Keep secure flag true in production
    let secure = true;
    if (process.env.NODE_ENV !== 'production') {
      secure = false;
    }
    res.setCookie('accessToken', accessToken, { httpOnly: true, secure, sameSite: 'strict', path: '/' });
    res.setCookie('refreshToken', refreshToken, { httpOnly: true, secure, sameSite: 'strict', path: '/auth/refresh' });
    res.status(200).send({ ...response, user });
  });

  app.post('/refresh', async (req: FastifyRequest, res: FastifyReply) => {
    const userRefreshToken = req.cookies['refreshToken'];

    if (!userRefreshToken) {
      res.status(400).send({ error: 'Refresh token is required' });
      return;
    }

    const { success, accessToken, refreshToken, user } = await authService.refreshToken({
      refreshToken: userRefreshToken,
    });

    if (!success || !accessToken || !refreshToken) {
      res.status(401).send({ error: 'Unauthorized' });
      return;
    }

    const response: AuthResponse = {
      success: true,
    };

    let secure = true;

    if (process.env.NODE_ENV !== 'production') {
      secure = false;
    }

    res.setCookie('accessToken', accessToken, { httpOnly: true, secure, sameSite: 'strict', path: '/' });
    res.setCookie('refreshToken', refreshToken, { httpOnly: true, secure, sameSite: 'strict', path: '/auth/refresh' });

    res.status(200).send({ ...response, user });
  });

  app.post('/logout', async (req, res: FastifyReply) => {
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/auth/refresh' });
    res.status(200).send({ success: true });
  });
};
