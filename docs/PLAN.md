# Plan

What's built, what's next, and how each upcoming module is scoped. Each unchecked item is sized to be **one pull request with tests**.
Before starting, read [CONTEXT.md](CONTEXT.md), especially "Adding a new module".

## ✅ Phase 1: Foundation (done)

- [x] Next.js 16 + React 19 + Tailwind v4 setup with design tokens, light/dark/system themes
- [x] Mock REST API with MSW 3 and a deterministic in-memory HR database
- [x] Sign-in (validation, server errors, show/hide password, demo account) and session persistence
- [x] App shell: collapsible sidebar, top bar, Ctrl/⌘+K command palette, notifications, user menu
- [x] Mobile: bottom tab bar, navigation drawer, bottom-sheet dialogs, card lists
- [x] Page transitions and micro-interactions with reduced-motion support
- [x] **Dashboard:** KPIs, headcount trend, department breakdown, quick approvals, celebrations, recent hires
- [x] **Employees:** server-side search, filters, sort and pagination in the URL; row selection; CSV export; profile drawer
- [x] **Time off:** balances, approvals (optimistic, swipe on mobile), team and personal history, request form with business rules
- [x] Tests (Vitest + Testing Library + MSW), CI, docs

## 🔜 Phase 2: Finish the core modules

- [ ] **Employees: add and edit employee.** Multi-step form (personal → job → review) with Zod validation. Add `POST /api/employees` and `PATCH /api/employees/:id` to the mock API, with optimistic list updates.
- [ ] **Employees: org chart.** Interactive tree from `managerId` (zoom, pan, collapse branches), built on the existing profile drawer.
- [ ] **Time off: team calendar.** Month view showing who's away each day, filterable by department, with a mobile agenda view.
- [ ] **Time off: cancel a request.** Employees can cancel their own pending or future approved requests; the balance is released.
- [ ] **Notifications centre.** Bell shows real events (requests, approvals, new hires) with read/unread state.

## 🧩 Phase 3: New modules (currently "Coming soon")

- [ ] **Recruitment:** job openings list; a Kanban pipeline (Applied → Screen → Interview → Offer → Hired) with drag and drop (`@dnd-kit`), keyboard-accessible; candidate profile with scorecards.
- [ ] **Performance:** goals/OKRs with progress check-ins, review cycles, a self-review form.
- [ ] **Payroll:** pay-run list and detail, payslip view and print stylesheet, compensation history chart.
- [ ] **Documents:** policy library with read receipts, upload with drag and drop (mocked storage), expiry reminders.
- [ ] **Settings:** company profile, departments and locations, leave policies (entitlements per type), roles and permissions.

## 🛠 Phase 4: Quality and platform

- [ ] **Role-based access:** an employee view (no approvals, own data only), manager and admin. Gate the nav and actions.
- [ ] **Playwright end-to-end tests:** sign in → approve a request → request time off; run on desktop and mobile viewports in CI.
- [ ] **Internationalisation:** `next-intl` with English and one more language; locale-aware dates and numbers.
- [ ] **Performance budget:** lazy-load Recharts; measure with Lighthouse CI (target ≥ 95 on mobile).
- [ ] **PWA:** installable app with offline shell and a cached directory.
- [ ] **Real backend:** implement the contract in `src/lib/api/types.ts` (ASP.NET Core or Node), switch with `NEXT_PUBLIC_API_URL`, and use httpOnly refresh-token cookies.
