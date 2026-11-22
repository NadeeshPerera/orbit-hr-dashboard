import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { TimeOffView } from "@/features/time-off/time-off-view";

export const metadata = { title: "Time off" };

export default function TimeOffPage() {
  return (
    <Suspense fallback={<Skeleton className="h-[60vh]" />}>
      <TimeOffView />
    </Suspense>
  );
}
