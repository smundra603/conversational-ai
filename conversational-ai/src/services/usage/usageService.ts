import { Scope } from '../../enums/scope.enum.js';
import {
  GetAllUsagesInput,
  GetUsageInput,
  TrackUsageInput,
  UsageAnalyticInput,
  UsageAnalyticsResponse,
} from '../../interfaces/analytics.interface.js';
import { Context } from '../../interfaces/context.interface.js';
import { usageRepository } from '../../models/usage/usage.repository.js';
import { UsageType } from '../../models/usage/usage.schema.js';
import { isPermitted } from '../../utils/rbac.js';
import { postProcessUsageAnalyticsResults } from './utils/usageAnalytics.utils.js';

class UsageService {
  /**
   * Track usage event
   * @param input
   * @param context
   * @returns Usage
   */
  async trackUsage(input: TrackUsageInput, context: Context): Promise<UsageType | undefined> {
    const usage = await usageRepository.createUsage(input, context);
    return usage;
  }

  /**
   * Get usage analytics
   * @param input
   * @param context
   * @returns UsageAnalyticsResponse[]
   */
  async usageAnalytics(input: UsageAnalyticInput, context: Context): Promise<UsageAnalyticsResponse[]> {
    // used genrics for analytics and query database to avoid too many different request
    // dimension: Used to group data (e.g., by day, by user)
    // metrics: Used to specify which metrics to retrieve (e.g., total usage, average usage)
    // topN: Used to limit results to top N entries based on a specific metric

    // Check if user has admin dashboard access
    if (!isPermitted(context, Scope.USAGE_DASHBOARD)) {
      throw new Error('Access denied: insufficient permissions to access usage analytics');
    }
    // Aggregate usage data based on input parameters
    const usageAnalytics = await usageRepository.aggregateUsages(input, context);

    // Post-process results if needed
    await postProcessUsageAnalyticsResults(input, usageAnalytics, context);
    return usageAnalytics;
  }

  async getUsage(input: GetUsageInput, context: Context): Promise<UsageType | null> {
    const usage = await usageRepository.getUsage(input, context);
    return usage;
  }

  async getAllUsages(input: GetAllUsagesInput, context: Context): Promise<UsageType[]> {
    const usages = await usageRepository.getAllUsages(input, context);
    return usages;
  }
}

export const usageService = new UsageService();
