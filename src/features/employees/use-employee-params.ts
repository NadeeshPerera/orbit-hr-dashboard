"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo } from "react";
import {
  DEPARTMENTS,
  EMPLOYEE_SORT_FIELDS,
  EMPLOYEE_STATUSES,
  type EmployeeQuery,
} from "@/lib/api/types";

export const PAGE_SIZE = 12;

const oneOf = <T extends string>(list: readonly T[], v: string | null) => (v && (list as readonly string[]).includes(v) ? (v as T) : undefined);

/**
 * The URL is the source of truth for the directory: filters, sort, page and the
 * open profile. Views are shareable and the back button works.
 */
export function useEmployeeParams() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query: Required<Pick<EmployeeQuery, "page" | "pageSize">> & EmployeeQuery = useMemo(
    () => ({
      q: params.get("q") ?? undefined,
      department: oneOf(DEPARTMENTS, params.get("department")),
      status: oneOf(EMPLOYEE_STATUSES, params.get("status")),
      location: params.get("location") ?? undefined,
      sort: oneOf(EMPLOYEE_SORT_FIELDS, params.get("sort")) ?? "name",
      dir: params.get("dir") === "desc" ? "desc" : "asc",
      page: Math.max(1, Number(params.get("page")) || 1),
      pageSize: PAGE_SIZE,
    }),
    [params],
  );

  const update = useCallback(
    (changes: Record<string, string | number | undefined | null>, { resetPage = true } = {}) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(changes)) {
        if (v === undefined || v === null || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      if (resetPage && !("page" in changes)) next.delete("page");
      const qs = next.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [params, router, pathname],
  );

  return { query, selectedId: params.get("employee"), update };
}
