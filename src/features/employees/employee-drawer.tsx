"use client";

import { differenceInMonths } from "date-fns";
import { Building, CalendarDays, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Dialog, SheetContent } from "@/components/ui/overlays";
import { Avatar, Badge, Progress, Skeleton } from "@/components/ui/primitives";
import { Button } from "@/components/ui/button";
import { useEmployee } from "@/lib/api/queries";
import { fromISODate } from "@/lib/dates";
import { EMPLOYMENT_LABEL, formatDate, fullName, LEAVE_TYPE_LABEL } from "@/lib/utils";
import { StatusBadge } from "./status-badge";

function tenure(startDate: string) {
  const months = differenceInMonths(new Date(), fromISODate(startDate));
  if (months < 1) return "Just joined";
  const y = Math.floor(months / 12);
  const m = months % 12;
  return [y && `${y} yr${y > 1 ? "s" : ""}`, m && `${m} mo`].filter(Boolean).join(" ");
}

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-3 py-2.5">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-24 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 text-sm">{children}</dd>
    </div>
  );
}

/** Profile drawer driven by ?employee=<id> (shareable; back button closes it). */
export function EmployeeDrawer({ id, onClose, onOpen }: { id: string | null; onClose: () => void; onOpen: (id: string) => void }) {
  const { data: e, isPending, isError } = useEmployee(id);

  return (
    <Dialog open={Boolean(id)} onOpenChange={(open) => !open && onClose()}>
      <SheetContent title={e ? fullName(e) : "Employee profile"} hideTitle>
        <div className="flex-1 overflow-y-auto">
          {isError ? (
            <p className="p-8 text-sm text-danger">We couldn&apos;t find that person.</p>
          ) : isPending || !e ? (
            <div className="space-y-4 p-6">
              <Skeleton className="size-20 rounded-full" />
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-40" />
            </div>
          ) : (
            <>
              <div className="relative bg-gradient-to-br from-primary/15 via-accent/40 to-transparent px-6 pt-10 pb-6">
                <Avatar person={e} size="xl" className="ring-4 ring-popover" />
                <h2 className="mt-4 text-xl font-semibold tracking-tight">{fullName(e)}</h2>
                <p className="text-sm text-muted-foreground">
                  {e.jobTitle} · {e.department}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <StatusBadge status={e.status} />
                  <Badge>{EMPLOYMENT_LABEL[e.employmentType]}</Badge>
                  <Badge>{e.id}</Badge>
                </div>
                <div className="mt-5 flex gap-2">
                  <Button asChild size="sm">
                    <a href={`mailto:${e.email}`}>
                      <Mail /> Email
                    </a>
                  </Button>
                  <Button asChild size="sm" variant="outline">
                    <a href={`tel:${e.phone.replace(/\s/g, "")}`}>
                      <Phone /> Call
                    </a>
                  </Button>
                </div>
              </div>

              <div className="space-y-6 px-6 py-6">
                <section>
                  <h3 className="mb-1 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Details</h3>
                  <dl className="divide-y">
                    <Row icon={Mail} label="Email">{e.email}</Row>
                    <Row icon={Phone} label="Phone">{e.phone}</Row>
                    <Row icon={MapPin} label="Location">{e.location}</Row>
                    <Row icon={Building} label="Department">{e.department}</Row>
                    <Row icon={CalendarDays} label="Started">
                      {formatDate(e.startDate)} <span className="text-muted-foreground">· {tenure(e.startDate)}</span>
                    </Row>
                    <Row icon={UserRound} label="Manager">
                      {e.manager ? (
                        <button type="button" onClick={() => onOpen(e.manager!.id)} className="font-medium text-primary hover:underline">
                          {fullName(e.manager)}
                        </button>
                      ) : (
                        "—"
                      )}
                    </Row>
                  </dl>
                </section>

                <section>
                  <h3 className="mb-3 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Time off this year</h3>
                  <ul className="grid grid-cols-2 gap-3">
                    {e.leaveBalances.map((b) => (
                      <li key={b.type} className="rounded-xl border p-3">
                        <p className="text-xs text-muted-foreground">{LEAVE_TYPE_LABEL[b.type]}</p>
                        <p className="mt-1 text-lg font-semibold tabular-nums">
                          {b.entitled === null ? b.used : b.entitled - b.used}
                          <span className="ml-1 text-xs font-normal text-muted-foreground">{b.entitled === null ? "days taken" : `of ${b.entitled} left`}</span>
                        </p>
                        {b.entitled !== null && <Progress value={b.used} max={b.entitled} label={`${LEAVE_TYPE_LABEL[b.type]} used`} className="mt-2 h-1.5" />}
                      </li>
                    ))}
                  </ul>
                </section>

                {e.directReports.length > 0 && (
                  <section>
                    <h3 className="mb-2 text-xs font-semibold tracking-wider text-muted-foreground uppercase">Direct reports ({e.directReports.length})</h3>
                    <ul className="space-y-1">
                      {e.directReports.slice(0, 8).map((r) => (
                        <li key={r.id}>
                          <button type="button" onClick={() => onOpen(r.id)} className="flex w-full items-center gap-3 rounded-lg p-2 text-left hover:bg-muted">
                            <Avatar person={r} size="sm" />
                            <span className="min-w-0 flex-1">
                              <span className="block truncate text-sm font-medium">{fullName(r)}</span>
                              <span className="block truncate text-xs text-muted-foreground">{r.jobTitle}</span>
                            </span>
                          </button>
                        </li>
                      ))}
                    </ul>
                  </section>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Dialog>
  );
}
