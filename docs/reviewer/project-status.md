# Project Status Dashboard

This is the canonical reviewer-facing status dashboard for Pravaah. Keep implementation state separate from deployment/release state.

Status vocabulary:

| Type           | Values                                                                                                                  |
| -------------- | ----------------------------------------------------------------------------------------------------------------------- |
| Implementation | `IMPLEMENTED`, `PARTIALLY_IMPLEMENTED`, `IN_DEVELOPMENT`, `PLANNED`, `DOCUMENTED_NOT_IMPLEMENTED`, `NEEDS_VERIFICATION` |
| Deployment     | `DEPLOYED`, `NOT_YET_RELEASED`, `LOCAL_ONLY`, `PREVIEW_ONLY`, `NOT_APPLICABLE`, `NEEDS_VERIFICATION`                    |

Repository evidence as of this documentation pass: source code, docs, owner-provided production URLs, deployed SHAs, and production smoke-check results are recorded for v0.3.0. Source-backed product areas covered by owner production verification are marked with deployment `DEPLOYED`; areas still requiring specialized evidence keep `NEEDS_VERIFICATION` or their narrower implementation status.

## Dashboard

| Area                     | Implementation status   | Deployment status | Evidence                                                                                                                                    | Known limitations                                                                                                     |
| ------------------------ | ----------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Authentication           | `IMPLEMENTED`           | `DEPLOYED`        | `apps/server/src/modules/auth`, `apps/web/src/app/ApiAuthProvider.tsx`, owner-reported Clerk signup/onboarding PASS                         | Clerk verifies identity; internal Pravaah user still required for operational access.                                 |
| Internal user resolution | `IMPLEMENTED`           | `DEPLOYED`        | `auth.repository.ts`, `access.service.ts`, owner-reported Admin/Staff authorization PASS                                                    | Signed-in identities without internal users enter onboarding or error states.                                         |
| Authorization            | `IMPLEMENTED`           | `DEPLOYED`        | `auth.middleware.ts`, protected route files, owner-reported Staff authorization and cross-clinic rejection PASS                             | Admin/Staff only; no fine-grained permission matrix.                                                                  |
| Clinic scoping           | `IMPLEMENTED`           | `DEPLOYED`        | `access.service.ts`, `schema.prisma`, owner-reported cross-clinic rejection PASS                                                            | Current user has one active `clinicId`; no multi-clinic switching UI.                                                 |
| Onboarding               | `IMPLEMENTED`           | `DEPLOYED`        | `auth.routes.ts`, `ClinicOnboardingPage.tsx`, owner-reported fresh-user onboarding PASS                                                     | Recovery path is informational; no self-service repair UI.                                                            |
| Clinic provisioning      | `IMPLEMENTED`           | `DEPLOYED`        | `auth.repository.ts`, `auth.service.ts`, owner-reported clinic provisioning PASS                                                            | Creates first Admin only; no invite/staff-management UI.                                                              |
| First-run clinic setup   | `IMPLEMENTED`           | `DEPLOYED`        | `FirstRunSetupChecklist.tsx`, `auth.repository.ts`, owner-reported onboarding/dashboard PASS                                                | Checklist is guidance/status, not a hard workflow gate.                                                               |
| Clinic settings          | `IMPLEMENTED`           | `DEPLOYED`        | `ClinicSettingsPage.tsx`, `clinic.routes.ts`, owner-reported Admin flow PASS                                                                | Admin-only; appointment booking does not enforce all settings such as hours/buffer.                                   |
| Doctor management        | `IMPLEMENTED`           | `DEPLOYED`        | `apps/web/src/features/doctors`, `apps/server/src/modules/doctors`, owner-reported doctor flow PASS                                         | Updating a doctor changes the shared `Doctor` row after checking clinic linkage.                                      |
| Patient management       | `IMPLEMENTED`           | `DEPLOYED`        | `apps/web/src/features/patients`, `apps/server/src/modules/patients`, owner-reported patient flow PASS                                      | Patient history counters exist but are not automatically maintained by lifecycle updates.                             |
| Appointment management   | `IMPLEMENTED`           | `DEPLOYED`        | `AppointmentsPage.tsx`, `appointment.service.ts`, owner-reported appointment flow PASS                                                      | Exact doctor same-time conflict is checked; opening hours, slot duration, and buffer enforcement are not implemented. |
| Appointment lifecycle    | `PARTIALLY_IMPLEMENTED` | `DEPLOYED`        | `appointment.repository.ts`, owner-reported appointment flow PASS                                                                           | Backend blocks changes away from final states, but does not enforce a complete transition matrix.                     |
| Queue management         | `IMPLEMENTED`           | `DEPLOYED`        | `QueuePage.tsx`, `queue.service.ts`, owner-reported queue workflow PASS                                                                     | Queue status sync has conflict handling, but no audit log of manual decisions.                                        |
| Queue reordering         | `IMPLEMENTED`           | `DEPLOYED`        | `QueuePage.tsx`, `queue.repository.ts`, owner-reported manual reorder PASS                                                                  | Reorder must include all active entries for one doctor/date; no automatic queue optimization.                         |
| No-show assistance       | `IMPLEMENTED`           | `DEPLOYED`        | `prediction.service.ts`, risk UI components, owner-reported no-show assistance PASS                                                         | Deterministic rules only; no trained model, accuracy metric, automatic cancellation, or automatic queue priority.     |
| Dashboard                | `IMPLEMENTED`           | `DEPLOYED`        | `DashboardOverviewPage.tsx`, `dashboard.service.ts`, owner-reported dashboard PASS                                                          | Some dashboard reads can backfill missing prediction rows.                                                            |
| Public experience        | `IMPLEMENTED`           | `DEPLOYED`        | `PublicLandingPage.tsx`, auth pages, production frontend URL in [Release Identity](../releases/RELEASE_IDENTITY.md)                         | Actual calendar release date and GitHub Release URL are not provided.                                                 |
| Error/fallback states    | `IMPLEMENTED`           | `DEPLOYED`        | `ProtectedAppShell.tsx`, `NotFoundPage.tsx`, `errorHandler.ts`, owner-reported production smoke PASS                                        | Recovery states require admin/project-owner action.                                                                   |
| Responsive behavior      | `NEEDS_VERIFICATION`    | `DEPLOYED`        | [Frontend responsive audit](../audits/FRONTEND_RESPONSIVE_PERFORMANCE_AUDIT.md), production frontend URL                                    | Browser screenshot evidence is not committed.                                                                         |
| Accessibility            | `PARTIALLY_IMPLEMENTED` | `DEPLOYED`        | Frontend components and audit docs                                                                                                          | No full accessibility audit report or automated a11y suite.                                                           |
| SEO/metadata             | `IMPLEMENTED`           | `DEPLOYED`        | `RouteMetadata.tsx`, `siteMetadata.ts`, `sitemap.xml`, `robots.txt`                                                                         | SPA metadata is route-managed; no server-side rendering.                                                              |
| Backend validation       | `IMPLEMENTED`           | `DEPLOYED`        | `validateRequest.ts`, module validation files, owner-reported product/API smoke PASS                                                        | Validation coverage varies by module.                                                                                 |
| Transactions             | `IMPLEMENTED`           | `DEPLOYED`        | `auth.repository.ts`, `appointment.repository.ts`, `queue.repository.ts`, owner-reported migration/product smoke PASS                       | Transactions protect selected multi-write workflows, not every possible race.                                         |
| Concurrency protection   | `PARTIALLY_IMPLEMENTED` | `DEPLOYED`        | Appointment and queue advisory-lock scopes in repositories, owner-reported appointment/queue/manual reorder PASS                            | Advisory locks exist for selected scopes; no broad serializability claim.                                             |
| Testing                  | `PARTIALLY_IMPLEMENTED` | `DEPLOYED`        | [Testing Guide](../guides/TESTING.md), backend `__tests__`, frontend `*.test.tsx`, owner-reported production smoke PASS                     | No browser E2E suite; notable page/service coverage gaps remain.                                                      |
| Documentation            | `IMPLEMENTED`           | `NOT_APPLICABLE`  | [Documentation Index](../README.md), [Workflow Atlas](../workflows/README.md), [Release Identity](../releases/RELEASE_IDENTITY.md)          | Documentation can drift; status dashboard should be updated with code changes.                                        |
| Deployment               | `IMPLEMENTED`           | `DEPLOYED`        | [Deployment Guide](../guides/DEPLOYMENT.md), [vercel.json](../../apps/web/vercel.json), [Release Identity](../releases/RELEASE_IDENTITY.md) | Production frontend/backend URLs, deployed SHAs, and owner smoke-check results are recorded in Release Identity.      |

## Workflow Notes

The normal clinic flow currently supported and owner-verified in production for v0.3.0 is:

```txt
Clinic setup
-> Doctor and patient records
-> Appointment booking
-> Queue entry creation
-> Arrival / waiting / called / completed / cancelled / no-show status updates
-> Dashboard review
```

No-show assistance is generated during appointment creation and can also be backfilled by dashboard reads. It stores a `NoShowPrediction` row with risk level, score, and reasons. Staff remain responsible for any operational decision.

## Release Rule

Do not mark a feature `DEPLOYED` until this repository records the relevant deployment evidence: URL, provider context, deployed commit SHA or release reference, and smoke-check result.
