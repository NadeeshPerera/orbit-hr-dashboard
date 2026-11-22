import {
  BriefcaseBusiness,
  CalendarDays,
  FileText,
  LayoutDashboard,
  Settings,
  Target,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Not built yet: shown with a "Soon" badge and a placeholder page. */
  soon?: boolean;
  /** Shown in the mobile bottom tab bar. */
  mobileTab?: boolean;
}

export interface NavSection {
  label: string;
  items: NavItem[];
}

/** Single source of truth for navigation (sidebar, mobile tabs, command palette). */
export const NAV: NavSection[] = [
  {
    label: "Overview",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, mobileTab: true },
      { href: "/employees", label: "Employees", icon: Users, mobileTab: true },
      { href: "/time-off", label: "Time off", icon: CalendarDays, mobileTab: true },
    ],
  },
  {
    label: "Talent",
    items: [
      { href: "/recruitment", label: "Recruitment", icon: BriefcaseBusiness, soon: true },
      { href: "/performance", label: "Performance", icon: Target, soon: true },
    ],
  },
  {
    label: "Company",
    items: [
      { href: "/payroll", label: "Payroll", icon: Wallet, soon: true },
      { href: "/documents", label: "Documents", icon: FileText, soon: true },
      { href: "/settings", label: "Settings", icon: Settings, soon: true },
    ],
  },
];

export const ALL_NAV_ITEMS = NAV.flatMap((s) => s.items);

export const isActive = (pathname: string, href: string) => pathname === href || pathname.startsWith(`${href}/`);
