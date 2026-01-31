import cookie from '@fastify/cookie';

import fp from 'fastify-plugin';
const cookieImp = fp(async (app) => {
  await app.register(cookie);
});

export const cookiePlugin = fp(cookieImp, {
  name: 'cookie',
});
