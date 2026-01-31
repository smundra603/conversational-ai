import { UsageAnalyticInput, UsageAnalyticsResponse } from '../../../interfaces/analytics.interface.js';
import { Context } from '../../../interfaces/context.interface.js';
import { agentService } from '../../agent/agent.service.js';

async function getAgentNameMap(agentIds: string[], context: Context): Promise<Record<string, string>> {
  const agents = await agentService.getAgents({ agentIds }, context);
  const agentMap: Record<string, string> = {};
  agents.forEach((agent) => {
    agentMap[agent._id.toString()] = agent.name;
  });
  return agentMap;
}

export async function postProcessUsageAnalyticsResults(
  input: UsageAnalyticInput,
  usageAnalytics: UsageAnalyticsResponse[],
  context: Context,
): Promise<void> {
  if (input.dimension) {
    switch (input.dimension) {
      case 'agentId': {
        const agentIds = usageAnalytics.map((item) => item._id).filter((id) => !!id) as string[];
        const agentMap = await getAgentNameMap(agentIds, context);
        usageAnalytics.forEach((item) => {
          if (item._id && agentMap[item._id.toString()]) {
            item._id = agentMap[item._id.toString()];
          } else {
            item._id = 'Unknown Agent';
          }
        });

        break;
      }
    }
  }
}
