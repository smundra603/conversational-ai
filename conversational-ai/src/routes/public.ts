import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { ProviderType } from '../enums/agentModel.enum.js';
import { authService } from '../services/auth/auth.service.js';

export const publicRoutes: FastifyPluginAsync = async (app) => {
  app.get('/public-token', async (req, res: FastifyReply) => {
    const publicToken = await authService.publicToken();

    let secure = true;
    if (process.env.NODE_ENV !== 'production') {
      secure = false;
    }

    res.setCookie('accessToken', publicToken, { httpOnly: true, secure, sameSite: 'strict', path: '/' });
    res.status(200).send({ success: true });
  });

  app.get('/providers', async (req, res: FastifyReply) => {
    //ProviderType
    const providers = Object.values(ProviderType);
    res.status(200).send({ providers });
  });
};
