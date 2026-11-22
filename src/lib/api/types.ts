/**
 * API contract. The mock API (src/mocks) implements it today; a real backend
 * should return exactly these shapes so no UI code has to change.
 * Dates are ISO strings: `yyyy-mm-dd` for calendar dates, full ISO for timestamps.
 */

export const DEPARTMENTS = [
  "Engineering",
  "Product",
  "Design",
  "Marketing",
  "Sales",
  "Customer Success",
  "People",
  "Finance",
  "Operations",
] as const;
export type Department = (typeof DEPARTMENTS)[number];

export const EMPLOYEE_STATUSES = ["active", "onboarding", "on_leave", "offboarded"] as const;
export type EmployeeStatus = (typeof EMPLOYEE_STATUSES)[number];

export const EMPLOYMENT_TYPES = ["full_time", "part_time", "contractor", "intern"] as const;
export type EmploymentType = (typeof EMPLOYMENT_TYPES)[number];

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  department: Department;
  location: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  /** yyyy-mm-dd */
  startDate: string;
  /** yyyy-mm-dd last working day, for offboarded employees */
  endDate: string | null;
  /** yyyy-mm-dd */
  birthDate: string;
  managerId: string | null;
}

export interface EmployeeSummary {
  id: string;
  firstName: string;
  lastName: string;
  jobTitle: string;
  department: Department;
}

export interface EmployeeDetail extends Employee {
  manager: EmployeeSummary | null;
  directReports: EmployeeSummary[];
  leaveBalances: LeaveBalance[];
}

export type SortDirection = "asc" | "desc";
export const EMPLOYEE_SORT_FIELDS = ["name", "department", "jobTitle", "location", "startDate", "status"] as const;
export type EmployeeSortField = (typeof EMPLOYEE_SORT_FIELDS)[number];

export interface EmployeeQuery {
  q?: string;
  department?: Department;
  status?: EmployeeStatus;
  location?: string;
  sort?: EmployeeSortField;
  dir?: SortDirection;
  page?: number;
  pageSize?: number;
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface EmployeeFacets {
  departments: { value: Department; count: number }[];
  locations: { value: string; count: number }[];
}

export const LEAVE_TYPES = ["annual", "sick", "parental", "unpaid"] as const;
export type LeaveType = (typeof LEAVE_TYPES)[number];

export const LEAVE_STATUSES = ["pending", "approved", "rejected", "cancelled"] as const;
export type LeaveStatus = (typeof LEAVE_STATUSES)[number];

export interface LeaveRequest {
  id: string;
  employee: EmployeeSummary;
  type: LeaveType;
  /** yyyy-mm-dd, inclusive */
  startDate: string;
  /** yyyy-mm-dd, inclusive */
  endDate: string;
  /** Working days (Mon–Fri). */
  days: number;
  reason: string;
  status: LeaveStatus;
  /** ISO timestamp */
  createdAt: string;
  reviewedAt: string | null;
}

export interface LeaveBalance {
  type: LeaveType;
  /** Days per year; null = unlimited / not tracked. */
  entitled: number | null;
  used: number;
  pending: number;
}

export interface CreateLeaveRequest {
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface HeadcountPoint {
  /** yyyy-mm */
  month: string;
  headcount: number;
  hires: number;
  exits: number;
}

export interface UpcomingEvent {
  kind: "birthday" | "anniversary";
  employee: EmployeeSummary;
  /** yyyy-mm-dd of the next occurrence */
  date: string;
  /** Years at the company, for anniversaries */
  years: number | null;
}

export interface DashboardData {
  headcount: number;
  headcountChange: number;
  newHiresThisQuarter: number;
  /** 0–1, exits in the last 12 months ÷ average headcount */
  attritionRate: number;
  onLeaveToday: number;
  pendingApprovals: number;
  headcountTrend: HeadcountPoint[];
  byDepartment: { department: Department; count: number }[];
  upcoming: UpcomingEvent[];
  recentHires: (EmployeeSummary & { startDate: string })[];
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager" | "employee";
  title: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}
