# Pravaah clinic workspace UI/UX implementation report

Implemented locally on 1 November 2026. No deployment, database operation, external messages,
or production patient data were used. See the [baseline audit and checklist](WORKSPACE_REDESIGN.md).

## Before and after

The repository already supported substantial clinic workflows, including mobile record cards,
booking/rescheduling, profile dialogs, risk explanations, polling and lifecycle confirmations.
This implementation builds on those capabilities rather than replacing working business logic.

The fixed sidebar now has a persistent compact mode. Page headings and actions share a consistent
layout; mobile chrome is shorter. Operational data appears before secondary dashboard actions.
Appointment filters take less space, queue counts distinguish loading from zero, and settings
keep save/reset controls visible. A searchable command palette makes existing routes and common
actions available from any workspace page.

Baseline findings came from source inspection; no baseline browser screenshots were captured.
The screenshots below were generated from the implemented UI with fictional data.

| Screen                         | Implemented changes                                                                                                                                                                                                                                                                                         | Retained functionality                                                                                                                                                 |
| ------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shell                          | Compact navy rail with persisted preference and tablet default; labelled icon navigation; account link; quick actions; Ctrl/Cmd+K; contextual `/`; history scroll restoration after data loads; mobile scroll locking; one page-level heading                                                               | Role-derived navigation, Clerk sign-out, mobile drawer/focus trap, protected route gates, clinic context, setup dock                                                   |
| Dashboard                      | Greeting/date and actions in one header; operational pulse moved up; metric links preserve date and completed/no-show filters; active visits prioritized; patient preview links open the selected appointment; no large skeleton during background refresh; queue preview explicitly describes its snapshot | Real summary/activity/queue APIs; upcoming risk periods; advisory scoring; text equivalents for distributions                                                          |
| Appointments                   | Four primary filters; optional specific-patient disclosure; separate accessible names for search/select; active filter count; reset to today; compact page-size control; booking date defaults to selected clinic date                                                                                      | Debounced server search, pagination and URL state; available-slot checks; booking conflicts; rescheduling; lifecycle rules; risk/activity dialogs; mobile record cards |
| Queue                          | Called-patient jump links; compact mobile overview; pending counts shown as unavailable; drag handles/drop indicators and edge scrolling; multi-position insertion within a doctor lane; synchronous duplicate-mutation guard; stronger secondary-text contrast                                             | Keyboard/touch move arrows; expected-order concurrency contract; authoritative reconciliation; stale checks and polling; terminal reason flow; risk stays advisory     |
| Doctors                        | Shared page header; local specialty filter using actual returned records; result count and search shortcut hint; record-shaped loading state; consistent create-page header                                                                                                                                 | Profiles, availability editor, inline errors, lifecycle impact/confirmation and role restrictions                                                                      |
| Patients                       | Shared page and create-page headers; record-shaped loading state; consistent shared controls and mobile density                                                                                                                                                                                             | Bounded server search/pagination, profile/history, booking-return draft, validation and clinic scoping                                                                 |
| Staff                          | Administration header; semantic search control; result count; actionable no-results state                                                                                                                                                                                                                   | Invitations, resend/revoke and access lifecycle controls; server-enforced Admin scope                                                                                  |
| Settings                       | Section jump navigation; sticky save/reset bar; visible dirty state; reload disabled while dirty; browser unload warning                                                                                                                                                                                    | Existing validation, actual saved settings, server failure messages, lifecycle confirmations                                                                           |
| Profile and supporting screens | Profile page heading; consistent shared controls, surfaces and loading patterns                                                                                                                                                                                                                             | Existing Clerk/onboarding architecture and access recovery states; no new authentication flow                                                                          |

## Interaction and design system

- Navy/teal identity retained; semantic secondary text darkened where browser contrast checks failed.
- Shared header, card, filter, button, form and skeleton patterns align spacing and density.
- Buttons expose pending state through `aria-busy`; existing server-confirmed success behavior remains.
- Desktop sidebar preference is the only new persistent browser value. No patient data is stored.
- Command search only filters a local list of real routes/actions; it makes no patient-search requests.
- Palette supports search focus, arrow selection, Enter, Escape, outside dismissal and focus return.
- Shortcuts ignore text entry, composition and active dialogs. Native controls retain their behavior.
- Page changes move focus to main content. Filter-only navigation preserves scroll. Back navigation
  restores a saved scroll position after lazy content/data has enough height, unless the user intervenes.
- Mobile drawer locks both body and workspace scrolling. Read-only Profile content can be scrolled
  with the keyboard. Mobile fields use 16px text and workspace buttons have touch-friendly sizing.
- Routine page entrances no longer animate the entire workspace. Existing reduced-motion support
  applies to navigation, dialogs and queue feedback.
- There was no dark theme in the repository; none was introduced.

## Functional preservation

All production API modules, Express handlers, authorization rules, Prisma schema/migrations,
appointment lifecycle rules and no-show algorithms remain unchanged. Queue drag creates a new
ordered ID list within the existing doctor scope and sends the original expected IDs with it.
Adjacent arrow moves retain their original result. A failed move keeps the confirmed entries and
uses the existing server refresh/conflict recovery. Predictions never control queue order.

The browser preview is a separate script configuration with `.env` loading disabled, a loopback
API base, fictional fixtures and rejected writes. Its Clerk stub is not imported by the app's
production entry or Vite build configuration. It is a UI review harness, not an authentication test
against the real Clerk service.

## Verification evidence

| Check                      | Actual result                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline frontend suite    | 32 files, 179 tests passed before changes                                                                                                                                                                     |
| Final frontend suite       | 34 files, 186 tests passed in an isolated rerun; 33 focused shell tests also passed after the final focus-ring adjustment                                                                                     |
| Production build/typecheck | `npm run build:web` passed: `tsc -b`, Vite and 13 generated public entry points                                                                                                                               |
| Frontend lint              | `npm run lint -w apps/web` passed without warnings                                                                                                                                                            |
| Format and whitespace      | Changed text files checked with Prettier; `git diff --check` passed                                                                                                                                           |
| Responsive browser checks  | Ten routes × eight widths: 320, 375, 390, 768, 1024, 1280, 1440 and 1920; no document/main horizontal overflow                                                                                                |
| Browser accessibility      | axe-core WCAG 2 A/AA, 2.1 AA and 2.2 AA rules at 390/1440 for ten routes, plus booking, risk and command dialogs at 390; zero reported violations                                                             |
| Browser interaction checks | Compact mode persists after reload; command navigation; mobile Escape/focus restoration; booking/risk dialogs; browser-history scroll restoration                                                             |
| Failure/access states      | Empty appointments, failed dashboard load/retry, slow queue, Staff route/command restrictions, failed settings save/input retention, shortcuts during typing, native drag payload and rejected queue mutation |
| Regression additions       | Compact navigation, command search/permissions/keyboard, metric destinations, multi-position drag payload and cross-doctor rejection                                                                          |

One concurrent full-suite run timed out in two pre-existing onboarding numeric-validation cases
while browser/build/lint work was active. An isolated rerun passed all 186 tests using the unchanged
test timeouts. The build/test tools also report an existing stale Browserslist-data notice; dependency
and lockfile updates were deliberately excluded.

[Machine-readable browser results](browser-results.json) record 83 layout/dialog checks and zero
page errors. Failure-state results are recorded separately in [state checks](state-results.json).
Automated accessibility results are evidence for these rendered states, not a blanket WCAG certification.

## Visual evidence

All names and clinic details below are fictional.

- [Dashboard, desktop](screenshots/dashboard-1440.png)
- [Appointments, desktop](screenshots/appointments-1440.png) and [mobile](screenshots/appointments-390.png)
- [Queue, mobile](screenshots/queue-390.png)
- [Clinic settings, desktop](screenshots/clinic-settings-1440.png)
- [Booking dialog, mobile](screenshots/booking-390.png)
- [Risk explanation, mobile](screenshots/risk-390.png)
- [Command palette, mobile](screenshots/commands-390.png)

## Important files

- `apps/web/src/app/AppLayout.tsx`: navigation shortcuts, palette integration, scroll and focus.
- `apps/web/src/components/layout/{Sidebar,Topbar,CommandPalette}.tsx`: workspace navigation.
- `apps/web/src/index.css`: tokens, compact shell, responsive controls, command and queue patterns.
- `apps/web/src/components/ui/{Button,Card,FilterBar,PageHeader,useModalFocus}` and
  `components/feedback/LoadingState.tsx`: shared behavior and presentation.
- `apps/web/src/features/{dashboard,appointments,queues,doctors,patients,staff,clinics,profile}`:
  the page changes described above and focused regression tests.
- `apps/web/scripts/preview-workspace.mjs`, `check-workspace.mjs`,
  `check-workspace-states.mjs`, and `scripts/fixtures/`: isolated repeatable UI review tooling.
- `docs/ui-ux/`: audit, completion report, browser evidence and screenshots.

No application files were removed. No dependencies were added. The pre-existing `package-lock.json`
change was left intact. No commit or deployment was made.

## Reproduce browser QA

From the repository root:

```sh
node apps/web/scripts/preview-workspace.mjs
```

Open `http://127.0.0.1:4175/dashboard`. The preview is read-only and uses fictional data.
With an existing `playwright-core` installation and Chrome, in another terminal:

```sh
PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core node apps/web/scripts/check-workspace.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/playwright-core node apps/web/scripts/check-workspace-states.mjs
```

Set `CHROME_PATH` if Chrome is not at `/usr/bin/google-chrome`. Artifacts go to
`/tmp/pravaah-ui-qa` by default, configurable through `PREVIEW_OUTPUT`. Preview environment settings
include `PREVIEW_STATE=empty|error|slow|populated`, `PREVIEW_ROLE=ADMIN|STAFF` and `PREVIEW_PORT`.
The included browser scripts target the default port 4175.

## Remaining limits

- No real Clerk session, live Express/database mutation, actual invitation delivery or production
  environment was exercised. Browser mutation success is covered by mocked component tests; local
  browser failure tests deliberately reject writes. A deployed staging smoke test remains appropriate.
- Real-device Safari/Firefox, assistive-technology testing and measured INP/Core Web Vitals were not
  performed. No runtime performance target is claimed.
- Native dragging targets desktop pointers. Touch and keyboard users retain explicit move arrows.
- Settings warn on browser unload and protect reload; in-app route changes do not yet show a custom
  unsaved-change confirmation. Implementing comprehensive history blocking would require a separate
  routing decision. Existing create/edit-dialog discard checks remain.
- Existing dashboard previews are bounded (appointments fetched up to 100); full lists remain the
  source for complete daily work. No unsupported calendar, historical analytics or notifications added.
