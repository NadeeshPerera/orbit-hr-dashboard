"use client";

import { ArrowRight, Cake, Check, PartyPopper, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/primitives";
import { useLeaveRequests, useReviewLeave } from "@/lib/api/queries";
import type { DashboardData } from "@/lib/api/types";
import { formatDate, formatDateRange, fullName, LEAVE_TYPE_LABEL, plural } from "@/lib/utils";

export function DepartmentBreakdown({ data }: { data: DashboardData["byDepartment"] }) {
  const max = Math.max(...data.map((d) => d.count));
  const total = data.reduce((s, d) => s + d.count, 0);
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>By department</CardTitle>
          <CardDescription>{total} people across {data.length} teams</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="space-y-3">
          {data.map((d, i) => (
            <li key={d.department}>
              <Link href={`/employees?department=${encodeURIComponent(d.department)}`} className="group block rounded-md focus-visible:outline-offset-4">
                <div className="mb-1.5 flex justify-between text-sm">
                  <span className="group-hover:text-primary">{d.department}</span>
                  <span className="tabular-nums text-muted-foreground">{d.count}</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <motion.div
                    className="h-full rounded-full bg-gradient-to-r from-primary to-chart-2"
                    initial={{ width: 0 }}
                    animate={{ width: `${(d.count / max) * 100}%` }}
                    transition={{ delay: 0.1 + i * 0.05, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                  />
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

export function PendingApprovals() {
  const { data, isPending } = useLeaveRequests("pending");
  const review = useReviewLeave();
  const items = data?.slice(0, 4) ?? [];

  const decide = (id: string, name: string, status: "approved" | "rejected") =>
    review.mutate(
      { id, status },
      {
        onSuccess: () => toast.success(`${status === "approved" ? "Approved" : "Declined"} ${name}'s time off`),
        onError: (e) => toast.error(e.message),
      },
    );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Pending approvals</CardTitle>
          <CardDescription>{data ? plural(data.length, "request") : "Loading…"} waiting on you</CardDescription>
        </div>
        <Button asChild variant="ghost" size="sm">
          <Link href="/time-off">
            View all <ArrowRight />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-1">
        {isPending && <div className="h-40 animate-pulse rounded-lg bg-muted" />}
        <AnimatePresence initial={false} mode="popLayout">
          {items.map((r) => (
            <motion.div
              key={r.id}
              layout
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, x: 40, transition: { duration: 0.2 } }}
              className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60"
            >
              <Avatar person={r.employee} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{fullName(r.employee)}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {LEAVE_TYPE_LABEL[r.type]} · {formatDateRange(r.startDate, r.endDate)} · {plural(r.days, "day")}
                </p>
              </div>
              <Button size="icon-sm" variant="outline" aria-label={`Decline ${fullName(r.employee)}`} onClick={() => decide(r.id, r.employee.firstName, "rejected")}>
                <X />
              </Button>
              <Button size="icon-sm" variant="success" aria-label={`Approve ${fullName(r.employee)}`} onClick={() => decide(r.id, r.employee.firstName, "approved")}>
                <Check />
              </Button>
            </motion.div>
          ))}
        </AnimatePresence>
        {data && data.length === 0 && (
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="py-8 text-center text-sm text-muted-foreground">
            All caught up. Nothing to approve 🎉
          </motion.p>
        )}
      </CardContent>
    </Card>
  );
}

export function Celebrations({ data }: { data: DashboardData["upcoming"] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Celebrations</CardTitle>
          <CardDescription>Birthdays and work anniversaries in the next 30 days</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">Nothing coming up.</p>
        ) : (
          <ul className="space-y-1">
            {data.map((e) => (
              <li key={`${e.kind}-${e.employee.id}`} className="flex items-center gap-3 rounded-lg p-2 hover:bg-muted/60">
                <Avatar person={e.employee} />
                <div className="min-w-0 flex-1">
                  <Link href={`/employees?employee=${e.employee.id}`} className="block truncate text-sm font-medium hover:text-primary">
                    {fullName(e.employee)}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">{e.employee.jobTitle}</p>
                </div>
                <Badge tone={e.kind === "birthday" ? "warning" : "primary"}>
                  {e.kind === "birthday" ? <Cake className="size-3" /> : <PartyPopper className="size-3" />}
                  {e.kind === "birthday" ? "Birthday" : `${e.years} yr${e.years === 1 ? "" : "s"}`} · {formatDate(e.date, "d MMM")}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

export function RecentHires({ data }: { data: DashboardData["recentHires"] }) {
  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Recent hires</CardTitle>
          <CardDescription>Say hello to the newest people</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <ul className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none] sm:grid sm:grid-cols-5 sm:overflow-visible">
          {data.map((e, i) => (
            <motion.li key={e.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }} className="w-36 shrink-0 sm:w-auto">
              <Link
                href={`/employees?employee=${e.id}`}
                className="flex h-full flex-col items-center rounded-xl border p-4 text-center transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
              >
                <Avatar person={e} size="lg" />
                <p className="mt-3 w-full truncate text-sm font-medium">{fullName(e)}</p>
                <p className="w-full truncate text-xs text-muted-foreground">{e.jobTitle}</p>
                <p className="mt-2 text-[11px] text-muted-foreground">Joined {formatDate(e.startDate, "d MMM")}</p>
              </Link>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
