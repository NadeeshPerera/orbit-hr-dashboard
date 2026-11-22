import { DashboardView } from "@/features/dashboard/dashboard-view";

export const metadata = { title: "Dashboard" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function DashboardPage() {
  return <DashboardView />;
}
