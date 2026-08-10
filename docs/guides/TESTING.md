# Testing

Testing expectations and release gates should stay aligned with [Product Requirements](../PRD.md) and [High-Level Design](../HLD.md). This guide documents available checks; it does not prove they passed unless a specific run is recorded.

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

Root:

- `npm run check` runs build and lint across workspaces.

Browser-based end-to-end testing is not part of the current repository. Pravaah currently focuses automated testing on frontend behavior, backend business logic, and API-level behavior where implemented. Complete browser-driven workflow verification is performed manually for the current release. A maintainable browser E2E automation suite is deferred until a future version.

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

## v0.3 Production Verification

Owner-reported production verification for v0.3.0 is recorded in [Release Identity](../releases/RELEASE_IDENTITY.md) and [v0.3 Release Notes](../releases/V0_3_0_RELEASE_NOTES.md). Fresh Clerk signup, onboarding, clinic provisioning, Admin flow, Staff authorization, cross-clinic rejection, doctor, patient, appointment, no-show assistance, queue, manual reorder, dashboard, database connectivity, migrations, backend health, and production smoke were reported as PASS.

## Future Release Verification Checklist

- Run backend and frontend automated suites in a clean environment.
- Run frontend and backend production builds.
- Confirm deployed frontend public routes.
- Confirm deployed backend health and authenticated API behavior.
- Complete the manual workflow verification checklist below.
- Capture real screenshots using the current asset/screenshot guidance.
- Confirm no generated build output or reports are unintentionally committed.

## Known Test Gaps

- no committed CI deployment smoke test
- no OpenAPI contract test generated from route definitions
- no browser-based E2E suite in the current repository
- backend lint script is still a placeholder

## Browser E2E Scope Decision

Pravaah currently uses frontend, backend, and API-level automated tests where implemented. Browser-based end-to-end testing is intentionally deferred to a future release.

Current advantages:

- smaller test setup
- lower maintenance overhead
- easier ownership and explanation
- focus on business rules and API behavior
- no fragile browser-auth setup

Current limitations:

- full browser workflows are not automatically regression-tested
- authentication redirects and cross-screen integration require manual checks
- production smoke testing carries more importance
- UI integration regressions may be detected later

Future direction:

- reintroduce browser E2E tests when the owner is ready to understand and maintain them
- begin with a small critical-path suite
- avoid testing every UI detail
- cover authentication, onboarding, appointment booking, queue operations, and one authorization denial flow first

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
- add API contract tests for response shapes
- add regression tests for generated no-show prediction response fields
- reintroduce a focused browser-based E2E suite in a future release after the testing strategy, test identities, data isolation, and ownership expectations are fully understood
