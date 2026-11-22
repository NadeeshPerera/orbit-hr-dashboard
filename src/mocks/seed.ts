import { addDays, subDays, subMonths } from "date-fns";
import { DEPARTMENTS, type Department, type Employee, type EmploymentType, type LeaveType } from "@/lib/api/types";
import { countWorkingDays, rangesOverlap, toISODate } from "@/lib/dates";

// All people and data are fictional. "Orbit" is a made-up company.

export type Rng = () => number;

/** Small seeded PRNG (mulberry32): same seed → same company every time. */
export function createRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(rng: Rng, items: readonly T[]) => items[Math.floor(rng() * items.length)];
const int = (rng: Rng, min: number, max: number) => Math.floor(min + rng() * (max - min + 1));

const FIRST_NAMES = [
  "Ava", "Liam", "Noah", "Mia", "Lucas", "Zara", "Ethan", "Isla", "Mateo", "Aisha", "Leo", "Sofia", "Kai", "Amara",
  "Oliver", "Priya", "Hugo", "Yuki", "Elena", "Omar", "Nina", "Ravi", "Chloe", "Jonas", "Fatima", "Theo", "Maya",
  "Diego", "Hana", "Samuel", "Leila", "Arjun", "Grace", "Felix", "Ines", "Kenji", "Sara", "Tomás", "Ana", "Daniel",
];
const LAST_NAMES = [
  "Chen", "Patel", "García", "Okafor", "Müller", "Silva", "Nguyen", "Kim", "Johansson", "Rossi", "Haddad", "Kowalski",
  "Tanaka", "Fernandes", "O'Brien", "Novak", "Mensah", "Larsen", "Dubois", "Ahmed", "Costa", "Ivanova", "Moreau",
  "Reyes", "Schmidt", "Andersen", "Banerjee", "Walsh", "Yamamoto", "Lopez",
];
const LOCATIONS = ["London", "Berlin", "New York", "Toronto", "Lisbon", "Sydney", "Bengaluru", "Remote"];

const TITLES: Record<Department, string[]> = {
  Engineering: ["Software Engineer", "Senior Software Engineer", "Staff Engineer", "Frontend Engineer", "Platform Engineer", "QA Engineer"],
  Product: ["Product Manager", "Senior Product Manager", "Product Analyst"],
  Design: ["Product Designer", "Senior Product Designer", "UX Researcher"],
  Marketing: ["Content Marketer", "Growth Marketer", "Brand Designer"],
  Sales: ["Account Executive", "Sales Development Rep", "Sales Engineer"],
  "Customer Success": ["Customer Success Manager", "Support Specialist", "Implementation Lead"],
  People: ["People Partner", "Recruiter", "People Operations Specialist"],
  Finance: ["Financial Analyst", "Accountant", "Payroll Specialist"],
  Operations: ["Operations Manager", "Office Coordinator", "IT Administrator"],
};
const HEADS: Record<Department, string> = {
  Engineering: "VP of Engineering",
  Product: "Head of Product",
  Design: "Head of Design",
  Marketing: "Head of Marketing",
  Sales: "Head of Sales",
  "Customer Success": "Head of Customer Success",
  People: "Head of People",
  Finance: "Head of Finance",
  Operations: "Head of Operations",
};
/** Relative team sizes. */
const WEIGHTS: Record<Department, number> = {
  Engineering: 9, Product: 3, Design: 3, Marketing: 3, Sales: 5, "Customer Success": 4, People: 2, Finance: 2, Operations: 2,
};

export interface SeedLeave {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "cancelled";
  createdAt: string;
  reviewedAt: string | null;
}

export interface Seed {
  employees: Employee[];
  leave: SeedLeave[];
  /** The signed-in demo user (Head of People). */
  currentUserId: string;
}

export function buildSeed(today: Date, seed = 7): Seed {
  const rng = createRng(seed);
  const employees: Employee[] = [];
  // Reserved for the demo user, so no generated person can share her name or email.
  const usedNames = new Set<string>(["Ava Chen"]);
  let n = 1000;

  const person = (department: Department, jobTitle: string, managerId: string | null, overrides: Partial<Employee> = {}): Employee => {
    let first: string, last: string;
    do {
      first = pick(rng, FIRST_NAMES);
      last = pick(rng, LAST_NAMES);
    } while (usedNames.has(`${first} ${last}`));
    usedNames.add(`${first} ${last}`);

    const tenureDays = int(rng, 20, 365 * 7);
    const status: Employee["status"] = tenureDays < 45 ? "onboarding" : rng() < 0.05 ? "on_leave" : "active";
    const employmentType: EmploymentType = rng() < 0.82 ? "full_time" : pick(rng, ["part_time", "contractor", "intern"] as const);
    const emailName = `${first}.${last}`.toLowerCase().normalize("NFD").replace(/[^a-z.]/g, "");
    const e: Employee = {
      id: `EMP-${++n}`,
      firstName: first,
      lastName: last,
      email: `${emailName}@orbit-demo.com`,
      phone: `+1 555 01${String(int(rng, 0, 99)).padStart(2, "0")} ${String(int(rng, 1000, 9999))}`,
      jobTitle,
      department,
      location: pick(rng, LOCATIONS),
      employmentType,
      status,
      startDate: toISODate(subDays(today, tenureDays)),
      endDate: null,
      birthDate: toISODate(subDays(subMonths(today, 12 * int(rng, 22, 58)), int(rng, 0, 364))),
      managerId,
      ...overrides,
    };
    employees.push(e);
    return e;
  };

  // Leadership first, then each department's team reporting to its head.
  const ceo = person("Operations", "Chief Executive Officer", null, { status: "active", employmentType: "full_time" });
  const heads = Object.fromEntries(
    DEPARTMENTS.map((d) => [d, person(d, HEADS[d], ceo.id, { status: "active", employmentType: "full_time" })]),
  ) as Record<Department, Employee>;

  // The demo user is the Head of People.
  const me = heads.People;
  Object.assign(me, { firstName: "Ava", lastName: "Chen", email: "ava.chen@orbit-demo.com" });

  for (const d of DEPARTMENTS) {
    for (let i = 0; i < WEIGHTS[d] * 4; i++) person(d, pick(rng, TITLES[d]), heads[d].id);
  }

  // A few people who left in the last year (for attrition and headcount trend).
  for (let i = 0; i < 9; i++) {
    const d = pick(rng, DEPARTMENTS);
    const end = subDays(today, int(rng, 10, 330));
    person(d, pick(rng, TITLES[d]), heads[d].id, {
      status: "offboarded",
      startDate: toISODate(subDays(end, int(rng, 200, 1500))),
      endDate: toISODate(end),
    });
  }

  // ---------- Leave ----------
  const leave: SeedLeave[] = [];
  let leaveId = 5000;
  const reasons: Record<LeaveType, string[]> = {
    annual: ["Family trip", "Long weekend", "Moving house", "Visiting family", "Wedding"],
    sick: ["Flu", "Medical appointment", "Recovering from surgery"],
    parental: ["Parental leave"],
    unpaid: ["Personal matters", "Extended travel"],
  };
  const addLeave = (employeeId: string, type: LeaveType, start: Date, length: number, status: SeedLeave["status"]) => {
    const startDate = toISODate(start);
    const endDate = toISODate(addDays(start, length - 1));
    const createdAt = subDays(start, int(rng, 3, 30));
    // Same rule as the API: no overlapping pending/approved time off for one person.
    const live = (s: SeedLeave["status"]) => s === "pending" || s === "approved";
    if (live(status) && leave.some((l) => l.employeeId === employeeId && live(l.status) && rangesOverlap(l.startDate, l.endDate, startDate, endDate))) return;
    leave.push({
      id: `LR-${++leaveId}`,
      employeeId,
      type,
      startDate,
      endDate,
      days: countWorkingDays(startDate, endDate),
      reason: pick(rng, reasons[type]),
      status,
      createdAt: createdAt.toISOString(),
      reviewedAt: status === "pending" ? null : addDays(createdAt, 1).toISOString(),
    });
  };

  const current = employees.filter((e) => e.status !== "offboarded");
  // History for everyone. Lengths are capped so totals stay within the yearly
  // entitlements (max 3 × 5 = 15 of 20 annual days, 3 × 2 = 6 of 10 sick days).
  for (const e of current) {
    for (let i = 0; i < int(rng, 0, 3); i++) {
      const sick = rng() >= 0.75;
      addLeave(e.id, sick ? "sick" : "annual", subDays(today, int(rng, 15, 300)), sick ? int(rng, 1, 2) : int(rng, 1, 5), rng() < 0.92 ? "approved" : "rejected");
    }
  }
  // People on leave today: long absences are parental or unpaid leave, which aren't capped.
  for (const e of current.filter((x) => x.status === "on_leave")) {
    addLeave(e.id, rng() < 0.7 ? "parental" : "unpaid", subDays(today, int(rng, 2, 10)), 40, "approved");
  }
  // Pending requests waiting for Ava (her direct reports and other team members).
  const requesters = current.filter((e) => e.id !== me.id && e.managerId !== null).slice(0, 60);
  // Seven different people, so pending requests can't overlap for the same person.
  const pool = [...requesters];
  for (let i = 0; i < 7 && pool.length; i++) {
    const [person] = pool.splice(Math.floor(rng() * pool.length), 1);
    const type = pick(rng, ["annual", "annual", "annual", "sick", "unpaid"] as const);
    addLeave(person.id, type, addDays(today, int(rng, 3, 50)), type === "sick" ? int(rng, 1, 2) : int(rng, 1, 10), "pending");
  }
  // Ava's own history so her balances aren't empty.
  addLeave(me.id, "annual", subDays(today, 70), 5, "approved");
  addLeave(me.id, "sick", subDays(today, 140), 1, "approved");
  addLeave(me.id, "annual", addDays(today, 40), 3, "pending");

  return { employees, leave, currentUserId: me.id };
}
