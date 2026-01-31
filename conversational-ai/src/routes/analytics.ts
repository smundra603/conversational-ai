import { FastifyPluginAsync, FastifyReply } from 'fastify';
import { GetUsageAnalyticsRequest } from '../interfaces/analytics.interface.js';
import { usageService } from '../services/usage/usageService.js';
import logger from '../utils/logger.js';

export const analyticsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/usage', async (req: GetUsageAnalyticsRequest, res: FastifyReply) => {
    try {
      if (!req.query) {
        return res.status(400).send({ error: 'Invalid query parameters' });
      }
      const { metrics, dimension, topN } = req.query;

      logger.info(`Fetching usage analytics with metrics: ${metrics} and dimension: ${dimension} and topN: ${topN}`);

      const usageAnalytics = await usageService.usageAnalytics(
        {
          ...req.query,
        },
        req.context,
      );

      res.status(200).send(usageAnalytics);
    } catch (error) {
      logger.error(`Error fetching usage analytics: ${error}`);
      res.status(500).send({ error: 'Failed to fetch usage analytics' });
    }
  });

  app.post('/usage', async (req: GetUsageAnalyticsRequest, res: FastifyReply) => {
    try {
      if (!req.body) {
        return res.status(400).send({ error: 'Invalid body parameters' });
      }
      const { metrics, dimension, topN } = req.body ?? {};

      logger.info(`Fetching usage analytics with metrics: ${metrics} and dimension: ${dimension} and topN: ${topN}`);

      const usageAnalytics = await usageService.usageAnalytics(
        {
          ...req.body,
        },
        req.context,
      );

      res.status(200).send(usageAnalytics);
    } catch (error) {
      logger.error(`Error fetching usage analytics: ${error}`);
      res.status(500).send({ error: 'Failed to fetch usage analytics' });
    }
  });
};
