import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Recruitment" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ComingSoon href="/recruitment" planned={["Job openings with a hiring pipeline board", "Candidate profiles, scorecards and interview scheduling", "Offer letters and a one-click hand-off to onboarding"]} />;
}
