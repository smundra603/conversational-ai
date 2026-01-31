export type AppEnv = {
  NODE_ENV: 'development' | 'test' | 'production';
  SERVICE_NAME: string;
  HOST: string;
  PORT: number;
  LOG_LEVEL: 'fatal' | 'error' | 'warn' | 'info' | 'debug' | 'trace' | 'silent';
  CORS_ORIGIN: boolean | string | string[];
  MONGO_URI: string;
  JWT_SECRET: string;
};

export const envSchema = {
  type: 'object',
  required: ['NODE_ENV', 'SERVICE_NAME', 'PORT', 'HOST', 'LOG_LEVEL', 'CORS_ORIGIN', 'MONGO_URI', 'JWT_SECRET'],
  properties: {
    NODE_ENV: {
      type: 'string',
      enum: ['development', 'test', 'production'],
      default: 'development',
    },
    SERVICE_NAME: { type: 'string', default: 'conversational-ai' },
    HOST: { type: 'string', default: '127.0.0.1' },
    PORT: { type: 'integer', default: 3000 },
    LOG_LEVEL: {
      type: 'string',
      enum: ['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'],
      default: 'info',
    },
    CORS_ORIGIN: {
      anyOf: [{ type: 'boolean' }, { type: 'string' }, { type: 'array', items: { type: 'string' } }],
      default: true,
    },
    MONGO_URI: { type: 'string' },
    JWT_SECRET: { type: 'string' },
  },
} as const;
