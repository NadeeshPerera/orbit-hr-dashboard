"use client";

import { CalendarPlus, Inbox } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Avatar, Badge, Card, Skeleton } from "@/components/ui/primitives";
import { useLeaveRequests, useReviewLeave } from "@/lib/api/queries";
import type { LeaveRequest, LeaveStatus } from "@/lib/api/types";
import { cn, formatDateRange, fullName, LEAVE_STATUS_LABEL, LEAVE_TYPE_LABEL, plural } from "@/lib/utils";
import { ApprovalCard } from "./approval-card";
import { BalanceCards } from "./balance-cards";
import { RequestLeaveDialog } from "./request-dialog";

type Tab = "approvals" | "team" | "mine";

const STATUS_TONE: Record<LeaveStatus, "warning" | "success" | "danger" | "neutral"> = {
  pending: "warning",
  approved: "success",
  rejected: "danger",
  cancelled: "neutral",
};

function History({ items, showPerson }: { items: LeaveRequest[]; showPerson: boolean }) {
  if (items.length === 0) return <p className="py-12 text-center text-sm text-muted-foreground">No requests yet.</p>;
  return (
    <ul className="divide-y">
      {items.map((r) => (
        <li key={r.id} className="flex items-center gap-3 py-3">
          {showPerson && <Avatar person={r.employee} />}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium">{showPerson ? fullName(r.employee) : LEAVE_TYPE_LABEL[r.type]}</p>
            <p className="truncate text-xs text-muted-foreground">
              {showPerson && `${LEAVE_TYPE_LABEL[r.type]} · `}
              {formatDateRange(r.startDate, r.endDate)} · {plural(r.days, "day")}
            </p>
          </div>
          <Badge tone={STATUS_TONE[r.status]} dot>
            {LEAVE_STATUS_LABEL[r.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}

export function TimeOffView() {
  const params = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [tab, setTab] = useState<Tab>("approvals");

  // ?request=1 opens the form (used by "Request time off" links and the command palette).
  const requestOpen = params.get("request") === "1";
  const setRequestOpen = (open: boolean) => router.replace(open ? `${pathname}?request=1` : pathname, { scroll: false });

  const pending = useLeaveRequests("pending");
  const team = useLeaveRequests("all", "team");
  const mine = useLeaveRequests("all", "mine");
  const review = useReviewLeave();

  const decide = (r: LeaveRequest, status: "approved" | "rejected") =>
    review.mutate(
      { id: r.id, status },
      {
        onSuccess: () => toast.success(`${status === "approved" ? "Approved" : "Declined"} ${r.employee.firstName}'s ${LEAVE_TYPE_LABEL[r.type].toLowerCase()}`),
        onError: (e) => toast.error("Couldn't update the request", { description: e.message }),
      },
    );

  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "approvals", label: "Approvals", count: pending.data?.length },
    { id: "team", label: "Team history" },
    { id: "mine", label: "My requests" },
  ];

  return (
    <>
      <PageHeader
        title="Time off"
        description="Your balances, your team's requests and everything waiting on you."
        actions={
          <Button onClick={() => setRequestOpen(true)}>
            <CalendarPlus /> Request time off
          </Button>
        }
      />

      <BalanceCards />

      <Card className="mt-4 overflow-hidden">
        <div role="tablist" aria-label="Time off views" className="flex gap-1 overflow-x-auto border-b px-2 [scrollbar-width:none] sm:px-4">
          {tabs.map((t) => (
            <button
              key={t.id}
              role="tab"
              id={`tab-${t.id}`}
              aria-selected={tab === t.id}
              aria-controls={`panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className={cn("relative flex shrink-0 items-center gap-2 px-3 py-3.5 text-sm font-medium transition-colors", tab === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
            >
              {t.label}
              {t.count !== undefined && t.count > 0 && <span className="rounded-full bg-primary px-1.5 text-[10px] leading-4 font-bold text-primary-foreground">{t.count}</span>}
              {tab === t.id && <motion.span layoutId="timeoff-tab" className="absolute inset-x-2 -bottom-px h-0.5 rounded-full bg-primary" />}
            </button>
          ))}
        </div>

        <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="p-3 sm:p-5">
          {tab === "approvals" &&
            (pending.isPending ? (
              <div className="space-y-3">{Array.from({ length: 3 }, (_, i) => <Skeleton key={i} className="h-24" />)}</div>
            ) : (
              <>
                {(pending.data?.length ?? 0) > 0 && <p className="mb-3 text-xs text-muted-foreground sm:hidden">Tip: swipe a card right to approve or left to decline.</p>}
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {pending.data?.map((r) => <ApprovalCard key={r.id} request={r} onDecide={(s) => decide(r, s)} />)}
                  </AnimatePresence>
                </ul>
                {pending.data?.length === 0 && (
                  <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="py-14 text-center">
                    <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-success/12 text-success">
                      <Inbox className="size-6" />
                    </span>
                    <p className="mt-4 font-medium">You&apos;re all caught up</p>
                    <p className="mt-1 text-sm text-muted-foreground">New requests from your team will show up here.</p>
                  </motion.div>
                )}
              </>
            ))}
          {tab === "team" && (team.isPending ? <Skeleton className="h-64" /> : <History items={team.data ?? []} showPerson />)}
          {tab === "mine" && (mine.isPending ? <Skeleton className="h-40" /> : <History items={mine.data ?? []} showPerson={false} />)}
        </div>
      </Card>

      <RequestLeaveDialog open={requestOpen} onOpenChange={setRequestOpen} />
    </>
  );
}
