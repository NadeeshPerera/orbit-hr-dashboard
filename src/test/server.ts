import { setupServer } from "msw/node";
import { HrDatabase } from "@/mocks/db";
import { createHandlers } from "@/mocks/handlers";

export const server = setupServer();

/** Fresh mock database for one test; returns it so tests can assert on server state. */
export function useMockApi(now = new Date(2026, 10, 18, 10)) {
  const db = new HrDatabase(() => now);
  server.use(...createHandlers(db));
  return db;
}
