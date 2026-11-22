/**
 * Runs in the browser only, before the app becomes interactive.
 * Starts Mock Service Worker so /api/* is answered in the browser, unless a real
 * backend is configured. Keeping it here means MSW never enters the server bundle.
 */
if (!process.env.NEXT_PUBLIC_API_URL) {
  window.__orbitMocksReady = import("./mocks/browser").then(({ worker }) =>
    worker.start({ onUnhandledFrame: "bypass", quiet: true }).then(() => undefined),
  );
}
