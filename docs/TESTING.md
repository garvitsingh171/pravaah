# Testing

## Current Test Tooling

Backend:

- Vitest is configured in `apps/server`.
- Tests use `vitest run`.

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

| Area         | Files                                                                                                                       |
| ------------ | --------------------------------------------------------------------------------------------------------------------------- |
| Auth/access  | `auth.middleware.test.ts`, `access.service.test.ts`                                                                         |
| Appointments | `appointment.service.test.ts`, `appointment.controller.test.ts`, `appointment.validation.test.ts`                           |
| Queue        | `queue.service.test.ts`                                                                                                     |
| Predictions  | `prediction.service.test.ts`                                                                                                |
| Dashboard    | `dashboard.service.test.ts`, `dashboard.controller.test.ts`, `dashboard.repository.test.ts`, `dashboard.validation.test.ts` |

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

## What Is Not Covered

- integration tests against a real database
- deployment smoke tests in CI
- queue reorder tests in depth
- clinic create/update tests
- doctor/patient service tests
- E2E cleanup is currently collision-resistant through unique test data, but there is no committed destructive cleanup helper.

## Manual Test Checklist

Before a release or demo:

- sign in through Clerk
- confirm active clinic context loads
- list doctors
- create doctor
- list patients
- create patient
- book appointment
- verify no-show prediction appears
- verify duplicate doctor/time conflict
- list today's queue
- update queue status
- update appointment status
- refresh dashboard
- verify high-risk appointments and activity feed
- sign out and confirm protected routes redirect to login

## Critical Flows Needing More Tests

- clinic create/update authorization
- doctor update
- patient update including `PatientClinic` fields
- queue reorder success and failure paths
- appointment final status conflict edge cases
- frontend active clinic fallback behavior
- build/deployment smoke checks

## Suggested Future Tests

- add integration tests with a test PostgreSQL database
- add safe targeted E2E cleanup for Clerk users and Pravaah records created by the current test run
- add API contract tests for response shapes
- add regression tests for generated no-show prediction response fields
