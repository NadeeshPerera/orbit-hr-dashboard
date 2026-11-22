import { ComingSoon } from "@/components/layout/coming-soon";

export const metadata = { title: "Documents" };

export default function Page() {
  return <ComingSoon href="/documents" planned={["Company policies with read receipts", "Employee documents with expiry reminders", "E-signature requests"]} />;
}
