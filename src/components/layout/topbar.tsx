"use client";

import { Bell, CalendarDays, LogOut, Menu, Monitor, Moon, Search, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/overlays";
import { Avatar } from "@/components/ui/primitives";
import { useAuthStore } from "@/features/auth/auth-store";
import { useUiStore } from "@/features/ui-store";
import { useIsClient } from "@/hooks/use-is-client";
import { useLeaveRequests } from "@/lib/api/queries";
import { formatDateRange, fullName } from "@/lib/utils";
import { BrandMark } from "./brand";

function ThemeMenu() {
  const { theme, setTheme } = useTheme();
  const mounted = useIsClient();
  const Icon = !mounted ? Sun : theme === "dark" ? Moon : theme === "light" ? Sun : Monitor;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Change theme">
          <Icon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="min-w-40">
        <DropdownMenuItem onSelect={() => setTheme("light")}><Sun /> Light</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("dark")}><Moon /> Dark</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => setTheme("system")}><Monitor /> System</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function Notifications() {
  const { data } = useLeaveRequests("pending");
  const count = data?.length ?? 0;
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={count ? `Notifications, ${count} pending approvals` : "Notifications"} className="relative">
          <Bell />
          {count > 0 && (
            <span className="absolute top-2 right-2 grid size-4 place-items-center rounded-full bg-danger text-[9px] font-bold text-white ring-2 ring-background">
              {count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <div className="flex items-center justify-between border-b px-4 py-3">
          <p className="text-sm font-semibold">Needs your attention</p>
          <span className="text-xs text-muted-foreground">{count} pending</span>
        </div>
        <ul className="max-h-80 overflow-y-auto p-1.5">
          {data?.slice(0, 5).map((r) => (
            <li key={r.id}>
              <Link href="/time-off" className="flex items-center gap-3 rounded-lg p-2.5 hover:bg-muted">
                <Avatar person={r.employee} size="sm" />
                <span className="min-w-0 flex-1 text-sm">
                  <span className="block truncate font-medium">{fullName(r.employee)}</span>
                  <span className="block truncate text-xs text-muted-foreground">Time off · {formatDateRange(r.startDate, r.endDate)}</span>
                </span>
              </Link>
            </li>
          ))}
          {count === 0 && <li className="p-6 text-center text-sm text-muted-foreground">You&apos;re all caught up 🎉</li>}
        </ul>
      </PopoverContent>
    </Popover>
  );
}

function UserMenu() {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);
  const router = useRouter();
  if (!user) return null;
  const [firstName, ...rest] = user.name.split(" ");
  const person = { id: user.id, firstName, lastName: rest.join(" ") };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2.5 rounded-full p-0.5 transition hover:bg-muted sm:rounded-lg sm:py-1 sm:pr-2.5 sm:pl-1" aria-label="Account menu">
        <Avatar person={person} size="sm" />
        <span className="hidden text-left sm:block">
          <span className="block text-sm leading-tight font-medium">{user.name}</span>
          <span className="block text-xs leading-tight text-muted-foreground">{user.title}</span>
        </span>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>
          <p className="text-sm font-medium">{user.name}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => router.push(`/employees?employee=${user.id}`)}><UserRound /> My profile</DropdownMenuItem>
        <DropdownMenuItem onSelect={() => router.push("/time-off")}><CalendarDays /> My time off</DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onSelect={() => {
            signOut();
            router.replace("/login");
          }}
          className="text-danger data-[highlighted]:bg-danger/10 [&_svg]:text-danger"
        >
          <LogOut /> Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function Topbar() {
  const setCommandOpen = useUiStore((s) => s.setCommandOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
      <Button variant="ghost" size="icon" className="-ml-2 lg:hidden" aria-label="Open navigation" onClick={() => setMobileNavOpen(true)}>
        <Menu />
      </Button>
      <Link href="/dashboard" className="lg:hidden" aria-label="Orbit HR home">
        <BrandMark className="size-7" />
      </Link>

      <button
        type="button"
        onClick={() => setCommandOpen(true)}
        className="ml-auto flex h-10 items-center gap-2 rounded-lg border bg-card px-3 text-sm text-muted-foreground shadow-xs transition hover:border-ring/50 sm:ml-0 sm:w-72 lg:w-80"
        aria-label="Search (Ctrl+K)"
      >
        <Search className="size-4" />
        <span className="hidden flex-1 text-left sm:block">Search people, pages…</span>
        <kbd className="hidden rounded border bg-muted px-1.5 font-mono text-[10px] sm:block">Ctrl K</kbd>
      </button>

      <div className="flex items-center gap-1 sm:ml-auto">
        <ThemeMenu />
        <Notifications />
        <UserMenu />
      </div>
    </header>
  );
}
