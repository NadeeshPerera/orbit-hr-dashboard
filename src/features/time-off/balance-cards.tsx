"use client";

import { motion } from "motion/react";
import { Card, Skeleton } from "@/components/ui/primitives";
import { useLeaveBalances } from "@/lib/api/queries";
import { LEAVE_TYPE_LABEL } from "@/lib/utils";

function Ring({ used, pending, entitled }: { used: number; pending: number; entitled: number }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const usedPct = Math.min(1, used / entitled);
  const pendingPct = Math.min(1 - usedPct, pending / entitled);
  return (
    <svg viewBox="0 0 64 64" className="size-16 -rotate-90" aria-hidden>
      <circle cx="32" cy="32" r={r} fill="none" stroke="var(--muted)" strokeWidth="7" />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" stroke="var(--warning)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - usedPct - pendingPct) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
      <motion.circle
        cx="32" cy="32" r={r} fill="none" stroke="var(--primary)" strokeWidth="7" strokeLinecap="round"
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - usedPct) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  );
}

export function BalanceCards() {
  const { data, isPending } = useLeaveBalances();
  if (isPending || !data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
      {data.map((b, i) => {
        const left = b.entitled === null ? null : b.entitled - b.used - b.pending;
        return (
          <motion.div key={b.type} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
            <Card className="flex h-full items-center gap-4 p-4">
              {b.entitled !== null ? (
                <Ring used={b.used} pending={b.pending} entitled={b.entitled} />
              ) : (
                <div className="grid size-16 shrink-0 place-items-center rounded-full bg-muted text-xs font-medium text-muted-foreground">∞</div>
              )}
              <div className="min-w-0">
                <p className="truncate text-xs text-muted-foreground sm:text-sm">{LEAVE_TYPE_LABEL[b.type]}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {left ?? b.used}
                  <span className="ml-1 text-xs font-normal text-muted-foreground">{left === null ? "taken" : "left"}</span>
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {b.used} used{b.pending ? ` · ${b.pending} pending` : ""}
                </p>
              </div>
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
