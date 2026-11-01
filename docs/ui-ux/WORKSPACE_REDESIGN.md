# Clinic workspace redesign — audit and checklist

## Baseline (1 November 2026)

Source inspection covers the current React 19/Vite workspace, route registry, Clerk guards,
feature API modules, shared components, styles, tests, and architecture/product documentation.
Code is authoritative; older docs omit Staff, profile, rescheduling, availability and risk intelligence.

| Area                    | Existing implementation                                                                          | Priority improvement                                                  |
| ----------------------- | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------- |
| Shell                   | Navy sidebar, grouped role-aware routes, mobile focus trap, account menu                         | Persisted compact rail, command navigation, focus/history restoration |
| Dashboard               | Today's summary/activity, appointment/queue previews, risk intelligence for 1/7/30 days          | Operational hierarchy, metric destinations, stable refresh layout     |
| Appointments            | Server pagination, URL filters, debounced search, booking/reschedule/activity dialogs            | Clear page context, compact filter layout and active-filter count     |
| Queue                   | 30-second foreground polling, stale checks, server reconciliation, doctor-scoped up/down reorder | Scan-friendly current-call summary and honest loading counts          |
| Doctors                 | Local directory search/filter, profiles, availability, lifecycle confirmation                    | Consistent heading, persistent non-sensitive filters, record density  |
| Patients                | Server search/pagination, profiles, clinic history, lifecycle confirmation                       | Consistent heading, keyboard search and mobile record readability     |
| Staff (Admin)           | Invitations, member search, lifecycle/access management                                          | Clear sections, search/result feedback and recoverable empty search   |
| Settings (Admin)        | Validated profile/address/hours, dirty tracking, save/reset, lifecycle actions                   | Section navigation, visible unsaved/save state, reload protection     |
| Profile/onboarding/auth | Clerk, provisioning/recovery guards, setup checklist                                             | Shared visual rhythm; retain access gates and recovery flows          |

Strengths to retain: existing navy/teal brand, semantic status/risk tokens, reduced motion,
API error mapping, clinic-local dates, human-controlled queue, responsive operational tables,
modal focus stack, backend permission enforcement, and extensive Vitest regression coverage.
There is no existing dark theme; do not introduce a second palette.

Observed friction: page headers often contain only right-aligned actions while titles live in
the topbar; fixed 256px sidebar consumes tablet space; no command navigation or compact mode;
full loading panels appear above existing dashboard data during refresh; summary cards are not
links; settings reload can discard edits; staff search has weak empty-result recovery.
Table/form styling repeats Tailwind literals; shared primitives should own sizing and feedback.
Main content has its own scroll container, so modal/navigation locking must cover it, not just body.
Dashboard is manually refreshed; only Queue polling justifies a live label. No invented analytics.

## Implementation checklist

- [x] Repository/product/API and component audit
- [x] Foundation: tokens, shared components, compact sidebar, topbar/command navigation
- [x] Operations: dashboard hierarchy/links, appointment filters, queue scanability
- [x] Management: doctor/patient/staff consistency and search feedback
- [x] Administration: settings sections and unsaved state, supporting screens
- [x] QA: regression tests, type/build/lint/format, browser responsive/accessibility review

## Verification plan

Run existing frontend suite and production build. Add focused interaction tests for compact
navigation, palette filtering/permissions/focus and changed operational links. Use fictional
fixtures for browser rendering if a local authenticated session is unavailable; never alter
production authentication to enable previews. Check 320/375/390/768/1024/1280/1440/1920 widths,
keyboard controls, dialogs, reduced motion, populated and empty/error/loading states.
Document actual evidence and limitations separately from implementation completion.

## Boundaries

No API contract, Prisma schema, prediction rules, queue ordering rules or role permissions change.
No new dependencies or external patient-data services. Existing package-lock.json edits belong
to the user. This is a local repository change, with no deployment or database operation.
