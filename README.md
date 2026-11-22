# 🪐 Orbit HR

A modern, mobile-first **HR dashboard**: a people directory, time-off approvals and workforce insights, with polished animations, dark mode and a ⌘K command palette.

![CI](https://github.com/NadeeshPerera/orbit-hr-dashboard/actions/workflows/ci.yml/badge.svg)
![Next.js](https://img.shields.io/badge/Next.js_16-000000?logo=nextdotjs&logoColor=white)
![React](https://img.shields.io/badge/React_19-20232A?logo=react&logoColor=61DAFB)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_v4-06B6D4?logo=tailwindcss&logoColor=white)
![TanStack](https://img.shields.io/badge/TanStack_Query_%2B_Table_v9-FF4154?logo=reactquery&logoColor=white)
![Motion](https://img.shields.io/badge/Motion-FFF?logo=framer&logoColor=black)

**▶ Live demo:** _coming soon_ · demo sign-in: `ava.chen@orbit-demo.com` / `Demo@1234` (or click **Use the demo account**)

<!-- screenshots: docs/screenshot-desktop.png, docs/screenshot-mobile.png -->

> Frontend-only for now. The REST API is mocked in the browser with **Mock Service Worker**, backed by an in-memory database with real business rules, so connecting a backend later means setting one environment variable. All people and data are fictional.

---

## Highlights

| | |
|---|---|
| 🎨 **Modern UI** | Tailwind v4 design tokens in `oklch`, light/dark/system themes, own shadcn-style components on Radix primitives |
| ✨ **Motion** | Page transitions, a sliding active-nav indicator (`layoutId`), count-up KPIs, drawing sparklines, animated bars and rings, list enter/exit, all respecting *reduced motion* |
| 📱 **Mobile-first** | Bottom tab bar, slide-in drawer, dialogs that become **bottom sheets**, card lists instead of tables, **swipe to approve or decline** time off, safe-area aware |
| ⌨️ **Power-user friendly** | Ctrl/⌘+K command palette (people search, pages, actions), keyboard-navigable everything, skip link |
| 🔗 **URL is state** | Filters, sort, page, the open profile and the request dialog all live in the URL, so views are shareable and Back works |
| ⚡ **Snappy data** | TanStack Query with optimistic approvals (instant, with rollback on error), `keepPreviousData` paging, centralised query keys |

## Modules

| Module | Status | What's in it |
|---|---|---|
| Sign in | ✅ | Zod validation, server errors, show/hide password, demo account, persisted session |
| Dashboard | ✅ | KPIs (headcount, hires, on leave, attrition), 12-month headcount chart, departments, pending approvals, birthdays and anniversaries, recent hires |
| Employees | ✅ | Server-side search, filters, sort and pagination (**TanStack Table v9**), row selection and CSV export, profile drawer with manager, reports and leave balances |
| Time off | ✅ | Balance rings, approvals queue, team and personal history, request form with working-day calculation, overlap and balance rules |
| Recruitment · Performance · Payroll · Documents · Settings | 🔜 | Placeholder pages; scoped in **[docs/PLAN.md](docs/PLAN.md)** |

## Tech stack

**Next.js 16** (App Router, Turbopack, Cache Components) · **React 19** · **TypeScript** · **Tailwind CSS v4** · **Radix UI** · **Motion** · **TanStack Query v5** · **TanStack Table v9** · **Zustand v5** · **React Hook Form + Zod v4** · **Recharts v3** · **cmdk** · **sonner** · **MSW v3** · **Vitest + Testing Library**

## Architecture

```
UI (features/*) ──► TanStack Query hooks (lib/api/queries.ts) ──► fetch client (lib/api/client.ts)
                                                                        │
                        NEXT_PUBLIC_API_URL set? ── yes ──► real backend (same contract)
                                                 └─ no ──► MSW in the browser ──► mocks/db.ts (rules + seeded data)
```

- **The contract lives in `src/lib/api/types.ts`.** The mock API implements it today; a real backend implements it later, with no UI changes.
- **Business rules are pure TypeScript** (`src/mocks/db.ts`) with an injected clock, so they're unit-tested without a browser.
- **Errors are RFC 7807 `problem+json`**, mapped to `ApiError`, and field errors are mapped straight onto form fields.
- **Zustand holds only UI and session state.** Server data never leaves TanStack Query.

More detail (conventions, folder structure, how to add a module): **[docs/CONTEXT.md](docs/CONTEXT.md)**.

## Getting started

Requires **Node.js 22.12+**.

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script | |
|---|---|
| `npm test` | Unit and component tests (Vitest + Testing Library, API mocked with MSW) |
| `npm run lint` | ESLint with Next.js and React Compiler rules |
| `npm run typecheck` | Generates route types, then `tsc --noEmit` |
| `npm run build` | Production build |

## Tests

- **Rules:** working-day maths (weekends, year boundaries, leap days), employee search, filter, sort and pagination, approval rules (no self-approval, no double review), leave validation (past dates, weekends, overlaps, balances), dashboard consistency
- **UI flows** against the mock API: sign-in (validation, bad password, demo sign-in), table sorting, selection and profile opening, optimistic approval persisted on the server, request form validation and submission

CI runs lint, typecheck, tests and build on every push and pull request.

## Roadmap

See **[docs/PLAN.md](docs/PLAN.md)**.

## Author

**Nadeesh Perera**, Frontend-focused Software Engineer
[LinkedIn](https://www.linkedin.com/in/nadeesh-perera-984461214) · [GitHub](https://github.com/NadeeshPerera)
