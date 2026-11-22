"use client";

import { Command } from "cmdk";
import { CalendarPlus, LogOut, Moon, Search, Sun, UserRound } from "lucide-react";
import { useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import { Dialog as D } from "radix-ui";
import { useEffect, useState } from "react";
import { Avatar } from "@/components/ui/primitives";
import { useAuthStore } from "@/features/auth/auth-store";
import { useUiStore } from "@/features/ui-store";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { useEmployees } from "@/lib/api/queries";
import { ALL_NAV_ITEMS } from "@/lib/nav";
import { fullName } from "@/lib/utils";

const itemClass =
  "flex cursor-default items-center gap-3 rounded-lg px-3 py-2.5 text-sm outline-none select-none data-[selected=true]:bg-accent data-[selected=true]:text-accent-foreground [&_svg]:size-4 [&_svg]:text-muted-foreground";
const groupClass = "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:pt-3 [&_[cmdk-group-heading]]:pb-1.5 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:tracking-wider [&_[cmdk-group-heading]]:text-muted-foreground [&_[cmdk-group-heading]]:uppercase";

/** Ctrl/⌘+K command palette: jump to pages, find people, run quick actions. */
export function CommandMenu() {
  const open = useUiStore((s) => s.commandOpen);
  const setOpen = useUiStore((s) => s.setCommandOpen);
  const signOut = useAuthStore((s) => s.signOut);
  const { resolvedTheme, setTheme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState("");
  const q = useDebouncedValue(search.trim(), 200);
  const people = useEmployees({ q, pageSize: 6 });

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(!useUiStore.getState().commandOpen);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setOpen]);

  const run = (fn: () => void) => {
    setOpen(false);
    setSearch("");
    fn();
  };

  return (
    <D.Root open={open} onOpenChange={setOpen}>
      <D.Portal>
        <D.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[2px] data-[state=open]:animate-in data-[state=open]:fade-in-0" />
        <D.Content className="fixed top-[12vh] left-1/2 z-50 w-[calc(100vw-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-2xl border bg-popover shadow-2xl data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95">
          <D.Title className="sr-only">Search and commands</D.Title>
          <D.Description className="sr-only">Type to search people and pages, then press Enter.</D.Description>
          <Command shouldFilter={false} loop>
            <div className="flex items-center gap-3 border-b px-4">
              <Search className="size-4 text-muted-foreground" />
              <Command.Input value={search} onValueChange={setSearch} placeholder="Search people, pages and actions…" className="h-14 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" />
              <kbd className="rounded border bg-muted px-1.5 font-mono text-[10px] text-muted-foreground">Esc</kbd>
            </div>
            <Command.List className="max-h-[min(60vh,420px)] overflow-y-auto p-2">
              <Command.Empty className="py-10 text-center text-sm text-muted-foreground">No results for “{search}”.</Command.Empty>

              {q && people.data && people.data.items.length > 0 && (
                <Command.Group heading="People" className={groupClass}>
                  {people.data.items.map((e) => (
                    <Command.Item key={e.id} value={`person-${e.id}`} className={itemClass} onSelect={() => run(() => router.push(`/employees?employee=${e.id}`))}>
                      <Avatar person={e} size="sm" />
                      <span className="flex-1 truncate">{fullName(e)}</span>
                      <span className="truncate text-xs text-muted-foreground">{e.jobTitle}</span>
                    </Command.Item>
                  ))}
                </Command.Group>
              )}

              <Command.Group heading="Pages" className={groupClass}>
                {ALL_NAV_ITEMS.filter((i) => !q || i.label.toLowerCase().includes(q.toLowerCase())).map(({ href, label, icon: Icon, soon }) => (
                  <Command.Item key={href} value={`page-${href}`} className={itemClass} onSelect={() => run(() => router.push(href))}>
                    <Icon /> <span className="flex-1">{label}</span>
                    {soon && <span className="text-[10px] font-semibold text-muted-foreground uppercase">Soon</span>}
                  </Command.Item>
                ))}
              </Command.Group>

              {!q && (
                <Command.Group heading="Actions" className={groupClass}>
                  <Command.Item value="action-request" className={itemClass} onSelect={() => run(() => router.push("/time-off?request=1"))}>
                    <CalendarPlus /> Request time off
                  </Command.Item>
                  <Command.Item value="action-profile" className={itemClass} onSelect={() => run(() => router.push(`/employees?employee=${useAuthStore.getState().user?.id}`))}>
                    <UserRound /> View my profile
                  </Command.Item>
                  <Command.Item value="action-theme" className={itemClass} onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}>
                    {resolvedTheme === "dark" ? <Sun /> : <Moon />} Switch to {resolvedTheme === "dark" ? "light" : "dark"} mode
                  </Command.Item>
                  <Command.Item
                    value="action-signout"
                    className={itemClass}
                    onSelect={() =>
                      run(() => {
                        signOut();
                        router.replace("/login");
                      })
                    }
                  >
                    <LogOut /> Sign out
                  </Command.Item>
                </Command.Group>
              )}
            </Command.List>
          </Command>
        </D.Content>
      </D.Portal>
    </D.Root>
  );
}
