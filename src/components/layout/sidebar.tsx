"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import { motion } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Tooltip } from "@/components/ui/overlays";
import { useUiStore } from "@/features/ui-store";
import { NAV, isActive, type NavItem } from "@/lib/nav";
import { cn } from "@/lib/utils";
import { Brand } from "./brand";

function NavLink({ item, collapsed, layoutGroup, onNavigate }: { item: NavItem; collapsed: boolean; layoutGroup: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const active = isActive(pathname, item.href);
  const Icon = item.icon;

  const link = (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        active ? "text-foreground" : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      {active && (
        // Shared layoutId: the highlight slides between items instead of jumping.
        <motion.span layoutId={`${layoutGroup}-active`} className="absolute inset-0 rounded-lg bg-accent ring-1 ring-primary/10" />
      )}
      <Icon className={cn("relative size-[18px] shrink-0 transition-colors", active && "text-primary")} />
      {!collapsed && <span className="relative flex-1 truncate">{item.label}</span>}
      {!collapsed && item.soon && (
        <span className="relative rounded-md bg-muted px-1.5 py-0.5 text-[10px] font-semibold tracking-wide text-muted-foreground uppercase">Soon</span>
      )}
    </Link>
  );

  return collapsed ? <Tooltip content={item.soon ? `${item.label} · coming soon` : item.label}>{link}</Tooltip> : link;
}

/** Navigation list shared by the desktop sidebar and the mobile drawer. */
export function NavList({ collapsed = false, layoutGroup, onNavigate }: { collapsed?: boolean; layoutGroup: string; onNavigate?: () => void }) {
  return (
    <nav aria-label="Main" className="flex flex-col gap-6">
      {NAV.map((section) => (
        <div key={section.label}>
          {!collapsed && <p className="mb-2 px-3 text-[11px] font-semibold tracking-wider text-muted-foreground/80 uppercase">{section.label}</p>}
          <ul className="space-y-0.5">
            {section.items.map((item) => (
              <li key={item.href}>
                <NavLink item={item} collapsed={collapsed} layoutGroup={layoutGroup} onNavigate={onNavigate} />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}

export function Sidebar() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggle = useUiStore((s) => s.toggleSidebar);

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 76 : 260 }}
      transition={{ type: "spring", bounce: 0, duration: 0.35 }}
      className="sticky top-0 hidden h-dvh shrink-0 flex-col border-r bg-sidebar lg:flex"
    >
      <div className={cn("flex h-16 items-center px-5", collapsed && "justify-center px-0")}>
        <Brand collapsed={collapsed} />
      </div>
      <div className="flex-1 overflow-y-auto px-3 py-4 scrollbar-thin">
        <NavList collapsed={collapsed} layoutGroup="sidebar" />
      </div>
      <div className={cn("border-t p-3", collapsed && "flex justify-center")}>
        <button
          type="button"
          onClick={toggle}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!collapsed}
          className="flex h-10 w-full items-center gap-3 rounded-lg px-3 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground data-[collapsed=true]:w-10 data-[collapsed=true]:justify-center data-[collapsed=true]:px-0"
          data-collapsed={collapsed}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && "Collapse"}
        </button>
      </div>
    </motion.aside>
  );
}
