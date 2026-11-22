/**
 * In-memory HR "backend". Pure TypeScript with an injected clock so every rule
 * is unit-testable. MSW handlers (./handlers.ts) expose it over HTTP.
 */
import { differenceInCalendarYears, endOfMonth, format, startOfMonth, startOfQuarter, subMonths } from "date-fns";
import {
  DEPARTMENTS,
  type CreateLeaveRequest,
  type DashboardData,
  type Employee,
  type EmployeeDetail,
  type EmployeeFacets,
  type EmployeeQuery,
  type EmployeeSummary,
  type HeadcountPoint,
  type LeaveBalance,
  type LeaveRequest,
  type LeaveStatus,
  type LeaveType,
  type LoginResponse,
  type Page,
  type UpcomingEvent,
  type User,
} from "@/lib/api/types";
import { countWorkingDays, fromISODate, nextOccurrence, rangesOverlap, toISODate } from "@/lib/dates";
import { buildSeed, type Seed, type SeedLeave } from "./seed";

import { DEMO_EMAIL, DEMO_PASSWORD } from "./demo-account";

export { DEMO_EMAIL, DEMO_PASSWORD };

/** Annual entitlements in working days; null = not capped. */
export const ENTITLEMENTS: Record<LeaveType, number | null> = { annual: 20, sick: 10, parental: null, unpaid: null };

export class MockApiError extends Error {
  constructor(
    public status: number,
    public title: string,
    public detail?: string,
    public errors?: Record<string, string[]>,
  ) {
    super(detail ?? title);
  }
}

const summary = (e: Employee): EmployeeSummary => ({
  id: e.id,
  firstName: e.firstName,
  lastName: e.lastName,
  jobTitle: e.jobTitle,
  department: e.department,
});

const isCurrent = (e: Employee) => e.status !== "offboarded";

export class HrDatabase {
  private employees: Map<string, Employee>;
  private leave: SeedLeave[];
  private readonly currentUserId: string;
  private seq = 9000;

  constructor(
    private readonly now: () => Date = () => new Date(),
    seed: Seed = buildSeed(now()),
  ) {
    this.employees = new Map(seed.employees.map((e) => [e.id, structuredClone(e)]));
    this.leave = structuredClone(seed.leave);
    this.currentUserId = seed.currentUserId;
  }

  private today = () => toISODate(this.now());

  // ---------- Auth ----------

  login(email: string, password: string): LoginResponse {
    if (email.trim().toLowerCase() !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
      throw new MockApiError(401, "Invalid credentials", "That email and password don't match our records.");
    }
    return { token: "demo-token", user: this.me() };
  }

  me(): User {
    const e = this.employees.get(this.currentUserId)!;
    return { id: e.id, name: `${e.firstName} ${e.lastName}`, email: e.email, role: "admin", title: e.jobTitle };
  }

  // ---------- Employees ----------

  listEmployees(query: EmployeeQuery = {}): Page<Employee> {
    const page = Math.max(1, query.page ?? 1);
    const pageSize = Math.min(100, Math.max(1, query.pageSize ?? 10));
    const q = query.q?.trim().toLowerCase();

    const filtered = [...this.employees.values()].filter((e) => {
      if (query.department && e.department !== query.department) return false;
      if (query.status ? e.status !== query.status : e.status === "offboarded") return false;
      if (query.location && e.location !== query.location) return false;
      if (q) {
        const haystack = `${e.firstName} ${e.lastName} ${e.email} ${e.jobTitle} ${e.id}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });

    const dir = query.dir === "desc" ? -1 : 1;
    const key = (e: Employee): string => {
      switch (query.sort ?? "name") {
        case "name": return `${e.lastName} ${e.firstName}`;
        case "department": return e.department;
        case "jobTitle": return e.jobTitle;
        case "location": return e.location;
        case "startDate": return e.startDate;
        case "status": return e.status;
      }
    };
    filtered.sort((a, b) => key(a).localeCompare(key(b)) * dir || a.id.localeCompare(b.id));

    return {
      items: filtered.slice((page - 1) * pageSize, page * pageSize).map((e) => structuredClone(e)),
      total: filtered.length,
      page,
      pageSize,
    };
  }

  facets(): EmployeeFacets {
    const current = [...this.employees.values()].filter(isCurrent);
    const count = <K extends string>(values: K[]) => {
      const m = new Map<K, number>();
      values.forEach((v) => m.set(v, (m.get(v) ?? 0) + 1));
      return [...m.entries()].map(([value, count]) => ({ value, count })).sort((a, b) => a.value.localeCompare(b.value));
    };
    return { departments: count(current.map((e) => e.department)), locations: count(current.map((e) => e.location)) };
  }

  getEmployee(id: string): EmployeeDetail {
    const e = this.employees.get(id);
    if (!e) throw new MockApiError(404, "Employee not found");
    const manager = e.managerId ? this.employees.get(e.managerId) : undefined;
    return {
      ...structuredClone(e),
      manager: manager ? summary(manager) : null,
      directReports: [...this.employees.values()].filter((x) => x.managerId === id && isCurrent(x)).map(summary),
      leaveBalances: this.balances(id),
    };
  }

  // ---------- Leave ----------

  balances(employeeId: string): LeaveBalance[] {
    const year = this.today().slice(0, 4);
    const mine = this.leave.filter((l) => l.employeeId === employeeId && l.startDate.startsWith(year));
    return (Object.keys(ENTITLEMENTS) as LeaveType[]).map((type) => ({
      type,
      entitled: ENTITLEMENTS[type],
      used: mine.filter((l) => l.type === type && l.status === "approved").reduce((s, l) => s + l.days, 0),
      pending: mine.filter((l) => l.type === type && l.status === "pending").reduce((s, l) => s + l.days, 0),
    }));
  }

  listLeave({ status, scope = "team" }: { status?: LeaveStatus; scope?: "team" | "mine" } = {}): LeaveRequest[] {
    return this.leave
      .filter((l) => (scope === "mine" ? l.employeeId === this.currentUserId : l.employeeId !== this.currentUserId))
      .filter((l) => !status || l.status === status)
      .sort((a, b) => (status === "pending" ? a.startDate.localeCompare(b.startDate) : b.createdAt.localeCompare(a.createdAt)))
      .map((l) => this.toRequest(l));
  }

  reviewLeave(id: string, decision: "approved" | "rejected"): LeaveRequest {
    const l = this.leave.find((x) => x.id === id);
    if (!l) throw new MockApiError(404, "Request not found");
    if (l.employeeId === this.currentUserId) {
      throw new MockApiError(403, "Not allowed", "You can't approve your own time off.");
    }
    if (l.status !== "pending") {
      throw new MockApiError(409, "Already reviewed", `This request was already ${l.status}.`);
    }
    l.status = decision;
    l.reviewedAt = this.now().toISOString();
    return this.toRequest(l);
  }

  createLeave(input: CreateLeaveRequest): LeaveRequest {
    const errors: Record<string, string[]> = {};
    const today = this.today();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.startDate)) errors.startDate = ["Choose a start date."];
    if (!/^\d{4}-\d{2}-\d{2}$/.test(input.endDate)) errors.endDate = ["Choose an end date."];
    if (!errors.startDate && input.startDate < today) errors.startDate = ["Start date can't be in the past."];
    if (!errors.startDate && !errors.endDate && input.endDate < input.startDate) errors.endDate = ["End date must be on or after the start date."];
    if (input.reason.trim().length > 200) errors.reason = ["Keep the note under 200 characters."];
    if (Object.keys(errors).length) throw new MockApiError(400, "Validation failed", undefined, errors);

    const days = countWorkingDays(input.startDate, input.endDate);
    if (days === 0) throw new MockApiError(422, "No working days", "The dates you picked fall on a weekend.");

    const clash = this.leave.find(
      (l) =>
        l.employeeId === this.currentUserId &&
        (l.status === "pending" || l.status === "approved") &&
        rangesOverlap(l.startDate, l.endDate, input.startDate, input.endDate),
    );
    if (clash) throw new MockApiError(409, "Overlapping request", `You already have time off booked from ${clash.startDate} to ${clash.endDate}.`);

    const balance = this.balances(this.currentUserId).find((b) => b.type === input.type)!;
    if (balance.entitled !== null && balance.used + balance.pending + days > balance.entitled) {
      const left = balance.entitled - balance.used - balance.pending;
      throw new MockApiError(422, "Not enough balance", `You have ${left} ${input.type} day${left === 1 ? "" : "s"} left this year.`);
    }

    const created: SeedLeave = {
      id: `LR-${++this.seq}`,
      employeeId: this.currentUserId,
      type: input.type,
      startDate: input.startDate,
      endDate: input.endDate,
      days,
      reason: input.reason.trim(),
      status: "pending",
      createdAt: this.now().toISOString(),
      reviewedAt: null,
    };
    this.leave.push(created);
    return this.toRequest(created);
  }

  private toRequest(l: SeedLeave): LeaveRequest {
    const { employeeId, ...rest } = l;
    return { ...structuredClone(rest), employee: summary(this.employees.get(employeeId)!) };
  }

  // ---------- Dashboard ----------

  dashboard(): DashboardData {
    const now = this.now();
    const today = this.today();
    const all = [...this.employees.values()];
    const current = all.filter((e) => isCurrent(e) && e.startDate <= today);

    const trend: HeadcountPoint[] = [];
    for (let i = 11; i >= 0; i--) {
      const month = subMonths(now, i);
      const from = toISODate(startOfMonth(month));
      const to = i === 0 ? today : toISODate(endOfMonth(month));
      trend.push({
        month: format(month, "yyyy-MM"),
        headcount: all.filter((e) => e.startDate <= to && (!e.endDate || e.endDate > to)).length,
        hires: all.filter((e) => e.startDate >= from && e.startDate <= to).length,
        exits: all.filter((e) => e.endDate && e.endDate >= from && e.endDate <= to).length,
      });
    }
    const avgHeadcount = trend.reduce((s, p) => s + p.headcount, 0) / trend.length;
    const exits = trend.reduce((s, p) => s + p.exits, 0);

    const quarterStart = toISODate(startOfQuarter(now));
    const onLeaveToday = new Set(
      this.leave.filter((l) => l.status === "approved" && l.startDate <= today && l.endDate >= today).map((l) => l.employeeId),
    ).size;

    const horizon = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 30);
    const upcoming: UpcomingEvent[] = [];
    for (const e of current) {
      const birthday = nextOccurrence(e.birthDate, now);
      if (birthday <= horizon) upcoming.push({ kind: "birthday", employee: summary(e), date: toISODate(birthday), years: null });
      const anniversary = nextOccurrence(e.startDate, now);
      const years = differenceInCalendarYears(anniversary, fromISODate(e.startDate));
      if (years >= 1 && anniversary <= horizon) upcoming.push({ kind: "anniversary", employee: summary(e), date: toISODate(anniversary), years });
    }
    upcoming.sort((a, b) => a.date.localeCompare(b.date) || a.employee.lastName.localeCompare(b.employee.lastName));

    return {
      headcount: current.length,
      headcountChange: current.length - trend[0].headcount,
      newHiresThisQuarter: all.filter((e) => e.startDate >= quarterStart && e.startDate <= today).length,
      attritionRate: avgHeadcount ? exits / avgHeadcount : 0,
      onLeaveToday,
      pendingApprovals: this.leave.filter((l) => l.status === "pending" && l.employeeId !== this.currentUserId).length,
      headcountTrend: trend,
      byDepartment: DEPARTMENTS.map((department) => ({ department, count: current.filter((e) => e.department === department).length }))
        .sort((a, b) => b.count - a.count),
      upcoming: upcoming.slice(0, 8),
      recentHires: [...current]
        .sort((a, b) => b.startDate.localeCompare(a.startDate))
        .slice(0, 5)
        .map((e) => ({ ...summary(e), startDate: e.startDate })),
    };
  }
}
