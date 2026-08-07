# Workflow Implementation Audit

This audit records mismatches and important implementation discoveries found while creating the workflow atlas. Code evidence wins over older documentation or expected architecture.

## A. Documentation Says It Exists, Code Does Not

### Appointment operating hours and buffer enforcement

Expected/documented:
Appointment creation is expected to respect clinic opening/closing hours, slot duration, and buffer conflicts.

Actual implementation:
`appointment.service.ts -> createAppointment` validates clinic/doctor/patient ownership and exact same-time doctor conflicts. It does not enforce `Clinic.openingTime`, `closingTime`, `slotDurationMinutes`, or `bufferMinutes` during booking.

Evidence:
`apps/server/src/modules/appointments/appointment.service.ts`, `appointment.repository.ts -> findDoctorAppointmentAtTime`.

Resolution:
Atlas documents operating-hours and buffer checks as not implemented in the appointment workflow.

Remaining gap:
Separate product/engineering issue needed if these constraints are required.

### Strict backend appointment transition matrix

Expected/documented:
Some workflow docs describe natural appointment sequences.

Actual implementation:
Frontend offers a guided set of actions. Backend accepts any Zod-valid status for non-final appointments and blocks only changes away from final statuses.

Evidence:
`apps/web/src/features/appointments/AppointmentsPage.tsx -> statusActionsByCurrentStatus`; `apps/server/src/modules/appointments/appointment.validation.ts -> updateAppointmentStatusSchema`; `appointment.repository.ts -> finalAppointmentStatuses`.

Resolution:
Atlas separates frontend-offered transitions from backend-enforced rules.

Remaining gap:
Add backend state-machine enforcement if strict transitions are required.

### Automatic PatientClinic history counter updates

Expected/documented:
Patient attendance history appears as part of no-show risk and clinic-specific patient data.

Actual implementation:
`PatientClinic.totalAppointments`, `totalNoShows`, `totalLateArrivals`, and `lastVisitAt` exist and are read. Current appointment/queue status update code does not update those counters.

Evidence:
`apps/server/prisma/schema.prisma -> PatientClinic`; `appointment.repository.ts -> updateAppointmentStatus`; `queue.repository.ts -> updateQueueEntryStatus`.

Resolution:
Atlas records the counters as stored/read but not automatically maintained by lifecycle workflows.

Remaining gap:
Separate issue needed for automatic history maintenance.

## B. Code Exists But Documentation Was Too Shallow

### Advisory locks for booking and queue reorder

Expected/documented:
Older guidance warned not to claim advisory locks without proof.

Actual implementation:
Advisory transaction locks exist in appointment slot booking, queue position assignment, queue reorder, and sample data provisioning.

Evidence:
`appointment.repository.ts -> acquireAppointmentSlotLock`; `queue.repository.ts -> findHighestQueuePosition`, `acquireQueueScopeLock`; `clinic.repository.ts -> tryAcquireSampleDataProvisioningLock`.

Resolution:
Atlas documents exact lock scopes and does not generalize them to unrelated workflows.

Remaining gap:
Settings updates, doctor/patient creation duplicate detection, and dashboard reads have no broad transaction isolation claims.

### Dashboard prediction backfill side effect

Expected/documented:
Dashboard is commonly described as read-only operational data.

Actual implementation:
Summary and high-risk dashboard service methods call `backfillMissingNoShowPredictions`, which can create missing `NoShowPrediction` rows.

Evidence:
`apps/server/src/modules/dashboard/dashboard.service.ts -> getDashboardSummary`, `getHighRiskAppointments`, `backfillMissingNoShowPredictions`; `dashboard.repository.ts -> createNoShowPredictions`.

Resolution:
Atlas records dashboard backfill as a read-endpoint side effect.

Remaining gap:
Consider moving this to explicit repair/maintenance if read endpoints must be side-effect free.

## C. Role Behavior Differences

### Clinic settings are Admin-only

Expected/documented:
Staff can use daily operations, but settings may be unclear in older high-level summaries.

Actual implementation:
Frontend route metadata has `allowedRoles: [UserRole.ADMIN]`, `ClinicSettingsPage` blocks non-Admin users, and backend settings routes use `requireAdminRole`.

Evidence:
`apps/web/src/routes/dashboardRoutes.tsx`; `ClinicSettingsPage.tsx`; `clinic.routes.ts`.

Resolution:
Atlas documents Staff cannot access settings.

Remaining gap:
No Staff management/invite UI exists.

## D. Database Model Differences And Future-Ready Fields

### DoctorClinic and PatientClinic are real, but multi-clinic UI is not

Expected/documented:
Schema supports link rows.

Actual implementation:
Doctor and patient creation always creates a new base record and one clinic link. There is no UI/API to link an existing doctor or patient to another clinic.

Evidence:
`doctor.repository.ts -> createDoctorWithClinicLink`; `patient.repository.ts -> createPatientWithClinicLink`.

Resolution:
Atlas documents the link model without claiming multi-clinic workflows.

Remaining gap:
Future multi-clinic sharing requires separate workflows and authorization review.

## E. Release-Status Mismatch

Expected/documented:
Some docs discuss deployment shape and release candidates.

Actual implementation:
Repository has Vercel SPA rewrite config and deployment docs, but no verified production URLs or deployed commit SHA evidence.

Evidence:
`apps/web/vercel.json`; `docs/guides/DEPLOYMENT.md`; root README release status.

Resolution:
Atlas uses `IMPLEMENTED_NOT_RELEASED` for implemented source workflows.

Remaining gap:
Owner must run release verification and record deployment evidence.

## F. Test Evidence Missing

Expected/documented:
Core backend and frontend workflows have meaningful tests.

Actual implementation:
Many tests exist, but not every page/module has dedicated coverage. Notably there is no `AppointmentsPage.test.tsx`, no `ClinicSettingsPage.test.tsx`, and no backend patient service/repository test file in the current tree.

Evidence:
Current `apps/server/src/modules/**/__tests__` and `apps/web/src/**/*.test.tsx` file inventory.

Resolution:
Atlas lists tests only where files exist.

Remaining gap:
Add focused tests for appointment page behavior, clinic settings page behavior, and patient backend service/repository behavior if needed.

## G. Duplicate Or Contradictory Documentation

Expected/documented:
Existing `docs/product/WORKFLOWS.md`, interview workflow files, PRD/HLD/LLD, and architecture docs all discuss workflows at different depths.

Actual implementation:
Those docs are useful summaries but are not detailed enough to serve as code-trace source of truth.

Evidence:
Existing docs inventory and new atlas.

Resolution:
README and docs index now link to this atlas as the detailed implementation trace.

Remaining gap:
Avoid copying full atlas content back into PRD/HLD/LLD; keep links synchronized.
