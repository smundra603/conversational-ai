import { AsyncLocalStorage } from 'async_hooks';

export type RequestContextStore = {
  requestId: string;
};

const storage = new AsyncLocalStorage<RequestContextStore>();

export const requestContext = {
  run<T>(store: RequestContextStore, callback: () => T): T {
    return storage.run(store, callback);
  },
  enterWith(store: RequestContextStore): void {
    storage.enterWith(store);
  },
  getStore(): RequestContextStore | undefined {
    return storage.getStore();
  },
  getRequestId(): string | undefined {
    return storage.getStore()?.requestId;
  },
};
