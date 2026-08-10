# Pravaah Roadmap

Current product scope and status taxonomy are defined in [Product Requirements](../PRD.md), with design detail in [High-Level Design](../HLD.md) and [Low-Level Design](../LLD.md). Use this roadmap for sequencing and future direction, not as proof that a capability is deployed.

## Release Status

| Track               | Status                                                         |
| ------------------- | -------------------------------------------------------------- |
| Stable release      | `v0.1.0` - MVP complete, deployed, and frozen                  |
| Active release      | `v0.3.0` - release candidate, production verification pending  |
| Active scope source | [V0.3_RELEASE_CHARTER.md](../releases/V0.3_RELEASE_CHARTER.md) |
| v0.1 freeze record  | [V0_1_0_MVP_FREEZE.md](../releases/V0_1_0_MVP_FREEZE.md)       |

The MVP roadmap is complete. This file tracks the frozen v0.1 baseline, historical v0.2 candidate work, active v0.3 release preparation, and later post-v0.3 work.

## Completed Stages

| Stage                    | Status                          | Evidence                                                                                  |
| ------------------------ | ------------------------------- | ----------------------------------------------------------------------------------------- |
| Monorepo foundation      | Complete                        | Root `package.json` workspaces for `apps/web`, `apps/server`, `packages/*`.               |
| Frontend scaffold        | Complete                        | `apps/web` React + TypeScript + Vite app with Tailwind and routing.                       |
| Backend scaffold         | Complete                        | `apps/server/src/app.ts`, `server.ts`, config, middleware, utilities.                     |
| Prisma/PostgreSQL schema | Complete for MVP                | `apps/server/prisma/schema.prisma` models nine MVP entities.                              |
| Auth integration         | Complete for protected MVP APIs | Clerk frontend, Clerk Express middleware, internal user mapping.                          |
| Core backend APIs        | Complete for MVP spine          | Auth, clinics, doctors, patients, appointments, queues, dashboard.                        |
| Starter no-show scoring  | Complete as rule-based MVP      | `prediction.service.ts`, storage in `NoShowPrediction`, dashboard backfill.               |
| Frontend core screens    | Complete for frozen v0.1 scope  | Dashboard, doctors, patients, appointments, queue, login; known UI gaps remain v0.2 work. |
| Backend tests            | Partial but meaningful          | Vitest coverage for auth, appointments, queue, prediction, dashboard, validation.         |

## Historical v0.2 Candidate Scope In Dependency Order

| Order | Issue                                                    | Depends on         |
| ----- | -------------------------------------------------------- | ------------------ |
| 1     | Freeze MVP and initialize v0.2                           | None               |
| 2     | Define v0.2 scope in documentation                       | 1                  |
| 3     | Add public landing page and public routes                | 1, 2               |
| 4     | Enable Clerk sign-up flow                                | 3                  |
| 5     | Separate Clerk identity from internal authorization      | 1, 2               |
| 6     | Add onboarding status API                                | 5                  |
| 7     | Create clinic and Admin transactionally                  | 5, 6               |
| 8     | Prevent orphan clinic creation                           | 7                  |
| 9     | Build first-time clinic onboarding UI                    | 6, 7, 8            |
| 10    | Provision isolated sample clinic data                    | 7, 8               |
| 11    | Add onboarding-aware application routing                 | 6, 9               |
| 12    | Build functional clinic settings page                    | 7, 11              |
| 13    | Add first-run setup checklist                            | 9, 10, 11, 12      |
| 14    | Harden public onboarding APIs                            | 7, 8               |
| 15    | Add backend onboarding tests                             | 6, 7, 8, 10, 14    |
| 16    | Add frontend onboarding tests and manual workflow checks | 9, 11, 12, 13      |
| 17    | Publish v0.2 documentation and demo assets               | 15, 16, 18, 19, 20 |
| 18    | Add doctor edit workflow                                 | 5                  |
| 19    | Add patient edit workflow                                | 5                  |
| 20    | Add queue reorder controls                               | 5                  |

Dependency summary:

```txt
Freeze/scope -> public entry -> sign-up
Freeze/scope -> identity split -> onboarding status -> transactional bootstrap -> orphan prevention -> API hardening
Onboarding status/bootstrap -> onboarding UI -> onboarding-aware routing -> settings/checklist
Workflow completion -> doctor edit, patient edit, queue reorder
Verification -> backend tests, frontend tests, and manual onboarding workflow checks
Publication -> docs, demo assets, release notes
```

Implementation for these issue areas is present in the source tree and carried into the v0.3 release candidate. Release publication still depends on the owner running the full v0.3 verification checklist, confirming deployed URLs and SHAs, approving a GO decision, and capturing real demo screenshots where needed.

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

## Post-v0.3 Roadmap

Keep these separate from the active v0.3 release unless a reviewed scope change moves them:

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
