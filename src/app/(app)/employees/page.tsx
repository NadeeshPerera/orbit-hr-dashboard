import { Suspense } from "react";
import { Skeleton } from "@/components/ui/primitives";
import { EmployeesView } from "@/features/employees/employees-view";

export const metadata = { title: "Employees" };

export default function EmployeesPage() {
  // useSearchParams() inside the view needs a Suspense boundary.
  return (
    <Suspense fallback={<Skeleton className="h-[60vh]" />}>
      <EmployeesView />
    </Suspense>
  );
}
