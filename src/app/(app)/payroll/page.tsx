import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Payroll" };

export default function Page() {
  return <ComingSoon href="/payroll" planned={["Pay runs with approval workflow", "Payslips employees can download", "Compensation bands and change history"]} />;
}
