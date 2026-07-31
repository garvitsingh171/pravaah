# Testing

## Current Test Tooling

Backend:

- Vitest is configured in `apps/server`.
- Tests use `vitest run`.
- Feature-module tests live in `apps/server/src/modules/<feature>/__tests__/`.

Frontend:

- Vitest is configured in `apps/web`.
- Tests use jsdom, React Testing Library, `@testing-library/jest-dom`, and `@testing-library/user-event`.
- Clerk is mocked in frontend tests for loading, signed-out, and signed-in UI states.
- Feature API modules are mocked for component and routing tests; frontend tests must not make real network calls.

End-to-end:

- Playwright is configured at the repository root.
- Clerk browser tests use `@clerk/testing/playwright`.
- E2E tests require a real backend, real Clerk testing credentials, and a dedicated non-production database.

Root:

- `npm run check` runs build and lint across workspaces.

## Existing Tests Found

Backend tests currently include:

| Area         | Files                                                                                                                        |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Auth/access  | Auth middleware, onboarding controller/service/repository, Clerk identity, and access service tests under `auth/__tests__`.  |
| Appointments | `appointment.service.test.ts`, `appointment.controller.test.ts`, `appointment.validation.test.ts`.                           |
| Queue        | Queue service tests including status sync and reorder behavior.                                                              |
| Predictions  | `prediction.service.test.ts`.                                                                                                |
| Dashboard    | `dashboard.service.test.ts`, `dashboard.controller.test.ts`, `dashboard.repository.test.ts`, `dashboard.validation.test.ts`. |
| Clinics      | Clinic settings, sample data, controller, repository, and validation tests.                                                  |
| Doctors      | Doctor validation tests.                                                                                                     |

Frontend tests currently include:

- protected app shell routing states
- clinic onboarding page
- first-run setup checklist
- dashboard checklist integration
- doctor edit workflow
- patient edit workflow
- queue reorder controls
- API client and onboarding API helpers

Playwright E2E specs currently include:

- public routing
- sign-up plus onboarding without sample data
- sign-up plus onboarding with sample data
- onboarding validation, retry, refresh, and completed-redirect behavior
- doctor edit
- patient edit
- manual queue reorder
- v0.1 smoke workflow

## How To Run Tests

Backend tests:

```bash
npm run test -w apps/server
```

Root alias:

```bash
npm run test:server
```

Frontend tests:

```bash
npm run test:web
```

Frontend watch mode:

```bash
npm run test:watch -w apps/web
```

Frontend coverage:

```bash
npm run test:coverage -w apps/web
```

Playwright E2E tests:

```bash
npx playwright install chromium
npm run test:e2e
```

Only run E2E after configuring:

```txt
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
E2E_DATABASE_URL
E2E_ALLOW_TEST_DATABASE_WRITES=true
```

`E2E_DATABASE_URL` must be dedicated test data. The E2E safety check refuses to use a database URL that matches `DATABASE_URL` or looks production-like.

Backend type check:

```bash
npm run check -w apps/server
```

Frontend lint:

```bash
npm run lint -w apps/web
```

Frontend build:

```bash
npm run build -w apps/web
```

Root quality command:

```bash
npm run check
```

Note: root `npm run check` runs builds and may write `dist` output. Avoid committing generated build output unless the project intentionally tracks it.

## What Is Covered

Current automated coverage checks:

- public landing route rendering
- protected-route Clerk loading and signed-out redirects
- onboarding-required protected-route redirects
- completed Admin and Staff application access states
- recovery-state handling for inconsistent onboarding responses
- clinic onboarding form validation, payload authority, loading, duplicate-submit, backend validation, network failure, retry, and sample-data decisions
- first-run setup checklist progress and accessibility
- Admin dashboard checklist integration and Staff dashboard omission
- frontend API client auth header, onboarding paths, serialization, structured errors, aborts, network failures, and base URL validation
- auth header validation
- Clerk/internal user middleware handoff
- Admin/Staff access helper behavior
- clinic access denial
- appointment creation workflow with no-show prediction
- appointment slot conflict behavior
- appointment list query validation for calendar dates
- appointment status access behavior
- queue no-show prediction response shape
- dashboard summaries and high-risk appointments
- dashboard backfill of missing predictions
- dashboard activity event building
- rule-based no-show risk scoring

## What Still Needs Verification For v0.2 Release

- Run all backend, frontend, and Playwright suites in a clean environment.
- Run frontend and backend production builds.
- Confirm deployed frontend public routes.
- Confirm deployed backend health and authenticated API behavior.
- Capture real screenshots listed in [v0.2 Assets](../assets/v0.2/README.md).
- Confirm no generated build output or reports are unintentionally committed.

## Known Test Gaps

- no committed CI deployment smoke test
- no OpenAPI contract test generated from route definitions
- no destructive E2E cleanup helper; current E2E uses unique test data and a dedicated test database
- backend lint script is still a placeholder

## Manual Test Checklist

Before a release or demo:

- open public landing page while signed out
- sign up through Clerk
- create a clinic through onboarding
- optionally provision sample data
- confirm first-run checklist state
- update Admin clinic settings
- sign in through Clerk
- confirm active clinic context loads
- list doctors
- create doctor
- edit doctor
- list patients
- create patient
- edit patient
- book appointment
- verify no-show prediction appears
- verify duplicate doctor/time conflict
- list today's queue
- update queue status
- manually reorder active queue entries
- update appointment status
- refresh dashboard
- verify high-risk appointments and activity feed
- sign out and confirm protected routes redirect to login

## Critical Flows Needing More Tests

- appointment final status conflict edge cases
- frontend active clinic fallback behavior
- build/deployment smoke checks

## Suggested Future Tests

- add integration tests with a test PostgreSQL database
- add safe targeted E2E cleanup for Clerk users and Pravaah records created by the current test run
- add API contract tests for response shapes
- add regression tests for generated no-show prediction response fields
