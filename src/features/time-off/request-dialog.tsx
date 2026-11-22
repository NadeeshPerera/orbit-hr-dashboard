"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { LoaderCircle } from "lucide-react";
import { useEffect } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/overlays";
import { FieldError, Label, NativeSelect, Textarea, Input } from "@/components/ui/primitives";
import { isApiError } from "@/lib/api/client";
import { useCreateLeave, useLeaveBalances } from "@/lib/api/queries";
import { LEAVE_TYPES } from "@/lib/api/types";
import { countWorkingDays, toISODate } from "@/lib/dates";
import { LEAVE_TYPE_LABEL, plural } from "@/lib/utils";

const schema = z
  .object({
    type: z.enum(LEAVE_TYPES),
    startDate: z.string().min(1, "Choose a start date"),
    endDate: z.string().min(1, "Choose an end date"),
    reason: z.string().trim().max(200, "Keep the note under 200 characters"),
  })
  .refine((v) => !v.startDate || v.startDate >= toISODate(new Date()), { path: ["startDate"], message: "Start date can't be in the past" })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, { path: ["endDate"], message: "End date must be on or after the start date" })
  .refine((v) => !v.startDate || !v.endDate || v.endDate < v.startDate || countWorkingDays(v.startDate, v.endDate) > 0, {
    path: ["endDate"],
    message: "Those dates are all on a weekend",
  });
export type RequestValues = z.infer<typeof schema>;

const empty: RequestValues = { type: "annual", startDate: "", endDate: "", reason: "" };

export function RequestLeaveDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const create = useCreateLeave();
  const balances = useLeaveBalances();
  const form = useForm<RequestValues>({ resolver: zodResolver(schema), defaultValues: empty });
  const { register, handleSubmit, control, reset, setError, formState: { errors } } = form;

  // Next 16 keeps routes alive between navigations, so reset explicitly whenever the dialog opens.
  useEffect(() => {
    if (open) {
      reset(empty);
      create.reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const [type, start, end] = useWatch({ control, name: ["type", "startDate", "endDate"] });
  const days = start && end && end >= start ? countWorkingDays(start, end) : 0;
  const balance = balances.data?.find((b) => b.type === type);
  const left = balance && balance.entitled !== null ? balance.entitled - balance.used - balance.pending : null;

  const onSubmit = (values: RequestValues) =>
    create.mutate(values, {
      onSuccess: (r) => {
        toast.success("Request sent", { description: `${plural(r.days, "working day")} of ${LEAVE_TYPE_LABEL[r.type].toLowerCase()} is awaiting approval.` });
        onOpenChange(false);
      },
      onError: (e) => {
        if (isApiError(e) && e.errors) {
          for (const [field, messages] of Object.entries(e.errors)) setError(field as keyof RequestValues, { message: messages[0] });
        }
      },
    });

  const today = toISODate(new Date());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent title="Request time off" description="Your manager gets notified as soon as you submit.">
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <NativeSelect id="type" {...register("type")}>
              {LEAVE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {LEAVE_TYPE_LABEL[t]}
                </option>
              ))}
            </NativeSelect>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="startDate">From</Label>
              <Input id="startDate" type="date" min={today} aria-invalid={!!errors.startDate} aria-describedby="start-error" {...register("startDate")} />
              <FieldError id="start-error">{errors.startDate?.message}</FieldError>
            </div>
            <div className="space-y-2">
              <Label htmlFor="endDate">To</Label>
              <Input id="endDate" type="date" min={start || today} aria-invalid={!!errors.endDate} aria-describedby="end-error" {...register("endDate")} />
              <FieldError id="end-error">{errors.endDate?.message}</FieldError>
            </div>
          </div>

          <div className="rounded-xl bg-muted/70 px-4 py-3 text-sm" aria-live="polite">
            {days > 0 ? (
              <>
                <span className="font-semibold">{plural(days, "working day")}</span>
                {left !== null && (
                  <span className={left - days < 0 ? "text-danger" : "text-muted-foreground"}>
                    {" "}· {left - days < 0 ? `${days - left} more than you have left` : `${left - days} left after this`}
                  </span>
                )}
              </>
            ) : (
              <span className="text-muted-foreground">
                Pick your dates to see how many working days you&apos;ll use{left !== null ? ` (${left} left)` : ""}.
              </span>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="reason">
              Note <span className="font-normal text-muted-foreground">(optional)</span>
            </Label>
            <Textarea id="reason" rows={3} placeholder="Anything your manager should know?" aria-invalid={!!errors.reason} aria-describedby="reason-error" {...register("reason")} />
            <FieldError id="reason-error">{errors.reason?.message}</FieldError>
          </div>

          {create.error && !(isApiError(create.error) && create.error.errors) && (
            <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2.5 text-sm text-danger">
              <strong>{isApiError(create.error) ? create.error.title : "Something went wrong"}.</strong> {create.error.message !== (isApiError(create.error) ? create.error.title : "") && create.error.message}
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={create.isPending}>
              {create.isPending && <LoaderCircle className="animate-spin" />}
              Submit request
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
