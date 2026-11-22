import { describe, expect, it } from "vitest";
import type { Employee } from "@/lib/api/types";
import { csvField, employeesToCsv } from "./csv";

describe("csvField", () => {
  it.each([
    ["plain", "plain"],
    ["Smith, Jr.", '"Smith, Jr."'],
    ['The "Boss"', '"The ""Boss"""'],
    ["two\nlines", '"two\nlines"'],
  ])("%j → %j", (input, expected) => expect(csvField(input)).toBe(expected));
});

describe("employeesToCsv", () => {
  it("writes a header plus one CRLF-separated row per employee with readable labels", () => {
    const e: Employee = {
      id: "EMP-1",
      firstName: "Ana",
      lastName: "García, PhD",
      email: "ana@orbit-demo.com",
      phone: "+1 555 0100 1234",
      jobTitle: "Staff Engineer",
      department: "Engineering",
      location: "Lisbon",
      employmentType: "full_time",
      status: "on_leave",
      startDate: "2022-03-01",
      endDate: null,
      birthDate: "1990-01-01",
      managerId: null,
    };
    const [header, row] = employeesToCsv([e]).split("\r\n");
    expect(header).toBe("ID,First name,Last name,Email,Job title,Department,Location,Employment,Status,Start date");
    expect(row).toBe('EMP-1,Ana,"García, PhD",ana@orbit-demo.com,Staff Engineer,Engineering,Lisbon,Full-time,On leave,2022-03-01');
  });
});
