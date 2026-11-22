import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Performance" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ComingSoon href="/performance" planned={["Goals and OKRs with progress check-ins", "Review cycles with self, peer and manager feedback", "Calibration view and one-on-one notes"]} />;
}
