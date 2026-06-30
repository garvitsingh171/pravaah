# Testing

## Current Test Tooling

Backend:

- Vitest is configured in `apps/server`.
- Tests use `vitest run`.

Frontend:

- No frontend test runner is configured beyond TypeScript build and ESLint.

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

- end-to-end browser flows
- frontend component rendering
- frontend route protection tests
- frontend form validation tests
- integration tests against a real database
- auth integration against real Clerk tokens
- deployment smoke tests in CI
- queue reorder tests in depth
- clinic create/update tests
- doctor/patient service tests

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
- frontend API error rendering
- build/deployment smoke checks

## Suggested Future Tests

- add integration tests with a test PostgreSQL database
- add React Testing Library for key pages/forms
- add Playwright smoke tests for sign-in mocked flow or local Clerk-compatible test mode
- add API contract tests for response shapes
- add regression tests for generated no-show prediction response fields
