import { delay, type PathParams } from "msw";
import { http, HttpResponse } from "msw/http";
import {
  DEPARTMENTS,
  EMPLOYEE_SORT_FIELDS,
  EMPLOYEE_STATUSES,
  LEAVE_STATUSES,
  LEAVE_TYPES,
  type CreateLeaveRequest,
  type EmployeeQuery,
} from "@/lib/api/types";
import { HrDatabase, MockApiError } from "./db";

const oneOf = <T extends string>(list: readonly T[], value: string | null): T | undefined =>
  value && (list as readonly string[]).includes(value) ? (value as T) : undefined;

function problem(e: unknown) {
  if (e instanceof MockApiError) {
    return HttpResponse.json(
      { title: e.title, status: e.status, detail: e.detail, errors: e.errors },
      { status: e.status, headers: { "Content-Type": "application/problem+json" } },
    );
  }
  throw e;
}

/** Wraps a resolver: realistic latency, auth check, errors as RFC 7807 problem+json. */
function route<Args extends { request: Request }>(fn: (args: Args) => unknown | Promise<unknown>, { auth = true } = {}) {
  return async (args: Args) => {
    await delay();
    if (auth && args.request.headers.get("Authorization") !== "Bearer demo-token") {
      return HttpResponse.json({ title: "Unauthorized", status: 401 }, { status: 401 });
    }
    try {
      return HttpResponse.json((await fn(args)) as object);
    } catch (e) {
      return problem(e);
    }
  };
}

/** All mock endpoints, bound to one database instance (fresh per test). */
export function createHandlers(db: HrDatabase) {
  return [
    http.post(
      "/api/auth/login",
      route(async ({ request }) => {
        const body = (await request.json()) as { email?: string; password?: string };
        return db.login(body.email ?? "", body.password ?? "");
      }, { auth: false }),
    ),
    http.get("/api/me", route(() => db.me())),
    http.get("/api/dashboard", route(() => db.dashboard())),

    http.get(
      "/api/employees",
      route(({ request }) => {
        const p = new URL(request.url).searchParams;
        const query: EmployeeQuery = {
          q: p.get("q") ?? undefined,
          department: oneOf(DEPARTMENTS, p.get("department")),
          status: oneOf(EMPLOYEE_STATUSES, p.get("status")),
          location: p.get("location") ?? undefined,
          sort: oneOf(EMPLOYEE_SORT_FIELDS, p.get("sort")),
          dir: p.get("dir") === "desc" ? "desc" : "asc",
          page: Number(p.get("page") ?? 1),
          pageSize: Number(p.get("pageSize") ?? 10),
        };
        return db.listEmployees(query);
      }),
    ),
    http.get("/api/employees/facets", route(() => db.facets())),
    http.get("/api/employees/:id", route(({ params }: { request: Request; params: PathParams }) => db.getEmployee(String(params.id)))),

    http.get(
      "/api/time-off/requests",
      route(({ request }) => {
        const p = new URL(request.url).searchParams;
        return db.listLeave({ status: oneOf(LEAVE_STATUSES, p.get("status")), scope: p.get("scope") === "mine" ? "mine" : "team" });
      }),
    ),
    http.post(
      "/api/time-off/requests",
      route(async ({ request }) => {
        const body = (await request.json()) as Partial<CreateLeaveRequest>;
        return db.createLeave({
          type: oneOf(LEAVE_TYPES, body.type ?? null) ?? "annual",
          startDate: body.startDate ?? "",
          endDate: body.endDate ?? "",
          reason: body.reason ?? "",
        });
      }),
    ),
    http.patch(
      "/api/time-off/requests/:id",
      route(async ({ request, params }: { request: Request; params: PathParams }) => {
        const body = (await request.json()) as { status?: string };
        if (body.status !== "approved" && body.status !== "rejected") {
          throw new MockApiError(400, "Validation failed", undefined, { status: ["Use approved or rejected."] });
        }
        return db.reviewLeave(String(params.id), body.status);
      }),
    ),
    http.get("/api/time-off/balances", route(() => db.balances(db.me().id))),
  ];
}
