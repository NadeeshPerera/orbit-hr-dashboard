export {};

declare global {
  interface Window {
    /** Resolves when the mock API is ready (set in src/instrumentation-client.ts). */
    __orbitMocksReady?: Promise<void>;
  }
}
