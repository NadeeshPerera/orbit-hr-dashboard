import { getResponse } from "msw";
import { setupWorker } from "msw/browser";
import { HrDatabase } from "./db";
import { createHandlers } from "./handlers";

/** One in-memory database per page load; it resets when the tab reloads. */
const handlers = createHandlers(new HrDatabase());

/**
 * Starts the mock API. Prefers a Service Worker (requests show in DevTools' Network tab).
 * Where service workers aren't available (some embedded browsers, Firefox private
 * windows, insecure origins), the same handlers answer /api/* from inside the page.
 */
export async function startMockApi(): Promise<"service-worker" | "in-page"> {
  try {
    if (!("serviceWorker" in navigator)) throw new Error("Service workers are not supported here");
    await setupWorker(...handlers).start({ onUnhandledFrame: "bypass", quiet: true });
    return "service-worker";
  } catch (error) {
    console.info("[Orbit] Service Worker unavailable, serving the mock API in-page instead.", error);
    const nativeFetch = window.fetch.bind(window);
    window.fetch = async (input, init) => {
      const request = new Request(input, init);
      if (new URL(request.url).pathname.startsWith("/api/")) {
        const response = await getResponse(handlers, request);
        if (response) return response;
      }
      return nativeFetch(input, init);
    };
    return "in-page";
  }
}
