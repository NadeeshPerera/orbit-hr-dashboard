"use client";

import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "./client";
import type {
  CreateLeaveRequest,
  DashboardData,
  Employee,
  EmployeeDetail,
  EmployeeFacets,
  EmployeeQuery,
  LeaveBalance,
  LeaveRequest,
  LeaveStatus,
  LoginResponse,
  Page,
} from "./types";

/** Every server-state key in one place, so invalidation stays consistent. */
export const keys = {
  dashboard: ["dashboard"] as const,
  employees: (q: EmployeeQuery) => ["employees", "list", q] as const,
  facets: ["employees", "facets"] as const,
  employee: (id: string) => ["employees", "detail", id] as const,
  leave: (status: LeaveStatus | "all", scope: "team" | "mine") => ["time-off", "requests", scope, status] as const,
  allLeave: ["time-off", "requests"] as const,
  balances: ["time-off", "balances"] as const,
};

export const login = (email: string, password: string) =>
  api<LoginResponse>("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });

export function useDashboard() {
  return useQuery({ queryKey: keys.dashboard, queryFn: () => api<DashboardData>("/api/dashboard") });
}

export function useEmployees(query: EmployeeQuery) {
  return useQuery({
    queryKey: keys.employees(query),
    queryFn: () => api<Page<Employee>>("/api/employees", { params: { ...query } }),
    // Keep the current page visible while the next loads: no table flicker.
    placeholderData: keepPreviousData,
  });
}

export function useEmployeeFacets() {
  return useQuery({ queryKey: keys.facets, queryFn: () => api<EmployeeFacets>("/api/employees/facets"), staleTime: 5 * 60_000 });
}

export function useEmployee(id: string | null) {
  return useQuery({
    queryKey: keys.employee(id ?? ""),
    queryFn: () => api<EmployeeDetail>(`/api/employees/${id}`),
    enabled: Boolean(id),
  });
}

export function useLeaveRequests(status: LeaveStatus | "all", scope: "team" | "mine" = "team") {
  return useQuery({
    queryKey: keys.leave(status, scope),
    queryFn: () => api<LeaveRequest[]>("/api/time-off/requests", { params: { status: status === "all" ? undefined : status, scope } }),
  });
}

export function useLeaveBalances() {
  return useQuery({ queryKey: keys.balances, queryFn: () => api<LeaveBalance[]>("/api/time-off/balances") });
}

/**
 * Approve/reject with an optimistic update: the request leaves the pending list
 * immediately, and is restored if the server says no.
 */
export function useReviewLeave() {
  const qc = useQueryClient();
  const pendingKey = keys.leave("pending", "team");
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: "approved" | "rejected" }) =>
      api<LeaveRequest>(`/api/time-off/requests/${id}`, { method: "PATCH", body: JSON.stringify({ status }) }),
    onMutate: async ({ id }) => {
      await qc.cancelQueries({ queryKey: pendingKey });
      const previous = qc.getQueryData<LeaveRequest[]>(pendingKey);
      qc.setQueryData<LeaveRequest[]>(pendingKey, (old) => old?.filter((r) => r.id !== id));
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) qc.setQueryData(pendingKey, context.previous);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: keys.allLeave });
      qc.invalidateQueries({ queryKey: keys.dashboard });
    },
  });
}

export function useCreateLeave() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: CreateLeaveRequest) =>
      api<LeaveRequest>("/api/time-off/requests", { method: "POST", body: JSON.stringify(input) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: keys.allLeave });
      qc.invalidateQueries({ queryKey: keys.balances });
    },
  });
}
