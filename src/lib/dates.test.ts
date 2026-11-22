import { describe, expect, it } from "vitest";
import { countWorkingDays, nextOccurrence, rangesOverlap, toISODate } from "./dates";

describe("countWorkingDays", () => {
  it.each([
    ["2026-11-16", "2026-11-20", 5], // Mon–Fri
    ["2026-11-16", "2026-11-23", 6], // spans a weekend
    ["2026-11-21", "2026-11-22", 0], // Sat–Sun
    ["2026-11-18", "2026-11-18", 1], // single day
    ["2026-11-20", "2026-11-16", 0], // reversed
    ["2026-12-28", "2027-01-08", 10], // across New Year
  ])("%s → %s = %i", (start, end, expected) => {
    expect(countWorkingDays(start, end)).toBe(expected);
  });
});

describe("rangesOverlap", () => {
  it("treats ranges as inclusive", () => {
    expect(rangesOverlap("2026-11-01", "2026-11-05", "2026-11-05", "2026-11-09")).toBe(true);
    expect(rangesOverlap("2026-11-01", "2026-11-04", "2026-11-05", "2026-11-09")).toBe(false);
    expect(rangesOverlap("2026-11-01", "2026-11-30", "2026-11-10", "2026-11-12")).toBe(true);
  });
});

describe("nextOccurrence", () => {
  const today = new Date(2026, 10, 18);
  it("returns this year's date when it is still ahead, otherwise next year's", () => {
    expect(toISODate(nextOccurrence("1990-12-02", today))).toBe("2026-12-02");
    expect(toISODate(nextOccurrence("1990-03-10", today))).toBe("2027-03-10");
  });
  it("counts today as upcoming", () => {
    expect(toISODate(nextOccurrence("1985-11-18", today))).toBe("2026-11-18");
  });
  it("maps 29 February to 28 February in non-leap years", () => {
    expect(toISODate(nextOccurrence("1996-02-29", today))).toBe("2027-02-28");
    expect(toISODate(nextOccurrence("1996-02-29", new Date(2027, 11, 1)))).toBe("2028-02-29");
  });
});
