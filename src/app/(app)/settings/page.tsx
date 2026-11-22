import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Settings" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ComingSoon href="/settings" planned={["Company profile, departments and locations", "Leave policies and public holiday calendars", "Roles and permissions"]} />;
}
