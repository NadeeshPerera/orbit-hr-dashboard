import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Recruitment" };

export default function Page() {
  return <ComingSoon href="/recruitment" planned={["Job openings with a hiring pipeline board", "Candidate profiles, scorecards and interview scheduling", "Offer letters and a one-click hand-off to onboarding"]} />;
}
