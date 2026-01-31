import winston from 'winston';
import { requestContext } from './requestContext.js';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.colorize(),
    winston.format.printf(({ timestamp, level, message }) => {
      const reqId = requestContext.getRequestId();
      const reqPrefix = reqId ? ` [req:${reqId}]` : '';
      return `${timestamp} [${level}]${reqPrefix}: ${message}`;
    }),
  ),
  transports: [new winston.transports.Console()],
});

export default logger;
