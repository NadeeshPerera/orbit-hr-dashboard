import type { Employee } from "@/lib/api/types";
import { EMPLOYMENT_LABEL, STATUS_LABEL } from "@/lib/utils";

/** RFC 4180 field: quote if it contains a comma, quote or newline; double inner quotes. */
export function csvField(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

export function employeesToCsv(rows: Employee[]): string {
  const header = ["ID", "First name", "Last name", "Email", "Job title", "Department", "Location", "Employment", "Status", "Start date"];
  const lines = rows.map((e) =>
    [e.id, e.firstName, e.lastName, e.email, e.jobTitle, e.department, e.location, EMPLOYMENT_LABEL[e.employmentType], STATUS_LABEL[e.status], e.startDate]
      .map(csvField)
      .join(","),
  );
  return [header.join(","), ...lines].join("\r\n");
}

export function downloadCsv(filename: string, csv: string) {
  // BOM so Excel opens UTF-8 names (e.g. "García") correctly.
  const blob = new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
