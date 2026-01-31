import { CreateAgentInput, ListAgentsInput, UpdateAgentInput } from '../../interfaces/agent.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { StringObjectID } from '../../interfaces/entity.interface.js';
import { agentRepository } from '../../models/agent/agent.repository.js';
import { AgentType } from '../../models/agent/agent.schema.js';
import logger from '../../utils/logger.js';
import { validateRegisterAgentInput, validateUpdateAgentInput } from './utils/validate.js';

class AgentService {
  async getAgent(agentId: StringObjectID, context: Context): Promise<AgentType | null> {
    const agent = await agentRepository.getAgentById(agentId, context);
    return agent;
  }

  async getAgents(input: ListAgentsInput, context: Context): Promise<AgentType[]> {
    const agents = await agentRepository.getAgents(input, context);
    return agents;
  }

  /**
   * Register a new agent
   * @param input
   * @param context
   * @returns Agent
   */
  async registerAgent(input: CreateAgentInput, context: Context): Promise<AgentType | undefined> {
    try {
      validateRegisterAgentInput(input);
      const agent = await agentRepository.createAgent(input, context);
      return agent;
    } catch (error) {
      logger.error('Error registering agent:', error);
      throw error;
    }
  }

  /**
   * Update an existing agent
   * @param agentId
   * @param updateData
   * @param context
   * @returns Agent
   */
  async updateAgent(
    agentId: StringObjectID,
    updateData: UpdateAgentInput,
    context: Context,
  ): Promise<AgentType | null> {
    // Validate update data
    const agent = await agentRepository.getAgentById(agentId, context);
    if (!agent) {
      throw new Error(`Agent with ID ${agentId} not found`);
    }
    validateUpdateAgentInput(agent, updateData);

    // update agent config
    const updatedAgent = await agentRepository.updateAgent(agentId, updateData, context);
    return updatedAgent;
  }
}

export const agentService = new AgentService();
