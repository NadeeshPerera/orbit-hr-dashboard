import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Documents" };
// Signed-in pages depend on the client-side session; see (app)/layout.tsx.
export const instant = false;

export default function Page() {
  return <ComingSoon href="/documents" planned={["Company policies with read receipts", "Employee documents with expiry reminders", "E-signature requests"]} />;
}
