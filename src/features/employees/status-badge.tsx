import { Badge } from "@/components/ui/primitives";
import type { EmployeeStatus } from "@/lib/api/types";
import { STATUS_LABEL } from "@/lib/utils";

const TONE = { active: "success", onboarding: "primary", on_leave: "warning", offboarded: "neutral" } as const;

export function StatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Badge tone={TONE[status]} dot>
      {STATUS_LABEL[status]}
    </Badge>
  );
}
