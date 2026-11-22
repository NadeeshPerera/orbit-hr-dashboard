# Project context

Everything a developer (or an AI coding assistant) needs to work on Orbit HR without re-reading the whole codebase.
Read this first, then [PLAN.md](PLAN.md) for what to build next.

## What this is

**Orbit HR** is a frontend-only HR dashboard for a fictional company. It covers sign-in, an app shell with responsive navigation, and three working modules (**Dashboard**, **Employees** and **Time off**). The other modules (Recruitment, Performance, Payroll, Documents, Settings) are planned; they appear in the nav with a "Soon" badge and a placeholder page.

There is **no backend yet**. A mock REST API runs in the browser through **Mock Service Worker (MSW)**, backed by an in-memory database with real business rules. A future backend only needs to implement the same HTTP contract.

## Stack

| Concern | Choice | Notes |
|---|---|---|
| Framework | **Next.js 16** (App Router, Turbopack, `cacheComponents`) + **React 19** | Read `AGENTS.md` before changing framework code: v16 has breaking changes. |
| Language | TypeScript (strict) | |
| Styling | **Tailwind CSS v4** + CSS variables (oklch) | Tokens in `src/app/globals.css`; dark mode via `.dark` (next-themes). |
| Components | Own shadcn-style components on **Radix UI** primitives | `src/components/ui/*`. No component library dependency. |
| Animation | **Motion** (`motion/react`) + `tw-animate-css` | Every animation respects `prefers-reduced-motion` (`MotionConfig reducedMotion="user"`). |
| Server state | **TanStack Query v5** | All keys in `src/lib/api/queries.ts` (`keys`). |
| Tables | **TanStack Table v9** | New v9 API: `useTable` + `tableFeatures`; features and columns at module scope. |
| Client state | **Zustand v5** | Only UI and session state (`auth-store`, `ui-store`). Never server data. |
| Forms | **React Hook Form** + **Zod v4** | Use `useWatch`, not `watch()` (React Compiler lint rule). |
| Charts | **Recharts v3** | Colours come from CSS variables, so charts follow the theme. |
| Command palette | **cmdk** | Ctrl/⌘+K. |
| Toasts | **sonner** | |
| Mock API | **MSW v3** | Started in `src/instrumentation-client.ts` (browser only). |
| Tests | **Vitest** + **Testing Library** + MSW (`msw/node`) | |

**Node 22.12+ is required** (MSW 3 and Next 16 tooling rely on it).

## Folder structure

```
src/
├── app/                       # Routes only: thin pages that compose features
│   ├── (app)/                 # Signed-in area: layout = AppShell, template = page transition
│   │   ├── dashboard/  employees/  time-off/
│   │   └── recruitment/ performance/ payroll/ documents/ settings/   # "coming soon"
│   ├── login/
│   ├── layout.tsx  providers.tsx  globals.css  not-found.tsx
├── components/
│   ├── layout/                # AppShell, Sidebar, Topbar, MobileTabBar/Drawer, CommandMenu, PageHeader, ComingSoon
│   └── ui/                    # Button, Card, Badge, Input, Avatar, Dialog/Sheet, Dropdown, Popover, Tooltip…
├── features/<module>/         # Everything for one module: views, widgets, hooks, helpers, tests
├── hooks/                     # Generic hooks (useDebouncedValue, useIsClient)
├── lib/
│   ├── api/types.ts           # ⭐ The API contract (shared with mocks; a backend must match it)
│   ├── api/client.ts          # fetch wrapper → ApiError (RFC 7807 problem+json)
│   ├── api/queries.ts         # TanStack Query hooks + query keys + mutations
│   ├── dates.ts  utils.ts  nav.ts
├── mocks/
│   ├── seed.ts                # Deterministic fictional company (seeded PRNG)
│   ├── db.ts                  # ⭐ In-memory "backend": every business rule lives here
│   ├── handlers.ts            # MSW routes → db
│   └── browser.ts             # MSW worker
├── test/                      # Vitest setup, MSW node server, render helper
└── instrumentation-client.ts  # Starts MSW in the browser before hydration
```

## Conventions

- **Routes are thin.** `app/**/page.tsx` only composes components from `features/`. Pages that read `useSearchParams` wrap their view in `<Suspense>` (required with `cacheComponents`).
- **URL is state** for anything shareable: filters, sort, page, the open profile (`?employee=EMP-1001`) and the request dialog (`?request=1`).
- **Next 16 keeps routes alive** (React `<Activity>`), so state persists across navigation. Close drawers explicitly on navigation and reset forms when dialogs open (see `MobileDrawer` and `RequestLeaveDialog`).
- **One nav config.** Add modules in `src/lib/nav.ts`. The sidebar, mobile tabs and command palette read from it.
- **Mobile first.** Under `lg`: bottom tab bar plus drawer. Dialogs become bottom sheets on phones. Tables switch to card lists under `md`. Touch targets are at least 40px, and safe-area padding is applied (`pb-safe`).
- **Accessibility.** Every control has a label. Charts have text alternatives. Sorting uses `aria-sort`. Tabs use the full ARIA tabs pattern. Swipe gestures always have equivalent buttons.
- **Optimistic updates** for fast, reversible actions (approving time off): update the cache in `onMutate`, roll back in `onError`, invalidate in `onSettled`.
- **Errors** come back as `ApiError { status, title, detail, errors }`. Field errors map onto form fields with `setError`.
- **Dependencies are pinned** to exact versions that were at least two weeks old when added.

## Adding a new module (checklist)

1. Add API types to `src/lib/api/types.ts`.
2. Add rules and data to `src/mocks/db.ts` (+ seed), and routes to `src/mocks/handlers.ts`.
3. Unit-test the rules in `src/mocks/db.test.ts`.
4. Add query hooks and keys to `src/lib/api/queries.ts`.
5. Build UI in `src/features/<module>/`, and replace the `ComingSoon` page in `src/app/(app)/<module>/page.tsx`.
6. Remove `soon: true` from `src/lib/nav.ts`.
7. Add component tests (MSW-backed) next to the feature.
8. Tick the item in [PLAN.md](PLAN.md).

## Connecting a real backend

Set `NEXT_PUBLIC_API_URL=https://api.example.com`. MSW then doesn't start, and every request goes to that origin with `Authorization: Bearer <token>`. The backend must implement the endpoints in `src/mocks/handlers.ts`, with the shapes in `src/lib/api/types.ts`, and return errors as RFC 7807 `problem+json`.

## Demo account

`ava.chen@orbit-demo.com` / `Demo@1234` (Head of People, admin). Fictional; defined in `src/mocks/demo-account.ts`.

## Commands

```bash
npm run dev        # http://localhost:3000
npm test           # Vitest
npm run lint       # ESLint (Next + React Compiler rules)
npm run typecheck  # next typegen + tsc
npm run build
```
