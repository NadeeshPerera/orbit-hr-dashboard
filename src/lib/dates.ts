import { addDays, differenceInCalendarDays, format, isWeekend, parseISO } from "date-fns";

/** yyyy-mm-dd for a Date, in local time. */
export const toISODate = (d: Date) => format(d, "yyyy-MM-dd");

/** Parse a yyyy-mm-dd string as a local calendar date (no timezone shift). */
export const fromISODate = (s: string) => parseISO(s);

/** Working days (Mon–Fri) between two calendar dates, inclusive. Returns 0 if end < start. */
export function countWorkingDays(start: string, end: string): number {
  const from = fromISODate(start);
  const span = differenceInCalendarDays(fromISODate(end), from);
  let days = 0;
  for (let i = 0; i <= span; i++) {
    if (!isWeekend(addDays(from, i))) days++;
  }
  return days;
}

/** Do two inclusive date ranges overlap? */
export const rangesOverlap = (aStart: string, aEnd: string, bStart: string, bEnd: string) =>
  aStart <= bEnd && bStart <= aEnd;

/**
 * Next occurrence (today or later) of a recurring month/day, e.g. a birthday.
 * 29 Feb falls back to 28 Feb in non-leap years.
 */
export function nextOccurrence(isoDate: string, today: Date): Date {
  const source = fromISODate(isoDate);
  const make = (year: number) => {
    const d = new Date(year, source.getMonth(), source.getDate());
    // Date rolls 29 Feb → 1 Mar in non-leap years; pin it to 28 Feb instead.
    return d.getMonth() === source.getMonth() ? d : new Date(year, source.getMonth() + 1, 0);
  };
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const thisYear = make(start.getFullYear());
  return thisYear >= start ? thisYear : make(start.getFullYear() + 1);
}
