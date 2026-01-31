import { FastifyRequest } from 'fastify';
import { ProviderType } from '../enums/agentModel.enum.js';
import { StringObjectID } from './entity.interface.js';

export type Metric = 'total_sessions' | 'total_cost' | 'total_tokens';
export type UsageAnalyticInput = {
  filters: {
    startDate?: string;
    endDate?: string;
  };
  metrics: Metric[];
  dimension?: 'createdAt' | 'agentId' | 'provider';
  topN?: {
    property: Metric;
    n: number;
  };
};
export type GetUsageAnalyticsRequest = FastifyRequest<{
  Querystring?: UsageAnalyticInput;
  Body?: UsageAnalyticInput;
}>;

export type UsageAnalyticsResponse = {
  dimension: string | number;
  total_sessions?: number;
  total_cost?: number;
  total_tokens?: number;
  [key: string]: number | string | undefined;
};

export type GetUsageAnalyticsResponse = {
  data: Array<UsageAnalyticsResponse>;
};

export type TrackUsageInput = {
  agentId: StringObjectID;
  provider: ProviderType;
  sessionId: StringObjectID;
  generativeResponseId?: StringObjectID;
  tokensIn: number;
  tokensOut: number;
  totalTokens: number;
  cost: number;
};

export type GetUsageInput = {
  usageId?: StringObjectID;
  generativeResponseId?: StringObjectID;
};

export type GetAllUsagesInput = {
  generativeResponseIds?: StringObjectID[];
  usageIds?: StringObjectID[];
  sessionIds?: StringObjectID[];
};
