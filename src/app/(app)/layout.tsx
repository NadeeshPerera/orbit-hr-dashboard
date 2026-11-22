import { AppShell } from "@/components/layout/app-shell";

/**
 * The signed-in area only renders once the client-side session (localStorage) is known,
 * so Next can't validate instant navigation for it at build time. Opt out explicitly.
 * Revisit when auth moves to an httpOnly cookie that the server can read (docs/PLAN.md).
 */
export const instant = false;

export default function SignedInLayout({ children }: LayoutProps<"/">) {
  return <AppShell>{children}</AppShell>;
}
