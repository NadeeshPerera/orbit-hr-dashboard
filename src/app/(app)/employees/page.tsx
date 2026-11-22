import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { EmployeesView } from "@/features/employees/employees-view";

export const metadata = { title: "Employees" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function EmployeesPage() {
  // useSearchParams() inside the view needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-[60vh]" />}>
      <EmployeesView />
    </Suspense>
  );
}
