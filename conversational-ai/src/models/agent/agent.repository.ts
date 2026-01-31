import { Types, UpdateQuery } from 'mongoose';
import { ProviderType } from '../../enums/agentModel.enum.js';
import { CreateAgentInput, ListAgentsInput, UpdateAgentInput } from '../../interfaces/agent.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { FilterQuery, StringObjectID } from '../../interfaces/entity.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import { AgentType } from './agent.schema.js';

export class AgentRepository extends EntityBaseCrud<typeof AgentType> {
  public constructor() {
    super({
      modelClass: AgentType,
      schemaOptions: {
        collection: 'agents',
        timestamps: true,
      },
      cacheModel: true,
    });
  }

  async createAgent(agentInput: CreateAgentInput, context: Context): Promise<AgentType | undefined> {
    const AgentModel = await this.getModel(context, this.modelOptions);

    const agentDoc = new AgentModel({
      ...agentInput,
      createdById: context.userId,
      updatedById: context.userId,
    });

    const agent = await this.create({
      doc: agentDoc,
      context,
    });

    return agent;
  }

  async updateAgent(
    agentId: StringObjectID,
    updateData: UpdateAgentInput,
    context: Context,
  ): Promise<AgentType | null> {
    const updateQuery: UpdateQuery<AgentType> = {
      $set: {
        ...updateData,
      },
    };

    const updatedAgent = await this.findOneAndUpdate({
      query: { _id: new Types.ObjectId(agentId) },
      updateQuery: updateQuery,
      options: { new: true },
      context,
    });

    return updatedAgent;
  }

  async getAgentById(agentId: StringObjectID, context: Context): Promise<AgentType | null> {
    const agent = await this.findById({
      id: new Types.ObjectId(agentId),
      context,
    });
    return agent;
  }

  async getAgents(
    { fallbackProvider, name, primaryProvider, agentIds, pagination = {} }: ListAgentsInput,
    context: Context,
  ): Promise<AgentType[]> {
    const query: FilterQuery<AgentType> = {
      primaryProvider: { $in: Object.values(ProviderType) },
    };

    // use regex for name search
    if (name) {
      query['name'] = { $regex: name, $options: 'i' };
    }

    if (primaryProvider) {
      query['primaryProvider'] = primaryProvider;
    }

    if (fallbackProvider) {
      query['fallbackProvider'] = fallbackProvider;
    }
    if (agentIds && agentIds.length > 0) {
      query['_id'] = { $in: agentIds.map((id) => new Types.ObjectId(id)) };
    }

    // If agentIds is an empty array, return agents for the specific user.
    if (!agentIds || agentIds?.length === 0) {
      query['createdById'] = new Types.ObjectId(context.userId);
    }

    const paginationOptions = this.buildPaginationOption(pagination);

    const agents = await this.findAll({
      query: query,
      context,
      options: {
        ...paginationOptions,
      },
    });
    return agents;
  }
}

export const agentRepository = new AgentRepository();
