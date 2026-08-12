# Frontend Responsive And Performance Audit

Issue: GitHub #228

Status: code and documentation changes are prepared. Automated tests, builds, lint,
bundle analysis, Lighthouse, and deployment checks were not run by Codex because this
issue explicitly disallows project terminal commands.

## Scope

This audit covers the React/Vite web app in `apps/web` and preserves the current
React Router, Clerk, Express API, Prisma backend, and workspace architecture. It does
not introduce new routing, state, UI, E2E, analytics, or performance dependencies.

## Route Inventory

| Route                | Component               | Access                     | Layout                      | Data loading                                                              | Loading / empty / error states                                        | Responsive strategy                                                                                               | Performance notes                                                      | A11y notes                                                               |
| -------------------- | ----------------------- | -------------------------- | --------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| `/`                  | `PublicLandingPage`     | Public                     | Public marketing shell      | Clerk auth state only                                                     | Signed-in and signed-out CTA branches                                 | Header navigation wraps on small widths; content sections use responsive grids                                    | Lazy public route chunk                                                | Semantic landmarks, named public nav, keyboard CTAs                      |
| `/login/*`           | `LoginPage`             | Public auth                | `AuthPageLayout`            | Clerk SignIn widget                                                       | Clerk-managed auth UI                                                 | Single-column on small screens, two-column auth layout on larger screens                                          | Lazy auth route chunk                                                  | Clerk handles form semantics; app wrapper supplies heading/context       |
| `/sign-up/*`         | `SignUpPage`            | Public auth                | `AuthPageLayout`            | Clerk SignUp widget                                                       | Clerk-managed auth UI                                                 | Same auth layout as login                                                                                         | Lazy auth route chunk                                                  | Clerk handles form semantics; app wrapper supplies heading/context       |
| `/onboarding`        | Redirect                | Signed-in onboarding entry | Public error boundary only  | None                                                                      | Redirects to `/onboarding/clinic`                                     | No visual page                                                                                                    | No page chunk beyond router                                            | Safe redirect path                                                       |
| `/onboarding/clinic` | `ClinicOnboardingPage`  | Signed-in onboarding       | Standalone onboarding shell | `GET /api/auth/onboarding-status`, clinic bootstrap, optional sample data | Loading, invalid/recovery, success, API error, retry                  | Form sections stack on mobile and use constrained content width                                                   | Lazy onboarding route chunk; sample-data work stays user-triggered     | Labeled fields, status messages, confirmation dialog                     |
| `/dashboard`         | `DashboardOverviewPage` | Protected Admin/Staff      | Protected app shell         | Dashboard summary, high-risk appointments, today activity                 | Loading, empty-ish metric states, error/retry                         | Responsive bento metrics, distribution panels, and constrained page content                                       | Lazy protected route chunk                                             | Page heading, readable status copy, risk explanations                    |
| `/doctors`           | `DoctorsPage`           | Protected Admin/Staff      | Protected app shell         | Doctor list/search/update                                                 | Loading, empty, filtered empty, API error/retry, success toast        | Filter controls wrap; dense table uses labeled, keyboard-focusable horizontal scrolling on small screens          | Lazy protected route chunk                                             | Accessible table semantics, focusable overflow region, form labels       |
| `/doctors/new`       | `DoctorCreatePage`      | Protected Admin/Staff      | Protected app shell         | Doctor create API                                                         | Validation, submitting, API error, success redirect/toast             | Form content stacks and remains within shell padding                                                              | Lazy protected route chunk                                             | Labeled inputs, field errors, discard confirmation                       |
| `/patients`          | `PatientsPage`          | Protected Admin/Staff      | Protected app shell         | Patient list/search/update                                                | Loading, empty, filtered empty, API error/retry, success toast        | Filter controls wrap; dense table uses labeled, keyboard-focusable horizontal scrolling on small screens          | Lazy protected route chunk                                             | Accessible table semantics, focusable overflow region, form labels       |
| `/patients/new`      | `PatientCreatePage`     | Protected Admin/Staff      | Protected app shell         | Patient create API                                                        | Validation, submitting, API error, success redirect/toast             | Form content stacks and remains within shell padding                                                              | Lazy protected route chunk                                             | Labeled inputs, field errors, discard confirmation                       |
| `/appointments`      | `AppointmentsPage`      | Protected Admin/Staff      | Protected app shell         | Appointment list, doctors, patients, create/status APIs, risk details     | Loading, empty, filtered empty, API error/retry, status toast         | Booking/filter controls stack; dense table uses labeled, keyboard-focusable horizontal scrolling on small screens | Lazy protected route chunk; risk details expand only on demand in-page | Tables, buttons, status messages, and risk explanation text are explicit |
| `/queue`             | `QueuePage`             | Protected Admin/Staff      | Protected app shell         | Today's queue, doctors, status/reorder APIs, risk details                 | Loading, empty, filtered empty, API error/retry, reorder/status toast | Filter controls stack; active queue uses doctor-scoped ordered lanes/cards instead of horizontal table scrolling  | Lazy protected route chunk; queue reorder stays user-triggered         | Icon move buttons have labels/tooltips; risk unavailable is explicit     |
| `/clinic-settings`   | `ClinicSettingsPage`    | Protected Admin only       | Protected app shell         | Clinic settings load/update                                               | Loading, error/retry, validation, submitting, success toast           | Settings form stacks within shell; unavailable to Staff navigation                                                | Lazy protected route chunk; route remains protected                    | Admin-only route/nav, labeled settings fields                            |
| `*`                  | `NotFoundPage`          | Public fallback            | Public error boundary       | None                                                                      | Static not-found state                                                | Simple responsive content block                                                                                   | Lazy fallback chunk                                                    | Clear heading and navigation back to home                                |

## Implemented Changes

| Area                  | Change                                                                                                                                                                                                         | Files                                                                                                                                                                                                       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route loading         | Public, auth, onboarding, protected workspace pages, and fallback now use `React.lazy`; protected children render inside a shell-level `Suspense` fallback.                                                    | `apps/web/src/App.tsx`, `apps/web/src/routes/dashboardRoutes.tsx`, `apps/web/src/app/AppLayout.tsx`                                                                                                         |
| Route scroll behavior | SPA navigation scrolls to top only when the pathname changes, preserving query/hash-only interactions.                                                                                                         | `apps/web/src/App.tsx`                                                                                                                                                                                      |
| Mobile shell          | Added a mobile workspace header and modal drawer with Tab looping, Escape close, background scroll lock, initial focus on close, route-change close, and focus restoration. Desktop sidebar remains for `md+`. | `apps/web/src/components/layout/Sidebar.tsx`, `apps/web/src/app/AppLayout.tsx`                                                                                                                              |
| Main landmark         | Added a working skip link and `main#main-content` in the protected app shell.                                                                                                                                  | `apps/web/src/app/AppLayout.tsx`                                                                                                                                                                            |
| Floating setup dock   | Admin setup progress now lives in the protected shell, seeded by `GET /api/auth/onboarding-status`, with collapsed/expanded/completed states.                                                                  | `apps/web/src/app/ProtectedAppShell.tsx`, `apps/web/src/app/AppLayout.tsx`, `apps/web/src/features/onboarding/components/FloatingSetupDock.tsx`                                                             |
| Queue board           | Active queue changed from a horizontally scrollable table to doctor-scoped ordered lanes/cards with icon-only move controls, status actions, and secondary final-entry review.                                | `apps/web/src/features/queues/QueuePage.tsx`                                                                                                                                                                |
| Dense tables          | Doctor, patient, and appointment tables expose horizontal scroll areas to keyboard users with route-specific labels; active queue no longer uses the dense-table pattern.                                      | `apps/web/src/features/doctors/DoctorsPage.tsx`, `apps/web/src/features/patients/PatientsPage.tsx`, `apps/web/src/features/appointments/AppointmentsPage.tsx`                                              |
| Public header         | Public navigation wraps on small screens instead of creating header-level horizontal overflow.                                                                                                                 | `apps/web/src/features/public/PublicLandingPage.tsx`                                                                                                                                                        |
| Toasts/dialogs        | Toasts render at the mobile bottom and desktop top-right; confirmation dialogs lock background scroll while open.                                                                                              | `apps/web/src/components/feedback/ToastProvider.tsx`, `apps/web/src/components/ui/ConfirmationDialog.tsx`                                                                                                   |
| Reduced motion        | Global reduced-motion handling shortens CSS animations/transitions and disables smooth scrolling.                                                                                                              | `apps/web/src/index.css`                                                                                                                                                                                    |
| Tests                 | Existing public route test now waits for lazy content; protected shell tests cover the mobile drawer open/Escape close/focus behavior.                                                                         | `apps/web/src/App.test.tsx`, `apps/web/src/app/ProtectedAppShell.test.tsx`                                                                                                                                  |

## Static Asset Inventory

Measured with `wc -c` and `file` inspection only; no build or optimizer command was run.

| Asset                                             |      Size | Dimensions / type | Known consumers                        | Notes                                                                                 |
| ------------------------------------------------- | --------: | ----------------- | -------------------------------------- | ------------------------------------------------------------------------------------- |
| `apps/web/public/brand/favicon.svg`               |     661 B | SVG               | `apps/web/index.html` favicon          | Small vector favicon; keep.                                                           |
| `apps/web/public/brand/apple-touch-icon.png`      |     952 B | 180x180 PNG RGBA  | `apps/web/index.html` apple touch icon | Small enough for public icon use.                                                     |
| `apps/web/public/brand/pravaah-mark-gradient.svg` |     716 B | SVG               | No direct source reference found       | Candidate reusable mark; keep unless a later cleanup confirms no external references. |
| `apps/web/public/brand/pravaah-mark-solid.svg`    |     384 B | SVG               | No direct source reference found       | Candidate reusable mark; keep unless a later cleanup confirms no external references. |
| `apps/web/public/brand/pravaah-social-card.png`   |  35,661 B | 1200x630 PNG RGB  | `index.html`, `RouteMetadata`, JSON-LD | Appropriate for social previews.                                                      |
| `apps/web/public/pravaah-logo.png`                | 105,038 B | 2000x2000 PNG RGB | No direct source reference found       | Large legacy/public asset; avoid importing into runtime UI.                           |
| `apps/web/public/pravaah-wordmark-dark.png`       |  82,131 B | 2000x2000 PNG RGB | No direct source reference found       | Large legacy/public asset; avoid importing into runtime UI.                           |
| `apps/web/public/pravaah-wordmark-light.png`      |  80,148 B | 2000x2000 PNG RGB | No direct source reference found       | Large legacy/public asset; avoid importing into runtime UI.                           |

Current route UI uses the inline `PravaahLogo` React component rather than importing
the large public PNGs. Do not remove public assets in this issue because external
documentation, demos, or deploy previews may still reference public paths.

## Font And CSS Loading

The app currently uses a system font stack with `Inter` first if already available on
the client system. No webfont files, CSS `@import`, or third-party font requests were
found in `apps/web/src/index.css` or `apps/web/index.html`.

Owner checks:

1. In browser DevTools Network, filter by `font`.
2. Load `/`, `/dashboard`, `/appointments`, and `/queue`.
3. Expected result: no remote font files are requested by app CSS.

## Performance Baseline Procedure

Codex did not run these steps. Use this procedure to collect truthful before/after
numbers and attach screenshots or exported reports to the issue.

| Metric                                     | Before value  | After value   | How to measure                                                                                                                       |
| ------------------------------------------ | ------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Production JS chunks and sizes             | Owner to fill | Owner to fill | Run `npm run build:web`; record Vite chunk names and gzip/brotli if reported by local tooling.                                       |
| First load transferred JS for `/`          | Owner to fill | Owner to fill | `npm run dev:web`, DevTools Network, Disable cache, hard reload `/`. Record transferred JS.                                          |
| First load transferred JS for `/dashboard` | Owner to fill | Owner to fill | Sign in with demo/test account, hard reload `/dashboard`, record transferred JS.                                                     |
| Route transition lazy chunk                | Owner to fill | Owner to fill | From `/dashboard`, open DevTools Network JS filter, navigate to `/appointments`, `/queue`, `/patients`; record newly fetched chunks. |
| Lighthouse mobile performance              | Owner to fill | Owner to fill | Chrome DevTools Lighthouse, mobile mode, run against local production preview or deployed URL.                                       |
| Lighthouse accessibility                   | Owner to fill | Owner to fill | Same Lighthouse run; record accessibility score and issues.                                                                          |
| Largest Contentful Paint                   | Owner to fill | Owner to fill | Lighthouse or Performance panel, mobile throttling profile.                                                                          |
| Total Blocking Time                        | Owner to fill | Owner to fill | Lighthouse mobile report.                                                                                                            |

Recommended owner command sequence:

```sh
npm run build:web
npm run dev:web
```

Optional local production preview after build:

```sh
npm run preview -w apps/web
```

## Responsive Verification Matrix

Run every route at these widths: 320, 360, 390, 414, 768, 1024, 1280, and 1440 px.
Use at least Chrome desktop responsive mode and one real mobile browser when possible.

| Check                                                                                                    | Routes                                                                                     |
| -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| No unintended page-level horizontal scrolling                                                            | All routes                                                                                 |
| Header/topbar text wraps or truncates without overlap                                                    | All routes                                                                                 |
| Primary actions remain reachable without covering content                                                | All routes                                                                                 |
| Protected mobile drawer opens, loops Tab focus, closes by close button, backdrop, Escape, and navigation | Protected routes                                                                           |
| Skip link focuses `main#main-content`                                                                    | Protected routes                                                                           |
| Dense tables can be horizontally scrolled by touch and keyboard focus                                    | `/doctors`, `/patients`, `/appointments`                                                   |
| Queue lanes/cards remain usable without horizontal page scroll                                           | `/queue`                                                                                   |
| Forms have labels, visible field errors, and no clipped controls                                         | `/doctors/new`, `/patients/new`, `/appointments`, `/clinic-settings`, `/onboarding/clinic` |
| Toasts do not cover form submit actions on mobile                                                        | Create/update/status workflows                                                             |
| Confirmation dialog locks background scroll and keeps keyboard controls available                        | Create/edit/discard workflows                                                              |
| Reduced-motion setting avoids large route or showcase animation                                          | `/` and protected shell                                                                    |

## Accessibility Checklist

Owner/manual checks:

1. Tab from browser chrome through `/` and confirm focus is visible on nav and CTAs.
2. Tab into protected routes and activate the skip link.
3. Open the mobile drawer, confirm focus lands on the close button, press Escape, and confirm focus returns to the Menu button.
4. Confirm the active route link is announced with `aria-current`.
5. Keyboard-scroll the doctors, patients, and appointments table regions.
6. Tab through queue lane move buttons and status controls; confirm disabled boundaries are announced.
7. Submit invalid forms and confirm focus remains usable and field errors are visible.
8. Trigger API error states with the backend stopped and confirm retry buttons are reachable.
9. Confirm risk unavailable text is not presented as low risk.

## Verification Commands

These commands are for the project owner. They were not run by Codex for this issue.

```sh
npm run test:web
npm run test:server
npm run lint
npm run build:web
npm run build:server
npm run check
```

Manual runtime commands:

```sh
npm run dev:server
npm run dev:web
```

Then verify:

1. Public routes: `/`, `/login`, `/sign-up`, `/onboarding/clinic`, and an unknown route.
2. Protected Admin routes: `/dashboard`, `/doctors`, `/doctors/new`, `/patients`,
   `/patients/new`, `/appointments`, `/queue`, `/clinic-settings`.
3. Protected Staff routes: same as Admin except `/clinic-settings` should not appear in
   navigation and should remain unauthorized by backend policy.

## Known Limits

- Lighthouse, bundle, and route performance numbers are intentionally blank until the
  owner runs the verification commands.
- The app remains a Vite SPA. Client-side metadata updates improve in-app route metadata,
  but non-JavaScript crawlers still see the initial HTML shell.
- Dense operational lists intentionally use controlled horizontal scrolling on mobile
  rather than duplicating hidden mobile and desktop datasets.
