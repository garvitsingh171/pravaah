# Workflows

Current product authority: [Product Requirements](../PRD.md). Current system-design authority: [High-Level Design](../HLD.md) and [Low-Level Design](../LLD.md). Detailed code-trace authority: [Workflow Atlas](../workflows/README.md).

This document summarizes implemented product flows. For exact component, handler, API client, middleware, validation, controller, service, repository, Prisma, transaction, concurrency, response, and UI-state evidence, use the workflow atlas.

## Sign In And Load App

| Step             | Current implementation                                                                                                   |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------ |
| User action      | Admin/Staff visits a protected route or `/login`.                                                                        |
| Frontend         | `LoginPage`, `ProtectedAppShell`, `ActiveClinicProvider`.                                                                |
| API              | `GET /api/auth/me`.                                                                                                      |
| Backend          | `auth.routes.ts` -> `authenticateRequest` -> `auth.controller.ts` -> `auth.service.ts` -> `auth.repository.ts`.          |
| Database         | `User`, optional related `Clinic`.                                                                                       |
| Important errors | `AUTHENTICATION_REQUIRED`, `INVALID_AUTH_TOKEN`, `INTERNAL_USER_NOT_FOUND`, `USER_NOT_ACTIVE`, `CLINIC_CONTEXT_MISSING`. |

Manual checklist:

- sign in through Clerk
- confirm `/api/auth/me` returns an ACTIVE internal user
- confirm the app resolves a clinic and loads dashboard

## Public Sign-Up And Onboarding

| Step             | Current implementation                                                                                            |
| ---------------- | ----------------------------------------------------------------------------------------------------------------- |
| User action      | Public visitor opens `/`, signs up through `/sign-up/*`, then continues to `/onboarding/clinic`.                  |
| Frontend         | `PublicLandingPage`, `SignUpPage`, `ProtectedAppShell`, `ClinicOnboardingPage`, onboarding API helpers.           |
| API              | `GET /api/auth/onboarding-status`, `POST /api/auth/onboarding/clinic`, `POST /api/clinics/:clinicId/sample-data`. |
| Backend          | Identity-only auth middleware, auth onboarding controller/service/repository, clinic sample data service.         |
| Database         | Transactional `Clinic` plus first `User`, optional fake clinic-scoped records.                                    |
| Important errors | `INTERNAL_USER_NOT_FOUND` on normal APIs, `CLINIC_SLUG_ALREADY_EXISTS`, `CLINIC_PROVISIONING_CONFLICT`.           |

Manual checklist:

- open the public landing page without a session
- sign up with Clerk
- confirm onboarding status is `NOT_STARTED`
- create a clinic and become the first active Admin
- choose whether to provision sample data
- confirm dashboard access after onboarding

## Internal User Mapping

| Step             | Current implementation                                           |
| ---------------- | ---------------------------------------------------------------- |
| User action      | Seed local demo data with a Clerk user ID.                       |
| Frontend         | Uses Clerk token after sign-in.                                  |
| API              | Any protected endpoint.                                          |
| Backend          | `authService.getActiveUserByClerkUserId`.                        |
| Database         | `User.clerkUserId`, `User.status`, `User.role`, `User.clinicId`. |
| Important errors | `INTERNAL_USER_NOT_FOUND`, `USER_NOT_ACTIVE`.                    |

Manual checklist:

- set `SEED_CLERK_USER_ID`
- run `npm run seed:demo`
- sign in as that Clerk user
- confirm no internal-user error appears

## Create Doctor

| Step             | Current implementation                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| User action      | Open `/doctors/new`, submit doctor form.                                                       |
| Frontend         | `DoctorCreatePage`, `DoctorForm`, `doctorApi.createDoctor`.                                    |
| API              | `POST /api/clinics/:clinicId/doctors`.                                                         |
| Backend          | `doctor.routes.ts` -> `doctor.controller.ts` -> `doctor.service.ts` -> `doctor.repository.ts`. |
| Database         | `Doctor`, `DoctorClinic`.                                                                      |
| Important errors | `CLINIC_ACCESS_DENIED`, `CLINIC_NOT_FOUND`, `VALIDATION_ERROR`.                                |

Manual checklist:

- create a doctor with `fullName`
- verify it appears on `/doctors`
- verify `DoctorClinic` link exists

## Edit Doctor

| Step             | Current implementation                                                                         |
| ---------------- | ---------------------------------------------------------------------------------------------- |
| User action      | Open `/doctors`, choose an existing doctor, edit fields in the list-page panel, save changes.  |
| Frontend         | `DoctorsPage`, `DoctorForm`, `doctorApi.updateDoctor`.                                         |
| API              | `PATCH /api/clinics/:clinicId/doctors/:doctorId`.                                              |
| Backend          | `doctor.routes.ts` -> `doctor.controller.ts` -> `doctor.service.ts` -> `doctor.repository.ts`. |
| Database         | `Doctor`, `DoctorClinic`.                                                                      |
| Important errors | `DOCTOR_NOT_FOUND`, `DOCTOR_NOT_LINKED_TO_CLINIC`, `CLINIC_ACCESS_DENIED`, `VALIDATION_ERROR`. |

Manual checklist:

- edit a doctor name or specialty
- save
- confirm the updated doctor remains scoped to the same clinic

## Create Patient

| Step             | Current implementation                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| User action      | Open `/patients/new`, submit patient form.                                                         |
| Frontend         | `PatientCreatePage`, `PatientForm`, `patientApi.createPatient`.                                    |
| API              | `POST /api/clinics/:clinicId/patients`.                                                            |
| Backend          | `patient.routes.ts` -> `patient.controller.ts` -> `patient.service.ts` -> `patient.repository.ts`. |
| Database         | `Patient`, `PatientClinic`.                                                                        |
| Important errors | `CLINIC_ACCESS_DENIED`, `CLINIC_NOT_FOUND`, `VALIDATION_ERROR`.                                    |

Manual checklist:

- create a patient with name and phone
- add optional distance for scoring context
- verify it appears on `/patients`
- verify `PatientClinic` link exists

## Edit Patient

| Step             | Current implementation                                                                             |
| ---------------- | -------------------------------------------------------------------------------------------------- |
| User action      | Open `/patients`, choose an existing patient, edit fields in the list-page panel, save changes.    |
| Frontend         | `PatientsPage`, `PatientForm`, `patientApi.updatePatient`.                                         |
| API              | `PATCH /api/clinics/:clinicId/patients/:patientId`.                                                |
| Backend          | `patient.routes.ts` -> `patient.controller.ts` -> `patient.service.ts` -> `patient.repository.ts`. |
| Database         | `Patient`, `PatientClinic`.                                                                        |
| Important errors | `PATIENT_NOT_FOUND`, `PATIENT_NOT_LINKED_TO_CLINIC`, `CLINIC_ACCESS_DENIED`, `VALIDATION_ERROR`.   |

Manual checklist:

- edit patient contact or clinic history fields
- save
- confirm `PatientClinic` fields such as notes or distance are preserved correctly

## Book Appointment

| Step             | Current implementation                                                                                             |
| ---------------- | ------------------------------------------------------------------------------------------------------------------ |
| User action      | Open `/appointments`, fill booking form, submit.                                                                   |
| Frontend         | `AppointmentsPage`, `AppointmentBookingForm`, `appointmentApi.createAppointment`.                                  |
| API              | `POST /api/clinics/:clinicId/appointments`.                                                                        |
| Backend          | `appointment.routes.ts` -> `appointment.controller.ts` -> `appointment.service.ts` -> `appointment.repository.ts`. |
| Database         | `Clinic`, `Doctor`, `DoctorClinic`, `Patient`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`.   |
| Important errors | `DOCTOR_NOT_LINKED_TO_CLINIC`, `PATIENT_NOT_LINKED_TO_CLINIC`, `APPOINTMENT_SLOT_CONFLICT`, `VALIDATION_ERROR`.    |

Manual checklist:

- choose active doctor and patient
- book a valid time
- verify response includes appointment, queue entry, and prediction
- attempt same doctor/time again and expect `APPOINTMENT_SLOT_CONFLICT`

## Generate No-Show Prediction

| Step             | Current implementation                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------- |
| Trigger          | Appointment creation; dashboard backfill for older active appointments.                               |
| Frontend         | Displays risk on appointments, queue, dashboard.                                                      |
| API              | Included in appointment/queue/dashboard responses; no standalone prediction route.                    |
| Backend          | `prediction.service.ts`, called by appointments and dashboard services.                               |
| Database         | `NoShowPrediction`.                                                                                   |
| Important errors | Prediction itself is deterministic; surrounding workflow errors come from appointment/dashboard APIs. |

Scoring factors:

- previous no-shows
- late-arrival history
- distance from clinic
- short-notice booking
- long-advance booking
- new-patient history
- strong attendance history

Manual checklist:

- create patients with different history/distance
- book appointments
- verify LOW/MEDIUM/HIGH risk and reasons appear
- verify suggested actions are advisory only

## Create/List Queue

| Step             | Current implementation                                                                     |
| ---------------- | ------------------------------------------------------------------------------------------ |
| User action      | Book an appointment, then open `/queue`.                                                   |
| Frontend         | `QueuePage`, `queueApi.listTodayQueue`.                                                    |
| API              | `GET /api/clinics/:clinicId/queue?date=YYYY-MM-DD`.                                        |
| Backend          | `queue.routes.ts` -> `queue.controller.ts` -> `queue.service.ts` -> `queue.repository.ts`. |
| Database         | `QueueEntry`, `Appointment`, `Doctor`, `Patient`, `NoShowPrediction`.                      |
| Important errors | `CLINIC_ACCESS_DENIED`, `VALIDATION_ERROR`.                                                |

Manual checklist:

- book today's appointment
- open `/queue`
- verify the entry appears with position and risk
- verify future appointments do not appear in today's queue

## Update Queue Status

| Step             | Current implementation                                                                    |
| ---------------- | ----------------------------------------------------------------------------------------- |
| User action      | Select a queue status action on `/queue`.                                                 |
| Frontend         | `QueuePage`, `queueApi.updateQueueStatus`.                                                |
| API              | `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status`.                                |
| Backend          | `queue.controller.ts` -> `queue.service.ts` -> `queue.repository.updateQueueEntryStatus`. |
| Database         | `QueueEntry`, synchronized `Appointment`.                                                 |
| Important errors | `QUEUE_ENTRY_NOT_FOUND`, `QUEUE_ENTRY_FINAL_STATUS`, `STATUS_SYNC_CONFLICT`.              |

Manual checklist:

- mark waiting entry as called
- verify `calledAt` is set
- complete entry and verify `completedAt` is set
- try to change a final status and expect a conflict

## Reorder Queue

| Step             | Current implementation                                                                           |
| ---------------- | ------------------------------------------------------------------------------------------------ |
| User action      | Use manual move controls on `/queue` for active entries.                                         |
| Frontend         | `QueuePage`, `queueApi.reorderQueue`.                                                            |
| API              | `PATCH /api/clinics/:clinicId/queue/reorder`.                                                    |
| Backend          | `queue.controller.ts` -> `queue.service.reorderQueue` -> `queue.repository.reorderQueueEntries`. |
| Database         | `QueueEntry.position`.                                                                           |
| Important errors | `QUEUE_REORDER_INCOMPLETE`, `QUEUE_REORDER_INVALID_ENTRIES`, `QUEUE_REORDER_CONFLICT`.           |

Manual checklist:

- list active queue entries for a date
- send all active queue IDs in the desired order
- verify positions update to 1..n
- omit an active ID and expect `QUEUE_REORDER_INCOMPLETE`

## Clinic Settings

| Step             | Current implementation                                                                               |
| ---------------- | ---------------------------------------------------------------------------------------------------- |
| User action      | Admin opens `/clinic-settings`, edits supported clinic profile and operational fields, saves.        |
| Frontend         | Clinic settings route in the protected app, active clinic provider, clinic settings API helpers.     |
| API              | `GET /api/clinics/:clinicId`, `PATCH /api/clinics/:clinicId`.                                        |
| Backend          | `clinic.routes.ts` -> Admin role middleware -> clinic controller/service/repository.                 |
| Database         | `Clinic`.                                                                                            |
| Important errors | `ADMIN_REQUIRED`, `CLINIC_ACCESS_DENIED`, `CLINIC_NOT_FOUND`, `CLINIC_INACTIVE`, `VALIDATION_ERROR`. |

Manual checklist:

- sign in as Admin
- update a supported setting
- refresh and confirm the value persists
- verify Staff cannot save Admin-only settings

## Dashboard Summary

| Step             | Current implementation                                                                                     |
| ---------------- | ---------------------------------------------------------------------------------------------------------- |
| User action      | Open `/dashboard`.                                                                                         |
| Frontend         | `DashboardOverviewPage`, `dashboardApi`.                                                                   |
| API              | `/dashboard/summary`, `/dashboard/high-risk-appointments`, `/dashboard/today-activity`.                    |
| Backend          | `dashboard.routes.ts` -> `dashboard.controller.ts` -> `dashboard.service.ts` -> `dashboard.repository.ts`. |
| Database         | `Appointment`, `QueueEntry`, `NoShowPrediction`, `Doctor`, `Patient`.                                      |
| Important errors | `CLINIC_ACCESS_DENIED`, `VALIDATION_ERROR`.                                                                |

Manual checklist:

- book and update appointments
- refresh dashboard
- verify counts change
- verify high-risk list includes HIGH predictions only
- verify activity feed shows booking, queue, called, completed, cancelled, and no-show events where data exists
