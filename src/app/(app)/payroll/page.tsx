import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Payroll" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ComingSoon href="/payroll" planned={["Pay runs with approval workflow", "Payslips employees can download", "Compensation bands and change history"]} />;
}
