import { FastifyRequest } from 'fastify';
import { ProviderType } from '../enums/agentModel.enum.js';
import { AgentType } from '../models/agent/agent.schema.js';
import { SessionType } from '../models/session/session.schema.js';
import { Pagination, StringObjectID } from './entity.interface.js';

// export type ListProvidersInput = {
//   name?: string;
//   model?: AgentModel;
//   status?: AgentStatus;
// };

// export type ListProvidersRequest = FastifyRequest<{
//   Querystring: ListProvidersInput;
// }>;

// export type ProviderInfo = {
//   id: string;
//   name: string;
//   status: AgentStatus;
//   createdAt: number;
//   model: AgentModel;
// };

// export type ListProvidersResponse = {
//   providers: ProviderInfo[];
// };

export type ListAgentsInput = {
  name?: string | undefined;
  primaryProvider?: ProviderType | undefined;
  fallbackProvider?: ProviderType | undefined;
  agentIds?: string[] | undefined;
  pagination?: Pagination;
};

export type ListAgentsRequest = FastifyRequest<{
  Querystring: ListAgentsInput;
}>;

export type ListAgentsResponse = {
  agents: Agent[];
};

export type Agent = {
  id: string;
  name: string;
  primaryProvider: ProviderType;
  fallbackProvider?: ProviderType;
  prompt: string;
};

export type CreateAgentInput = Omit<Agent, 'id'>;

export type UpdateAgentInput = Partial<Omit<Agent, 'id'>>;

export type RegisterAgentRequest = FastifyRequest<{
  Body: CreateAgentInput;
}>;

export type RegisterAgentResponse = Agent;

export type ConfigureAgentRequest = FastifyRequest<{
  Body: UpdateAgentInput;
  Params: {
    id: string;
  };
}>;

export type ConfigureAgentResponse = Agent;

export type RemoveAgentRequest = FastifyRequest<{
  Params: {
    id: string;
  };
}>;

export type RemoveAgentResponse = {
  removed: boolean;
};

export type LLMResponseTypeA = {
  outputText: string;
  tokensIn: number;
  tokensOut: number;
  latencyMs: number;
};

export type LLMResponseTypeB = {
  choices: { message: { content: string } }[];
  usage: { input_tokens: number; output_tokens: number };
};

export type LLMResponseTypeC = {
  result: string;
  token_usage: { in: number; out: number };
};

export type GenerateResponseInput = {
  session: SessionType;
  content: string;
  generativeMessageId: StringObjectID;
  agent: AgentType;
};

export type AgentConverseInput = {
  session: SessionType;
  content: string;
  generativeMessageId: StringObjectID;
};
