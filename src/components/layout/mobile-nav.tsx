"use client";

import { Ellipsis } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Dialog as D } from "radix-ui";
import { Dialog, SheetContent } from "@/components/ui/overlays";
import { useUiStore } from "@/features/ui-store";
import { ALL_NAV_ITEMS, isActive } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";
import { NavList } from "./sidebar";

const TABS = ALL_NAV_ITEMS.filter((i) => i.mobileTab);

/** Thumb-friendly bottom tab bar for phones and small tablets. */
export function MobileTabBar() {
  const pathname = usePathname();
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  const moreActive = !TABS.some((t) => isActive(pathname, t.href));

  const tab = (active: boolean) =>
    cn("relative flex flex-1 flex-col items-center justify-center gap-1 py-2 text-[11px] font-medium transition-colors", active ? "text-primary" : "text-muted-foreground");

  return (
    <nav aria-label="Primary" className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/85 pb-safe backdrop-blur-xl lg:hidden">
      <ul className="mx-auto flex max-w-md">
        {TABS.map(({ href, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="flex flex-1">
              <Link href={href} aria-current={active ? "page" : undefined} className={tab(active)}>
                {active && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-accent" />}
                <Icon className="relative size-5" />
                <span className="relative">{label}</span>
              </Link>
            </li>
          );
        })}
        <li className="flex flex-1">
          <button type="button" onClick={() => setOpen(true)} className={tab(moreActive)} aria-haspopup="dialog">
            {moreActive && <motion.span layoutId="tab-pill" className="absolute top-1.5 h-8 w-14 rounded-full bg-accent" />}
            <Ellipsis className="relative size-5" />
            <span className="relative">More</span>
          </button>
        </li>
      </ul>
    </nav>
  );
}

/** Full navigation drawer for small screens. */
export function MobileDrawer() {
  const open = useUiStore((s) => s.mobileNavOpen);
  const setOpen = useUiStore((s) => s.setMobileNavOpen);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <SheetContent side="left" title="Navigation" hideTitle>
        <div className="px-5 pt-5">
          <D.Close asChild>
            <Link href="/dashboard" aria-label="Orbit HR home">
              <Brand />
            </Link>
          </D.Close>
        </div>
        <div className="flex-1 overflow-y-auto px-3 py-6">
          {/* Close explicitly on navigation: Next 16 keeps routes alive (Activity), so state would otherwise persist. */}
          <NavList layoutGroup="drawer" onNavigate={() => setOpen(false)} />
        </div>
      </SheetContent>
    </Dialog>
  );
}
