import { sleep } from '../services/generativeAI/utils/failoverMock.utils.js';
import { ProviderError } from './error.util.js';

export async function withRetry<T>(fn: (...args: unknown[]) => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (err) {
    if (err instanceof ProviderError && err.code === 429 && retries > 0) {
      await sleep(err.retryAfterMs ?? 500);
      return withRetry(fn, retries - 1);
    }
    throw err;
  }
}
