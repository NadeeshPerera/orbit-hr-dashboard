"use client";

import { CalendarPlus } from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/primitives";
import { useAuthStore } from "@/features/auth/auth-store";
import { HeadcountChart } from "@/features/dashboard/headcount-chart";
import { KpiCards } from "@/features/dashboard/kpi-cards";
import { Celebrations, DepartmentBreakdown, PendingApprovals, RecentHires } from "@/features/dashboard/widgets";
import { useDashboard } from "@/lib/api/queries";

function greeting(now = new Date()) {
  const h = now.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}

export function DashboardView() {
  const firstName = useAuthStore((s) => s.user?.name.split(" ")[0]);
  const { data, isPending, isError, refetch } = useDashboard();

  return (
    <>
      <PageHeader
        title={`${greeting()}, ${firstName ?? "there"}`}
        description={`${format(new Date(), "EEEE, d MMMM")} · here's what's happening with your people.`}
        actions={
          <Button asChild>
            <Link href="/time-off?request=1">
              <CalendarPlus /> Request time off
            </Link>
          </Button>
        }
      />

      {isError ? (
        <div role="alert" className="rounded-xl border border-danger/30 bg-danger/5 p-6 text-sm">
          We couldn&apos;t load the dashboard.{" "}
          <button className="font-semibold text-danger underline" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : isPending ? (
        <div className="space-y-4" aria-busy="true" aria-label="Loading dashboard">
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-32" />)}
          </div>
          <div className="grid gap-4 lg:grid-cols-3">
            <Skeleton className="h-80 lg:col-span-2" />
            <Skeleton className="h-80" />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <KpiCards data={data} />
          <div className="grid gap-4 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <HeadcountChart data={data.headcountTrend} />
            </div>
            <DepartmentBreakdown data={data.byDepartment} />
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <PendingApprovals />
            <Celebrations data={data.upcoming} />
          </div>
          <RecentHires data={data.recentHires} />
        </div>
      )}
    </>
  );
}
