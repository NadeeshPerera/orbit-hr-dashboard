import { describe, expect, it } from "vitest";
import { HrDatabase, MockApiError } from "./db";
import { buildSeed } from "./seed";

const NOW = new Date(2026, 10, 18, 10); // Wed 18 Nov 2026
const makeDb = () => new HrDatabase(() => NOW);

function expectError(fn: () => unknown, status: number, title: string) {
  try {
    fn();
  } catch (e) {
    expect(e).toBeInstanceOf(MockApiError);
    expect(e).toMatchObject({ status, title });
    return e as MockApiError;
  }
  throw new Error("expected a MockApiError");
}

describe("seed", () => {
  it("is deterministic for the same date and seed", () => {
    expect(buildSeed(NOW, 7)).toEqual(buildSeed(NOW, 7));
  });

  it("never puts anyone over their capped leave entitlement", () => {
    const db = makeDb();
    for (const { id } of buildSeed(NOW).employees) {
      for (const b of db.balances(id)) {
        if (b.entitled !== null) expect(b.used + b.pending, `${id} ${b.type}`).toBeLessThanOrEqual(b.entitled);
      }
    }
  });

  it("never has overlapping pending or approved time off for the same person", () => {
    const { leave } = buildSeed(NOW);
    const active = leave.filter((l) => l.status === "pending" || l.status === "approved");
    for (const a of active) {
      const clash = active.find((b) => b !== a && b.employeeId === a.employeeId && a.startDate <= b.endDate && b.startDate <= a.endDate);
      expect(clash, `${a.id} overlaps ${clash?.id}`).toBeUndefined();
    }
  });

  it("has unique ids and emails, and every manager exists", () => {
    const { employees } = buildSeed(NOW);
    const ids = new Set(employees.map((e) => e.id));
    expect(ids.size).toBe(employees.length);
    expect(new Set(employees.map((e) => e.email)).size).toBe(employees.length);
    for (const e of employees) if (e.managerId) expect(ids.has(e.managerId)).toBe(true);
  });
});

describe("auth", () => {
  it("accepts the demo account (email is case-insensitive) and rejects anything else", () => {
    const db = makeDb();
    expect(db.login("  AVA.CHEN@orbit-demo.com ", "Demo@1234").user).toMatchObject({ name: "Ava Chen", role: "admin" });
    expectError(() => db.login("ava.chen@orbit-demo.com", "wrong"), 401, "Invalid credentials");
  });
});

describe("employees", () => {
  it("excludes offboarded people unless asked, and paginates", () => {
    const db = makeDb();
    const page1 = db.listEmployees({ pageSize: 10 });
    expect(page1.items).toHaveLength(10);
    expect(page1.items.every((e) => e.status !== "offboarded")).toBe(true);
    expect(db.listEmployees({ status: "offboarded" }).items.every((e) => e.status === "offboarded")).toBe(true);

    const page2 = db.listEmployees({ pageSize: 10, page: 2 });
    expect(page2.items[0].id).not.toBe(page1.items[0].id);
    expect(page2.total).toBe(page1.total);
  });

  it("filters by department and location, and searches name, email, title and id", () => {
    const db = makeDb();
    const eng = db.listEmployees({ department: "Engineering", pageSize: 100 });
    expect(eng.total).toBeGreaterThan(0);
    expect(eng.items.every((e) => e.department === "Engineering")).toBe(true);

    const lisbon = db.listEmployees({ location: "Lisbon", pageSize: 100 });
    expect(lisbon.items.every((e) => e.location === "Lisbon")).toBe(true);

    expect(db.listEmployees({ q: "ava chen" }).items[0]).toMatchObject({ firstName: "Ava", lastName: "Chen" });
    const someone = eng.items[3];
    expect(db.listEmployees({ q: someone.id }).items.map((e) => e.id)).toEqual([someone.id]);
  });

  it("sorts by any column in both directions", () => {
    const db = makeDb();
    const asc = db.listEmployees({ sort: "startDate", dir: "asc", pageSize: 100 }).items.map((e) => e.startDate);
    expect(asc).toEqual([...asc].sort());
    const desc = db.listEmployees({ sort: "department", dir: "desc", pageSize: 100 }).items.map((e) => e.department);
    expect(desc).toEqual([...desc].sort((a, b) => b.localeCompare(a)));
  });

  it("facet counts add up to the current headcount", () => {
    const db = makeDb();
    const total = db.listEmployees().total;
    expect(db.facets().departments.reduce((s, d) => s + d.count, 0)).toBe(total);
    expect(db.facets().locations.reduce((s, d) => s + d.count, 0)).toBe(total);
  });

  it("returns a profile with manager, direct reports and balances", () => {
    const db = makeDb();
    const me = db.getEmployee(db.me().id);
    expect(me.jobTitle).toBe("Head of People");
    expect(me.manager?.jobTitle).toBe("Chief Executive Officer");
    expect(me.directReports.length).toBeGreaterThan(0);
    expect(me.leaveBalances.map((b) => b.type)).toEqual(["annual", "sick", "parental", "unpaid"]);
    expectError(() => db.getEmployee("EMP-0"), 404, "Employee not found");
  });
});

describe("time off", () => {
  it("lists pending team requests soonest first, never including my own", () => {
    const db = makeDb();
    const pending = db.listLeave({ status: "pending" });
    expect(pending.length).toBeGreaterThan(0);
    expect(pending.every((r) => r.employee.id !== db.me().id)).toBe(true);
    const starts = pending.map((r) => r.startDate);
    expect(starts).toEqual([...starts].sort());
  });

  it("approves once, then refuses to review again", () => {
    const db = makeDb();
    const [first] = db.listLeave({ status: "pending" });
    expect(db.reviewLeave(first.id, "approved").status).toBe("approved");
    expectError(() => db.reviewLeave(first.id, "rejected"), 409, "Already reviewed");
    expect(db.listLeave({ status: "pending" }).some((r) => r.id === first.id)).toBe(false);
  });

  it("doesn't let managers approve their own time off", () => {
    const db = makeDb();
    const mine = db.listLeave({ scope: "mine", status: "pending" })[0];
    expectError(() => db.reviewLeave(mine.id, "approved"), 403, "Not allowed");
  });

  it("creates a request, counts working days and reserves the balance", () => {
    const db = makeDb();
    const before = db.balances(db.me().id).find((b) => b.type === "annual")!;
    // Mon 30 Nov – Fri 4 Dec 2026
    const r = db.createLeave({ type: "annual", startDate: "2026-11-30", endDate: "2026-12-04", reason: " Family trip " });
    expect(r).toMatchObject({ status: "pending", days: 5, reason: "Family trip" });
    expect(db.balances(db.me().id).find((b) => b.type === "annual")!.pending).toBe(before.pending + 5);
  });

  it("validates dates, weekends, overlaps and balance", () => {
    const db = makeDb();
    const err = expectError(() => db.createLeave({ type: "annual", startDate: "2026-11-01", endDate: "2026-11-02", reason: "" }), 400, "Validation failed");
    expect(err.errors?.startDate).toBeDefined();

    expectError(() => db.createLeave({ type: "annual", startDate: "2026-11-25", endDate: "2026-11-24", reason: "" }), 400, "Validation failed");
    expectError(() => db.createLeave({ type: "annual", startDate: "2026-11-21", endDate: "2026-11-22", reason: "" }), 422, "No working days");

    db.createLeave({ type: "sick", startDate: "2026-11-30", endDate: "2026-11-30", reason: "" });
    expectError(() => db.createLeave({ type: "annual", startDate: "2026-11-27", endDate: "2026-12-01", reason: "" }), 409, "Overlapping request");

    // 20 annual days a year; asking for ~6 weeks is too much.
    expectError(() => db.createLeave({ type: "annual", startDate: "2027-01-04", endDate: "2027-02-12", reason: "" }), 422, "Not enough balance");
    // Unpaid leave isn't capped.
    expect(db.createLeave({ type: "unpaid", startDate: "2027-01-04", endDate: "2027-02-12", reason: "" }).days).toBe(30);
  });
});

describe("dashboard", () => {
  it("is internally consistent", () => {
    const db = makeDb();
    const d = db.dashboard();
    expect(d.headcountTrend).toHaveLength(12);
    expect(d.headcountTrend.at(-1)!.month).toBe("2026-11");
    expect(d.headcountTrend.at(-1)!.headcount).toBe(d.headcount);
    expect(d.headcount).toBe(db.listEmployees().total);
    expect(d.byDepartment.reduce((s, x) => s + x.count, 0)).toBe(d.headcount);
    expect(d.pendingApprovals).toBe(db.listLeave({ status: "pending" }).length);
    expect(d.attritionRate).toBeGreaterThan(0);
    expect(d.attritionRate).toBeLessThan(1);
  });

  it("lists celebrations within the next 30 days, in date order", () => {
    const d = makeDb().dashboard();
    const dates = d.upcoming.map((u) => u.date);
    expect(dates).toEqual([...dates].sort());
    expect(dates.every((x) => x >= "2026-11-18" && x <= "2026-12-18")).toBe(true);
    expect(d.upcoming.filter((u) => u.kind === "anniversary").every((u) => (u.years ?? 0) >= 1)).toBe(true);
  });

  it("updates pending approvals after a decision", () => {
    const db = makeDb();
    const before = db.dashboard().pendingApprovals;
    db.reviewLeave(db.listLeave({ status: "pending" })[0].id, "rejected");
    expect(db.dashboard().pendingApprovals).toBe(before - 1);
  });
});
