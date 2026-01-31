export class ProviderError extends Error {
  constructor(
    message: string,
    public readonly code: number,
    public readonly retryAfterMs?: number,
  ) {
    super(message);
  }
}
export const isProviderError = (error: unknown): error is ProviderError => {
  return error instanceof ProviderError;
};
