import { ProviderType } from '../../../enums/agentModel.enum.js';
import { CreateAgentInput, UpdateAgentInput } from '../../../interfaces/agent.interface.js';
import { AgentType } from '../../../models/agent/agent.schema.js';
const allProviders = Object.values(ProviderType);

const notValidProviderType = (provider: ProviderType) => allProviders.indexOf(provider) === -1;

export function validateRegisterAgentInput(input: CreateAgentInput) {
  // Validate provider types
  if (notValidProviderType(input.primaryProvider)) {
    throw new Error('Invalid primary provider specified.');
  }

  // Validate fallback provider if provided
  if (input.fallbackProvider && notValidProviderType(input.fallbackProvider)) {
    throw new Error('Invalid fallback provider specified.');
  }

  // Ensure primary and fallback providers are not the same
  if (input.primaryProvider === input.fallbackProvider) {
    throw new Error('Primary and fallback providers must be different.');
  }
}

export function validateUpdateAgentInput(agent: AgentType, input: UpdateAgentInput) {
  // Validate provider types if they are being updated
  if (input.primaryProvider && notValidProviderType(input.primaryProvider)) {
    throw new Error('Invalid primary provider specified.');
  }

  // Validate fallback provider if provided
  if (input.fallbackProvider && notValidProviderType(input.fallbackProvider)) {
    throw new Error('Invalid fallback provider specified.');
  }

  // if both primary and fallback are being updated, check they are not the same
  if (input.primaryProvider && input.fallbackProvider && input.primaryProvider === input.fallbackProvider) {
    throw new Error('Primary and fallback providers must be different.');
  }

  // if only one is being updated, ensure it is not the same as the existing other provider
  if (input.primaryProvider && !input.fallbackProvider && input.primaryProvider === agent.fallbackProvider) {
    throw new Error('Primary and fallback providers must be different.');
  }

  if (input.fallbackProvider && !input.primaryProvider && input.fallbackProvider === agent.primaryProvider) {
    throw new Error('Primary and fallback providers must be different.');
  }
}
