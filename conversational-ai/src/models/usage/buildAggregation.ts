/* eslint-disable @typescript-eslint/no-explicit-any */
import { UsageAnalyticInput } from '../../interfaces/analytics.interface.js';

function addFilterStage(filters: UsageAnalyticInput['filters'], aggregationPipeline: any[]) {
  const matchStage: any = {};

  for (const key in filters) {
    switch (key as keyof typeof filters) {
      case 'endDate': {
        if (filters['endDate']) {
          if (!matchStage['createdAt']) {
            matchStage['createdAt'] = {};
          }
          matchStage['createdAt']['$lte'] = new Date(filters['endDate']);
        }
        break;
      }
      case 'startDate': {
        if (filters['startDate']) {
          if (!matchStage['createdAt']) {
            matchStage['createdAt'] = {};
          }
          matchStage['createdAt']['$gte'] = new Date(filters['startDate'] as string);
        }
        break;
      }
    }
  }

  if (Object.keys(matchStage).length > 0) {
    aggregationPipeline.push({ $match: matchStage });
  }
}

function addTopNStage(topN: UsageAnalyticInput['topN'], aggregationPipeline: any[]) {
  if (topN) {
    const { n, property } = topN;
    aggregationPipeline.push({ $sort: { [property]: -1 } });
    aggregationPipeline.push({ $limit: n });
  }
}

function addGroupStage(dimension: string | undefined, metrics: string[], aggregationPipeline: any[]): any {
  const groupStage: any = {
    _id: dimension ? `$${dimension}` : null,
  };

  metrics.forEach((metric) => {
    switch (metric) {
      case 'total_tokens':
        groupStage['total_tokens'] = { $sum: '$totalTokens' };
        break;
      case 'total_cost':
        groupStage['total_cost'] = { $sum: '$cost' };
        break;
      case 'total_sessions':
        groupStage['uniq_sessions'] = { $addToSet: '$sessionId' };
        break;
    }
  });

  aggregationPipeline.push({ $group: groupStage });

  if (metrics.includes('total_sessions')) {
    aggregationPipeline.push({
      $addFields: {
        total_sessions: { $size: '$uniq_sessions' },
      },
    });

    aggregationPipeline.push({
      $project: {
        uniq_sessions: 0,
      },
    });
  }
  return groupStage;
}
export default function buildAggregation(aggregateInput: UsageAnalyticInput): any[] {
  const { dimension, filters, metrics, topN } = aggregateInput;
  const aggregationPipeline: any[] = [];

  addFilterStage(filters, aggregationPipeline);

  addGroupStage(dimension, metrics, aggregationPipeline);

  addTopNStage(topN, aggregationPipeline);

  return aggregationPipeline.length > 0 ? aggregationPipeline : [];
}
