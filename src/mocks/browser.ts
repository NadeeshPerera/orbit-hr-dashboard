import { setupWorker } from "msw/browser";
import { HrDatabase } from "./db";
import { createHandlers } from "./handlers";

/** One in-memory database per page load; it resets when the tab reloads. */
export const worker = setupWorker(...createHandlers(new HrDatabase()));
