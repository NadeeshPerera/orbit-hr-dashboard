import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Settings" };

export default function Page() {
  return <ComingSoon href="/settings" planned={["Company profile, departments and locations", "Leave policies and public holiday calendars", "Roles and permissions"]} />;
}
