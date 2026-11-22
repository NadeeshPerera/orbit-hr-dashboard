"use client";

import { Check, X } from "lucide-react";
import { motion, useMotionValue, useTransform, type PanInfo } from "motion/react";
import { Button } from "@/components/ui/button";
import { Avatar, Badge } from "@/components/ui/primitives";
import type { LeaveRequest } from "@/lib/api/types";
import { formatDateRange, fullName, LEAVE_TYPE_LABEL, plural } from "@/lib/utils";

const SWIPE_THRESHOLD = 110;

/**
 * Pending request. On touch screens, swipe right to approve or left to decline;
 * the buttons do the same for mouse, keyboard and screen-reader users.
 */
export function ApprovalCard({ request: r, onDecide }: { request: LeaveRequest; onDecide: (status: "approved" | "rejected") => void }) {
  const x = useMotionValue(0);
  const approveOpacity = useTransform(x, [20, SWIPE_THRESHOLD], [0, 1]);
  const declineOpacity = useTransform(x, [-SWIPE_THRESHOLD, -20], [1, 0]);

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x > SWIPE_THRESHOLD) onDecide("approved");
    else if (info.offset.x < -SWIPE_THRESHOLD) onDecide("rejected");
  };

  return (
    <motion.li
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0, transition: { duration: 0.25 } }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Swipe hints revealed behind the card */}
      <motion.div style={{ opacity: approveOpacity }} className="absolute inset-0 flex items-center rounded-xl bg-success pl-6 text-white" aria-hidden>
        <Check className="size-6" />
      </motion.div>
      <motion.div style={{ opacity: declineOpacity }} className="absolute inset-0 flex items-center justify-end rounded-xl bg-danger pr-6 text-white" aria-hidden>
        <X className="size-6" />
      </motion.div>

      <motion.div
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.6}
        dragSnapToOrigin
        onDragEnd={onDragEnd}
        style={{ x }}
        className="relative flex touch-pan-y flex-col gap-3 rounded-xl border bg-card p-4 sm:flex-row sm:items-center"
      >
        <div className="flex min-w-0 flex-1 items-center gap-3">
          <Avatar person={r.employee} size="lg" />
          <div className="min-w-0">
            <p className="truncate font-medium">{fullName(r.employee)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {r.employee.jobTitle} · {r.employee.department}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
              <Badge tone="primary">{LEAVE_TYPE_LABEL[r.type]}</Badge>
              <span className="text-xs text-muted-foreground">
                {formatDateRange(r.startDate, r.endDate)} · {plural(r.days, "working day")}
              </span>
            </div>
            {r.reason && <p className="mt-1.5 line-clamp-2 text-sm text-muted-foreground">“{r.reason}”</p>}
          </div>
        </div>
        <div className="flex gap-2 sm:shrink-0">
          <Button variant="outline" className="flex-1 sm:flex-none" onClick={() => onDecide("rejected")} aria-label={`Decline ${fullName(r.employee)}'s request`}>
            <X /> Decline
          </Button>
          <Button variant="success" className="flex-1 sm:flex-none" onClick={() => onDecide("approved")} aria-label={`Approve ${fullName(r.employee)}'s request`}>
            <Check /> Approve
          </Button>
        </div>
      </motion.div>
    </motion.li>
  );
}
