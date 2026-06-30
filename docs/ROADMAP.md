# Pravaah Roadmap

## Current Reality

Pravaah has moved beyond planning docs into an implemented MVP codebase. The roadmap now tracks what is complete, what is partial, and what remains before a final MVP release.

Current stage as of June 30, 2026:

```txt
Deployment/docs/final release readiness
```

## Completed Stages

| Stage                    | Status                          | Evidence                                                                          |
| ------------------------ | ------------------------------- | --------------------------------------------------------------------------------- |
| Monorepo foundation      | Complete                        | Root `package.json` workspaces for `apps/web`, `apps/server`, `packages/*`.       |
| Frontend scaffold        | Complete                        | `apps/web` React + TypeScript + Vite app with Tailwind and routing.               |
| Backend scaffold         | Complete                        | `apps/server/src/app.ts`, `server.ts`, config, middleware, utilities.             |
| Prisma/PostgreSQL schema | Complete for MVP                | `apps/server/prisma/schema.prisma` models nine MVP entities.                      |
| Auth integration         | Complete for protected MVP APIs | Clerk frontend, Clerk Express middleware, internal user mapping.                  |
| Core backend APIs        | Complete for MVP spine          | Auth, clinics, doctors, patients, appointments, queues, dashboard.                |
| Starter no-show scoring  | Complete as rule-based MVP      | `prediction.service.ts`, storage in `NoShowPrediction`, dashboard backfill.       |
| Frontend core screens    | Mostly complete                 | Dashboard, doctors, patients, appointments, queue, login.                         |
| Backend tests            | Partial but meaningful          | Vitest coverage for auth, appointments, queue, prediction, dashboard, validation. |

## Current Stage

The current stage is release readiness:

- docs must match the codebase
- local setup must be reproducible
- deployment steps must be explicit without claiming a deployed production system
- known MVP gaps must be visible
- interviewer/contributor explanations must be code-backed

## Remaining MVP Tasks

| Task                                                        | Why it matters                                                               |
| ----------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Deploy frontend/backend/database or document chosen targets | The repo has build/start scripts but no production deployment proof.         |
| Add complete clinic settings UI                             | Backend clinic create/update exists; current frontend page is a placeholder. |
| Add doctor and patient edit screens                         | Backend update APIs exist; frontend currently has list/create.               |
| Decide whether to expose queue reorder in UI                | Backend reorder API exists; frontend does not expose it.                     |
| Add frontend tests or component-level smoke checks          | Current automated tests are backend-heavy.                                   |
| Add API smoke scripts or documented manual API collection   | Helpful for demos and regression checks.                                     |
| Capture screenshots/demo notes                              | README has no actual screenshots yet.                                        |

## Known Gaps

- No full multi-clinic membership model. MVP checks `User.clinicId`.
- No patient/doctor login.
- No notifications or reminder integrations.
- No trained ML.
- No audit log.
- No production monitoring/logging plan.
- No OpenAPI schema generated from routes.
- No pagination on list endpoints.
- Seed data is for local/demo use only.

## Post-MVP Roadmap

### Phase 1 - MVP Polish

- finish clinic settings UI
- add edit flows for doctors and patients
- surface queue reordering if needed by clinic workflow
- add more manual smoke scripts
- add frontend tests for critical pages

### Phase 2 - Operational Reliability

- audit log for key appointment/queue changes
- stronger transition rules for appointment and queue statuses
- pagination and sorting for larger records
- better production error logging
- deployment runbooks

### Phase 3 - Roles And Multi-Clinic Access

- `ClinicMember` or `UserClinic`
- role per clinic
- staff invite/management UI
- permission expansion beyond Admin/Staff

### Phase 4 - Communication

- reminder logs
- SMS/email/WhatsApp integrations
- patient confirmation links
- manual follow-up workflows for high-risk appointments

### Phase 5 - Smarter Risk And Analytics

- richer no-show history
- operational analytics
- trained ML only after collecting enough safe and relevant historical data
- explainability/audit fields for prediction versions

## Roadmap Discipline

Build from the implemented spine:

```txt
Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter no-show risk scoring
```

Do not describe completed code as future work, and do not describe future ideas as implemented features.
