import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import {
  CreateUserRequest,
  GetAllUsersRequest,
  GetUserInput,
  GetUserRequest,
  UpdateUserRequest,
} from '../interfaces/user.interface.js';
import { userService } from '../services/user/user.service.js';
import logger from '../utils/logger.js';

export const userRoutes: FastifyPluginAsync = async (app) => {
  app.post('/create', async (req: CreateUserRequest, res: FastifyReply) => {
    try {
      const { emailId, name, roles } = req.body;
      logger.info(`Creating user: ${name} with email: ${emailId} and roles: ${roles}`);
      const user = await userService.createUser(
        {
          ...req.body,
        },
        req.context,
      );

      if (!user) {
        res.status(500).send({ error: 'Failed to create user' });
        return;
      }

      res.send(user).status(200);
    } catch (error: unknown) {
      res.status(500).send({ error: error instanceof Error ? error.message : 'Internal Server Error' });
    }
  });

  app.get('/list', async (req: GetAllUsersRequest, res: FastifyReply) => {
    const users = await userService.getAllUsers({ ...req.query }, req.context);
    res.send({ users }).status(200);
  });

  app.get('/me', async (req: FastifyRequest, res: FastifyReply) => {
    const user = await userService.getUser({ userId: req.context.userId }, req.context);

    const scopes = req.context.scopes || [];
    res.send({ ...user, scopes }).status(200);
  });

  app.get('/:id', async (req: GetUserRequest, res: FastifyReply) => {
    const { id } = req.params;
    const userInput: GetUserInput = {
      userId: id,
    };
    const user = await userService.getUser(userInput, req.context);
    res.send(user).status(200);
  });

  app.post('/:id/update', async (req: UpdateUserRequest, res: FastifyReply) => {
    const { id } = req.params;
    const updateData = req.body;

    const updatedUser = await userService.updateUser(id, updateData, req.context);
    if (!updatedUser) {
      res.status(404).send({ error: 'User not found' });
      return;
    }
    res.send(updatedUser).status(200);
  });
};
