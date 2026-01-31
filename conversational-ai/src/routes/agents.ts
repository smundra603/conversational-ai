import { FastifyPluginAsync, FastifyReply } from 'fastify';
import {
  ConfigureAgentRequest,
  CreateAgentInput,
  ListAgentsRequest,
  RegisterAgentRequest,
  UpdateAgentInput,
} from '../interfaces/agent.interface.js';
import { agentService } from '../services/agent/agent.service.js';
export const agentRoutes: FastifyPluginAsync = async (app) => {
  app.get('/list', async (req: ListAgentsRequest, res: FastifyReply) => {
    const { fallbackProvider, name, primaryProvider } = req.query;

    const agents = await agentService.getAgents({ fallbackProvider, name, primaryProvider }, req.context);
    res.send({ agents }).status(200);
  });

  app.post('/register', async (req: RegisterAgentRequest, res: FastifyReply) => {
    const registerInput: CreateAgentInput = {
      ...req.body,
    };

    const agent = await agentService.registerAgent(registerInput, req.context);

    res.send(agent).status(200);
  });

  app.post('/:id/configure', async (req: ConfigureAgentRequest, res: FastifyReply) => {
    const { id } = req.params;
    const configureAgentInput: UpdateAgentInput = { ...req.body };

    const agent = await agentService.updateAgent(id, configureAgentInput, req.context);
    res.send(agent).status(200);
  });
};
