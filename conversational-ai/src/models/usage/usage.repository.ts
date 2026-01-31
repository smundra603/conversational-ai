import { Types } from 'mongoose';
import {
  GetAllUsagesInput,
  GetUsageInput,
  TrackUsageInput,
  UsageAnalyticInput,
  UsageAnalyticsResponse,
} from '../../interfaces/analytics.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { FilterQuery } from '../../interfaces/entity.interface.js';
import { EntityBaseCrud } from '../base/entity.repository.js';
import buildAggregation from './buildAggregation.js';
import { UsageType } from './usage.schema.js';

export class UsageRepository extends EntityBaseCrud<typeof UsageType> {
  public constructor() {
    super({
      modelClass: UsageType,
      schemaOptions: {
        collection: 'usages',
        timestamps: true,
      },
      cacheModel: true,
    });
  }

  async createUsage(usageInput: TrackUsageInput, context: Context): Promise<UsageType | undefined> {
    const UsageModel = await this.getModel(context, this.modelOptions);

    const usageDoc = new UsageModel({ ...usageInput, createdById: context.userId, updatedById: context.userId });

    const usage = await this.create({
      doc: usageDoc,
      context,
    });

    if (usage) {
      return usage;
    }
    return;
  }

  async aggregateUsages(aggregateInput: UsageAnalyticInput, context: Context): Promise<UsageAnalyticsResponse[]> {
    const aggregationQuery = buildAggregation(aggregateInput);
    const results = await this.aggregate<UsageAnalyticsResponse>({ aggregations: aggregationQuery, context });
    return results;
  }

  async getUsage(input: GetUsageInput, context: Context): Promise<UsageType | null> {
    const query: FilterQuery<UsageType> = {};
    if (input.usageId) {
      query._id = new Types.ObjectId(input.usageId);
    }

    if (input.generativeResponseId) {
      query.generativeResponseId = new Types.ObjectId(input.generativeResponseId);
    }

    const usage = await this.findOne({
      query,
      context,
    });
    return usage;
  }

  async getAllUsages(input: GetAllUsagesInput, context: Context): Promise<UsageType[]> {
    const query: FilterQuery<UsageType> = {};

    if (input.generativeResponseIds && input.generativeResponseIds.length > 0) {
      query.generativeResponseId = { $in: input.generativeResponseIds.map((id) => new Types.ObjectId(id)) };
    }

    if (input.usageIds && input.usageIds.length > 0) {
      query._id = { $in: input.usageIds.map((id) => new Types.ObjectId(id)) };
    }

    if (input.sessionIds && input.sessionIds.length > 0) {
      query.sessionId = { $in: input.sessionIds.map((id) => new Types.ObjectId(id)) };
    }

    const usages = await this.findAll({
      query: query,
      context,
    });
    return usages;
  }
}

export const usageRepository = new UsageRepository();
