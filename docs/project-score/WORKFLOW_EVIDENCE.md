# Pravaah Workflow Evidence Map

| Field          | Value                                                                                                                             |
| -------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Issue          | #211                                                                                                                              |
| Status         | Documentation foundation                                                                                                          |
| Last reviewed  | 2026-08-02                                                                                                                        |
| Purpose        | Map real Pravaah workflows to implementation files and official Project Score concepts.                                           |
| Evidence basis | Source inspection only. Tests, localhost runtime, production smoke, and screenshots were not run during this documentation issue. |

Current product status and architecture authority live in [Product Requirements](../PRD.md) and [High-Level Design](../HLD.md). Evidence labels in this file are Project Score preparation labels, not release-status taxonomy.

## Evidence Status Values

| Status                      | Meaning                                                               |
| --------------------------- | --------------------------------------------------------------------- |
| Code inspected              | Source files, tests, or config were inspected.                        |
| Needs runtime verification  | Running browser/API behavior still needs proof.                       |
| Needs test execution        | Test files exist or are expected, but current output is not recorded. |
| Not implemented             | Repository inspection confirms the workflow is absent.                |
| Implementation gap recorded | A confirmed implementation gap is tracked in the v0.3 route audit.    |

## Workflow Inventory

| ID     | Workflow                              | Actor                  | Frontend entry route                    | API route or system boundary                                          | Main files                                                                                                    | Models                                                               | Transaction/concurrency boundary                                          | Response/state evidence                            | Related concepts               | Evidence status                                   |
| ------ | ------------------------------------- | ---------------------- | --------------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- | ------------------------------------------------------------------------- | -------------------------------------------------- | ------------------------------ | ------------------------------------------------- |
| WF-001 | Public landing and product entry      | Visitor                | `/`                                     | None                                                                  | `App.tsx`, `PublicLandingPage.tsx`                                                                            | None                                                                 | None                                                                      | Public CTA and copy; no protected API dependency   | PS-001, PS-008, PS-009         | Code inspected; needs runtime verification        |
| WF-002 | Sign-up                               | Visitor                | `/sign-up/*`                            | Clerk UI                                                              | `SignUpPage.tsx`, Clerk provider setup                                                                        | Clerk-owned                                                          | Clerk-owned                                                               | Clerk component and safe redirect helper           | PS-001, PS-008, PS-035, PS-058 | Code inspected; needs Clerk verification          |
| WF-003 | Sign-in                               | Visitor/Admin/Staff    | `/login/*`                              | Clerk UI                                                              | `LoginPage.tsx`, `ProtectedAppShell.tsx`                                                                      | Clerk-owned                                                          | Clerk-owned                                                               | Signed-in redirect behavior                        | PS-001, PS-008, PS-035, PS-058 | Code inspected; needs Clerk verification          |
| WF-004 | Sign-out                              | Admin/Staff            | App shell/topbar                        | Clerk frontend session                                                | `Topbar.tsx`, Clerk hooks                                                                                     | Clerk-owned                                                          | Clerk-owned                                                               | Sign-out control exists in shell-related UI        | PS-035, PS-058                 | Code inspected; needs runtime verification        |
| WF-005 | Protected-route access                | Admin/Staff            | `/dashboard` and app routes             | `GET /api/auth/onboarding-status`, `GET /api/auth/me`                 | `ProtectedAppShell.tsx`, `ActiveClinicProvider.tsx`, `authApi.ts`, `auth.middleware.ts`                       | `User`, `Clinic`                                                     | Read-only                                                                 | Loading, recovery, redirect, and app-shell states  | PS-003, PS-004, PS-017, PS-034 | Code inspected; needs runtime verification        |
| WF-006 | Onboarding-status resolution          | Clerk identity         | `/onboarding/clinic`, protected guard   | `GET /api/auth/onboarding-status`                                     | `auth.routes.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`                               | `User`, `Clinic`                                                     | Read-only                                                                 | `NOT_STARTED`, `COMPLETED`, recovery states        | PS-013, PS-014, PS-016, PS-017 | Code inspected; tests exist                       |
| WF-007 | Clinic and initial Admin provisioning | Clerk identity         | `/onboarding/clinic`                    | `POST /api/auth/onboarding/clinic`                                    | `ClinicOnboardingPage.tsx`, `onboardingApi.ts`, `auth.validation.ts`, `auth.service.ts`, `auth.repository.ts` | `Clinic`, `User`                                                     | Prisma transaction for clinic plus first Admin                            | Success, replay, validation, conflict states       | PS-015, PS-025, PS-030, PS-031 | Code inspected; tests exist                       |
| WF-008 | Duplicate onboarding request          | Clerk identity         | `/onboarding/clinic`                    | `POST /api/auth/onboarding/clinic`                                    | `auth.service.ts`, `auth.repository.ts`, onboarding tests                                                     | `Clinic`, `User`                                                     | Unique constraints plus completed-account reread                          | `ALREADY_COMPLETED`/safe conflict behavior         | PS-014, PS-031, PS-036         | Code inspected; tests exist                       |
| WF-009 | Lost-response recovery                | Clerk identity         | `/onboarding/clinic`                    | `POST /api/auth/onboarding/clinic`, `GET /api/auth/onboarding-status` | `auth.service.ts`, onboarding page/tests                                                                      | `Clinic`, `User`                                                     | Reread by trusted Clerk identity                                          | Retry/recovery states                              | PS-003, PS-014, PS-031         | Code inspected; tests exist                       |
| WF-010 | First-run clinic setup                | Admin                  | `/dashboard`                            | `GET /api/auth/onboarding-status`, dashboard APIs                     | `DashboardOverviewPage.tsx`, `FirstRunSetupChecklist.tsx`, dashboard module                                   | `Clinic`, `Doctor`, `Patient`, `Appointment`                         | Read-only counts and dashboard reads                                      | Checklist states                                   | PS-004, PS-028, PS-030         | Code inspected; needs runtime verification        |
| WF-011 | Clinic settings update                | Admin                  | `/clinic-settings`                      | `GET/PATCH /api/clinics/:clinicId`                                    | `ClinicSettingsPage.tsx`, `clinicApi.ts`, clinic routes/controller/service/repository/validation              | `Clinic`                                                             | Single update                                                             | Loading, validation, success, API error            | PS-006, PS-007, PS-015, PS-034 | Code inspected; needs Staff/Admin verification    |
| WF-012 | Doctor creation                       | Admin/Staff            | `/doctors/new`                          | `POST /api/clinics/:clinicId/doctors`                                 | `DoctorCreatePage.tsx`, `DoctorForm.tsx`, doctor backend module                                               | `Doctor`, `DoctorClinic`                                             | Repository workflow; transaction evidence should be checked when changing | Form success/error states                          | PS-006, PS-015, PS-025, PS-030 | Code inspected; needs runtime verification        |
| WF-013 | Doctor editing                        | Admin/Staff            | `/doctors`                              | `PATCH /api/clinics/:clinicId/doctors/:doctorId`                      | `DoctorsPage.tsx`, `doctorApi.ts`, doctor backend module                                                      | `Doctor`, `DoctorClinic`                                             | Single workflow update                                                    | Edit panel, validation, success/error              | PS-006, PS-007, PS-034         | Code inspected; tests exist                       |
| WF-014 | Doctor activation or deactivation     | Admin/Staff            | `/doctors`                              | `PATCH /api/clinics/:clinicId/doctors/:doctorId`                      | `DoctorsPage.tsx`, doctor validation/service                                                                  | `Doctor`, `DoctorClinic`                                             | Single workflow update                                                    | Active/inactive handling where supported           | PS-006, PS-034                 | Code inspected; needs runtime verification        |
| WF-015 | Patient creation                      | Admin/Staff            | `/patients/new`                         | `POST /api/clinics/:clinicId/patients`                                | `PatientCreatePage.tsx`, `PatientForm.tsx`, patient backend module                                            | `Patient`, `PatientClinic`                                           | Repository workflow; transaction evidence should be checked when changing | Form success/error states                          | PS-006, PS-015, PS-025, PS-030 | Code inspected; needs runtime verification        |
| WF-016 | Patient editing                       | Admin/Staff            | `/patients`                             | `PATCH /api/clinics/:clinicId/patients/:patientId`                    | `PatientsPage.tsx`, `patientApi.ts`, patient backend module                                                   | `Patient`, `PatientClinic`                                           | Single workflow update                                                    | Edit panel, history fields, success/error          | PS-006, PS-007, PS-034         | Code inspected; tests exist                       |
| WF-017 | Patient activation or deactivation    | Admin/Staff            | `/patients`                             | `PATCH /api/clinics/:clinicId/patients/:patientId`                    | `PatientsPage.tsx`, patient validation/service                                                                | `Patient`, `PatientClinic`                                           | Single workflow update                                                    | Active/inactive handling where supported           | PS-006, PS-034                 | Code inspected; needs runtime verification        |
| WF-018 | Appointment listing                   | Admin/Staff            | `/appointments`                         | `GET /api/clinics/:clinicId/appointments`                             | `AppointmentsPage.tsx`, `appointmentApi.ts`, appointment backend module                                       | `Appointment`, `Doctor`, `Patient`, `QueueEntry`, `NoShowPrediction` | Read-only with filters/order                                              | Loading, empty, populated, error states            | PS-004, PS-028, PS-030         | Code inspected; needs runtime verification        |
| WF-019 | Appointment filtering                 | Admin/Staff            | `/appointments`                         | `GET /api/clinics/:clinicId/appointments` with query                  | `AppointmentsPage.tsx`, `appointment.validation.ts`, repository                                               | `Appointment`                                                        | Read-only                                                                 | Filter UI and validation                           | PS-004, PS-015, PS-028         | Code inspected; tests exist                       |
| WF-020 | Appointment booking                   | Admin/Staff            | `/appointments`                         | `POST /api/clinics/:clinicId/appointments`                            | `AppointmentBookingForm.tsx`, `appointment.service.ts`, `appointment.repository.ts`, `prediction.service.ts`  | `Appointment`, `QueueEntry`, `NoShowPrediction`                      | Prisma transaction and advisory locks for conflict/position               | Appointment, queue entry, prediction response      | PS-014, PS-025, PS-030, PS-031 | Code inspected; tests exist                       |
| WF-021 | Appointment conflict handling         | Admin/Staff            | `/appointments`                         | `POST /api/clinics/:clinicId/appointments`                            | `appointment.service.ts`, active slot unique index migration, tests                                           | `Appointment`                                                        | Advisory lock and database unique index                                   | Conflict AppError                                  | PS-014, PS-027, PS-031, PS-036 | Code inspected; tests exist                       |
| WF-022 | Appointment status lifecycle          | Admin/Staff            | `/appointments`                         | `PATCH /api/appointments/:appointmentId/status`                       | `AppointmentsPage.tsx`, appointment service/repository/validation                                             | `Appointment`, `QueueEntry`                                          | Prisma transaction syncs appointment/queue                                | Final-state protection exists                      | PS-014, PS-031, PS-034         | Implementation gap recorded: F-001                |
| WF-023 | Final appointment status protection   | Admin/Staff            | `/appointments`                         | `PATCH /api/appointments/:appointmentId/status`                       | Appointment repository/service                                                                                | `Appointment`, `QueueEntry`                                          | Update checks final current status                                        | Final states cannot update                         | PS-014, PS-031                 | Code inspected; stricter transitions still gap    |
| WF-024 | Queue-entry creation                  | Admin/Staff            | `/appointments`, `/queue`               | Booking endpoint                                                      | `appointment.service.ts`, `queue.repository.ts`                                                               | `QueueEntry`, `Appointment`                                          | Booking transaction plus doctor/day position lock                         | Queue entry created at booking time                | PS-025, PS-031                 | Code inspected; tests exist                       |
| WF-025 | Queue listing                         | Admin/Staff            | `/queue`                                | `GET /api/clinics/:clinicId/queue`                                    | `QueuePage.tsx`, `queueApi.ts`, queue backend module                                                          | `QueueEntry`, `Appointment`, `NoShowPrediction`                      | Read-only                                                                 | Loading, empty, populated, filters                 | PS-004, PS-028, PS-030         | Code inspected; needs runtime verification        |
| WF-026 | Queue filtering                       | Admin/Staff            | `/queue`                                | `GET /api/clinics/:clinicId/queue` with query                         | `QueuePage.tsx`, `queue.validation.ts`, repository                                                            | `QueueEntry`                                                         | Read-only                                                                 | Date/status/doctor filters                         | PS-015, PS-028                 | Code inspected; needs runtime verification        |
| WF-027 | Queue status update                   | Admin/Staff            | `/queue`                                | `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status`             | `QueuePage.tsx`, `queue.service.ts`, `queue.repository.ts`                                                    | `QueueEntry`, `Appointment`                                          | Prisma transaction syncs queue and appointment                            | Final-state protection exists                      | PS-014, PS-031, PS-034         | Implementation gap recorded: F-006                |
| WF-028 | Appointment and queue synchronization | Admin/Staff            | `/appointments`, `/queue`               | Appointment and queue status endpoints                                | Appointment and queue repositories                                                                            | `Appointment`, `QueueEntry`                                          | Transactions sync mapped statuses                                         | Consistency intended; transition gaps tracked      | PS-031, PS-036                 | Code inspected; needs lifecycle fixes/tests       |
| WF-029 | Queue reordering                      | Admin/Staff            | `/queue`                                | `PATCH /api/clinics/:clinicId/queue/reorder`                          | `QueuePage.tsx`, `queue.service.ts`, `queue.repository.ts`                                                    | `QueueEntry`                                                         | Prisma transaction with two-phase position updates                        | Manual reorder controls                            | PS-031, PS-036                 | Implementation gap recorded: F-005                |
| WF-030 | Queue reorder conflict or rollback    | Admin/Staff            | `/queue`                                | `PATCH /api/clinics/:clinicId/queue/reorder`                          | `queue.service.ts`, `queue.repository.ts`, `QueuePage.test.tsx`                                               | `QueueEntry`                                                         | Transaction throws `QUEUE_REORDER_CONFLICT`                               | Retry-oriented error message                       | PS-014, PS-031                 | Code inspected; needs multi-doctor fix            |
| WF-031 | No-show risk calculation              | Backend during booking | `/appointments`                         | Booking service calls prediction service                              | `prediction.service.ts`, appointment service                                                                  | `PatientClinic`, `Appointment`, `NoShowPrediction`                   | Inside appointment creation transaction for storage                       | LOW/MEDIUM/HIGH with reasons and suggested actions | PS-028, PS-030, PS-031         | Code inspected; tests exist                       |
| WF-032 | Prediction storage                    | Backend                | `/appointments`                         | Booking endpoint and dashboard backfill                               | `NoShowPrediction` model, prediction/appointment/dashboard modules                                            | `NoShowPrediction`                                                   | Booking transaction; dashboard backfill where missing                     | Stored score, reasons, rule version                | PS-025, PS-030, PS-031         | Code inspected; tests exist                       |
| WF-033 | Risk display                          | Admin/Staff            | `/appointments`, `/queue`, `/dashboard` | Appointment/queue/dashboard APIs                                      | `AppointmentsPage.tsx`, `QueuePage.tsx`, `DashboardOverviewPage.tsx`                                          | `NoShowPrediction`                                                   | Read-only display                                                         | Advisory copy and badge text                       | PS-005, PS-009                 | Code inspected; needs runtime verification        |
| WF-034 | Dashboard summary                     | Admin/Staff            | `/dashboard`                            | Dashboard APIs                                                        | Dashboard frontend/API/backend modules                                                                        | `Appointment`, `QueueEntry`, `NoShowPrediction`                      | Read/backfill behavior                                                    | Summary cards, high-risk list, activity feed       | PS-028, PS-030                 | Code inspected; tests exist                       |
| WF-035 | Missing-prediction backfill           | Admin/Staff/backend    | `/dashboard`                            | Dashboard service                                                     | `dashboard.service.ts`, `prediction.service.ts`, dashboard tests                                              | `Appointment`, `NoShowPrediction`                                    | Service backfill behavior                                                 | Missing active predictions can be generated        | PS-030, PS-031                 | Code inspected; tests exist                       |
| WF-036 | Authentication middleware             | API caller             | Protected API                           | Bearer token through Clerk middleware                                 | `auth.middleware.ts`, `app.ts`, auth middleware tests                                                         | `User`                                                               | Read-only auth lookup                                                     | 401/invalid/missing/internal-user behavior         | PS-017, PS-033, PS-058         | Code inspected; tests exist                       |
| WF-037 | Role authorization                    | API caller             | Admin/Staff routes                      | Role middleware/services                                              | `access.service.ts`, `auth.middleware.ts`, route files                                                        | `User`, `Clinic`                                                     | Read-only access verification                                             | 403 for disallowed role                            | PS-034, PS-036                 | Code inspected; tests exist                       |
| WF-038 | Clinic isolation                      | API caller             | Clinic-scoped routes                    | `req.user.clinicId === req.params.clinicId`                           | `access.service.ts`, `requireClinicAccess`, appointment/queue service access checks                           | `User`, `Clinic`, resources                                          | Read-only verification before mutation                                    | Cross-clinic denial                                | PS-034, PS-036                 | Code inspected; needs API verification            |
| WF-039 | Request validation                    | API caller             | All validated routes                    | Zod via `validateRequest`                                             | `validateRequest.ts`, `*.validation.ts`, route files                                                          | Parsed request data                                                  | Before controller                                                         | `400 VALIDATION_ERROR` with details                | PS-015, PS-036                 | Code inspected; tests exist                       |
| WF-040 | Central error handling                | API caller             | API errors                              | `errorHandler`                                                        | `errorHandler.ts`, `AppError.ts`, services/controllers                                                        | Not applicable                                                       | After route/controller/service failure                                    | `{ success: false, error }` envelope               | PS-014, PS-016                 | Code inspected; tests partial                     |
| WF-041 | Frontend deployment                   | Owner/reviewer         | Vercel/static host                      | Vite build and SPA rewrite                                            | `apps/web/vercel.json`, root/web package scripts, deployment docs                                             | Not applicable                                                       | Build-time                                                                | Static frontend output                             | PS-010                         | Config inspected; production verification missing |
| WF-042 | Backend deployment                    | Owner/reviewer         | Render/Node host                        | Server build/start/migrate commands                                   | `apps/server/package.json`, `server.ts`, `env.ts`, deployment docs                                            | PostgreSQL database                                                  | Build/migration/runtime environment                                       | `/api/health` smoke expected                       | PS-019, PS-049                 | Config inspected; production verification missing |
| WF-043 | Test execution                        | Developer              | CLI                                     | Vitest                                                                | `docs/guides/TESTING.md`, frontend/backend test files, package scripts                                        | Test data                                                            | Unit/component/service/API-level test envs                                | Test output not recorded in this issue             | PS-050, PS-052                 | Tests inspected; not run                          |

## Important Workflow Chains

### Onboarding Chain

```txt
Public visitor
    -> Clerk sign-up or sign-in
    -> onboarding-status request
    -> trusted Clerk identity
    -> clinic provisioning
    -> initial Admin provisioning
    -> transaction commit
    -> first-run setup
    -> protected application
```

Implementation evidence:

- Frontend: `apps/web/src/App.tsx`, `ClinicOnboardingPage.tsx`, `onboardingApi.ts`, `ProtectedAppShell.tsx`
- Backend: `auth.routes.ts`, `auth.validation.ts`, `auth.controller.ts`, `auth.service.ts`, `auth.repository.ts`
- Models: `Clinic`, `User`
- Authentication: `authenticateClerkIdentity`
- Validation: `onboardingClinicSchema`
- Transaction boundary: `authRepository.createClinicWithAdmin`
- Tests: auth validation/service/controller/repository/routes tests and onboarding frontend tests

Likely viva questions:

- Why does onboarding allow a Clerk identity without an internal user?
- What prevents the frontend from choosing the first Admin role?
- What happens if clinic creation succeeds but Admin creation fails?
- How does duplicate onboarding avoid creating a second clinic?

Scaling limitation: current `User.clinicId` supports one active clinic per user; full multi-clinic membership would need a separate membership model.

### Appointment Chain

```txt
Booking form
    -> API request
    -> authentication
    -> validation
    -> clinic authorization
    -> controller
    -> service
    -> doctor and patient relationship checks
    -> conflict protection
    -> transaction
    -> appointment
    -> queue entry
    -> no-show prediction
    -> response
```

Implementation evidence:

- Frontend: `AppointmentsPage.tsx`, `AppointmentBookingForm.tsx`, `appointmentApi.ts`
- Backend: `appointment.routes.ts`, `appointment.validation.ts`, `appointment.controller.ts`, `appointment.service.ts`, `appointment.repository.ts`
- Models: `Appointment`, `QueueEntry`, `NoShowPrediction`, `DoctorClinic`, `PatientClinic`
- Transaction boundary: appointment creation transaction
- Lock/concurrency mechanism: advisory locks for slot conflict and queue position assignment
- Tests: appointment service/controller/validation tests

Failure cases:

- invalid request body
- unauthenticated request
- wrong clinic
- inactive/unlinked doctor or patient
- conflicting appointment slot
- transaction failure
- queue or prediction write failure

Current gap: stricter direct appointment status transition enforcement is tracked as F-001 in the route audit.

### Queue Chain

```txt
Appointment booking
    -> queue entry
    -> queue position
    -> WAITING
    -> CALLED
    -> COMPLETED
```

Implementation evidence:

- Frontend: `QueuePage.tsx`, `queueApi.ts`
- Backend: `queue.routes.ts`, `queue.validation.ts`, `queue.controller.ts`, `queue.service.ts`, `queue.repository.ts`
- Models: `QueueEntry`, `Appointment`, `NoShowPrediction`
- Transaction boundary: status sync and reorder transactions
- Concurrency mechanism: two-phase reorder update and conflict checks; booking position uses advisory lock
- Tests: queue service tests and frontend queue tests

Important status and scope notes:

- Queue entries are created during appointment booking, not on arrival.
- Queue positions are intended to be scoped by clinic, doctor, and clinic-local day.
- Current route audit records F-005: reorder uses clinic/day scope and can collapse multi-doctor positions.
- Current route audit records F-006: non-final queue status reversals are not fully blocked.
- Final queue statuses should not be reorderable.
- No-show risk must not automatically reorder queue entries.

### Authentication And Authorization Chain

```txt
Clerk verifies identity
    -> backend receives trusted Clerk identity
    -> internal Pravaah user is resolved
    -> user status is checked
    -> clinic access is checked
    -> role is checked where required
    -> resource operation is allowed or denied
```

Implementation evidence:

- Frontend: Clerk provider setup, auth pages, `ApiAuthProvider`, `apiClient`
- Backend: `app.ts`, `auth.middleware.ts`, `auth.service.ts`, `access.service.ts`
- Models: `User`, `Clinic`
- Validation: route-level Zod middleware where applicable
- Error behavior: `AUTHENTICATION_REQUIRED`, `INVALID_AUTH_TOKEN`, `INTERNAL_USER_NOT_FOUND`, `USER_NOT_ACTIVE`, role and clinic access errors

Security boundary:

- Clerk answers who is signed in.
- Pravaah answers whether that identity maps to an active internal user and clinic role.
- Frontend route hiding is not treated as authorization.

## Maintenance Rule

When workflow implementation changes, update source product/architecture docs first, then this workflow map, then the concept tracker, then simulation and interview docs.
