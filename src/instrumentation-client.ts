/**
 * Runs in the browser only, before the app becomes interactive.
 * Starts the mock API unless a real backend is configured. Keeping it here means
 * MSW never enters the server bundle. The API client awaits this before fetching,
 * so pages render immediately and data requests simply wait until mocks are ready.
 */
if (!process.env.NEXT_PUBLIC_API_URL) {
  window.__orbitMocksReady = import("./mocks/browser").then(({ startMockApi }) => startMockApi()).then(() => undefined);
}
