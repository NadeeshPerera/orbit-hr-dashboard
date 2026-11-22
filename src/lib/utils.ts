import { clsx, type ClassValue } from "clsx";
import { format } from "date-fns";
import { twMerge } from "tailwind-merge";
import type { EmployeeStatus, EmploymentType, LeaveStatus, LeaveType } from "./api/types";
import { fromISODate } from "./dates";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const fullName = (p: { firstName: string; lastName: string }) => `${p.firstName} ${p.lastName}`;

export const initials = (p: { firstName: string; lastName: string }) =>
  `${p.firstName[0] ?? ""}${p.lastName[0] ?? ""}`.toUpperCase();

/** Stable pastel colour per person, so avatars are recognisable without photos. */
export function avatarHue(id: string): number {
  let h = 0;
  for (const ch of id) h = (h * 31 + ch.charCodeAt(0)) % 360;
  return h;
}

export const formatDate = (iso: string, pattern = "d MMM yyyy") => format(fromISODate(iso), pattern);

export function formatDateRange(start: string, end: string): string {
  if (start === end) return formatDate(start, "d MMM yyyy");
  const s = fromISODate(start);
  const e = fromISODate(end);
  if (s.getFullYear() === e.getFullYear()) {
    return s.getMonth() === e.getMonth()
      ? `${format(s, "d")}–${format(e, "d MMM yyyy")}`
      : `${format(s, "d MMM")} – ${format(e, "d MMM yyyy")}`;
  }
  return `${format(s, "d MMM yyyy")} – ${format(e, "d MMM yyyy")}`;
}

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  active: "Active",
  onboarding: "Onboarding",
  on_leave: "On leave",
  offboarded: "Offboarded",
};

export const EMPLOYMENT_LABEL: Record<EmploymentType, string> = {
  full_time: "Full-time",
  part_time: "Part-time",
  contractor: "Contractor",
  intern: "Intern",
};

export const LEAVE_TYPE_LABEL: Record<LeaveType, string> = {
  annual: "Annual leave",
  sick: "Sick leave",
  parental: "Parental leave",
  unpaid: "Unpaid leave",
};

export const LEAVE_STATUS_LABEL: Record<LeaveStatus, string> = {
  pending: "Pending",
  approved: "Approved",
  rejected: "Declined",
  cancelled: "Cancelled",
};

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;
