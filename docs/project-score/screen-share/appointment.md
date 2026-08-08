# Appointment Screen-Share Runbook

Reliability status: `REQUIRES_SETUP`. You need a signed-in Admin/Staff user, an active clinic, at least one active linked doctor, and at least one active linked patient.

## Demo Steps

| Step | What to click/open | What to say | Expected output | Exact file | Follow-up | Recovery |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | Open `/appointments` | This is the protected appointment workspace. | Appointment list/form loads. | `apps/web/src/features/appointments/AppointmentsPage.tsx` | How is route protected? | If it redirects, show `ProtectedAppShell.tsx`. |
| 2 | Show doctor and patient selectors | Booking requires clinic-linked doctor and patient. | Select options visible. | `AppointmentBookingForm.tsx` | What if unlinked? | Show service `DOCTOR_NOT_LINKED_TO_CLINIC`/`PATIENT_NOT_LINKED_TO_CLINIC`. |
| 3 | Enter date/time, duration, source, notes | Frontend collects fields; backend is authority. | Submit enabled if local checks pass. | `AppointmentBookingForm.tsx -> handleSubmit` delegates to `onSubmit`. | Does frontend validation replace Zod? | Say no; show backend schema. |
| 4 | Submit | `AppointmentsPage` owns the async submit, validates form state, then calls the typed API helper. | Network request to `/api/clinics/:clinicId/appointments`. | `AppointmentsPage.tsx -> handleSubmit`, `appointmentApi.ts -> createAppointment` | How is clinic ID encoded? | Show `encodeURIComponent`. |
| 5 | Open Network request | Clerk token is sent as Bearer token. | Authorization header present if signed in. | `apiClient.ts -> request` | What if token missing? | Show auth runbook 401 case. |
| 6 | Open backend route | Route runs auth, validation, clinic access, role, then controller. | Middleware order is visible. | `appointment.routes.ts` | Why order matters? | Explain reject before service mutation. |
| 7 | Open Zod schema | Request body is parsed and validated. | Invalid body returns `VALIDATION_ERROR`. | `appointment.validation.ts -> createAppointmentSchema` | What about invalid UUID? | Show params/body schema. |
| 8 | Open controller | Controller delegates to service and returns 201 envelope. | `success: true`, appointment/queue/risk. | `appointment.controller.ts -> createAppointmentController` | Why controller thin? | Service owns business rules. |
| 9 | Open service ownership checks | Service validates clinic, doctor, patient, and links. | Errors for missing/inactive/unlinked records. | `appointment.service.ts -> validateAppointmentClinicOwnership` | Why link tables? | Open ER runbook. |
| 10 | Show conflict handling | Active doctor/time conflict is rejected. | 409 `APPOINTMENT_SLOT_CONFLICT`. | `appointment.service.ts`, `appointment.repository.ts`, slot unique migration. | Duration overlap? | Say current check is exact time, not duration overlap. |
| 11 | Show transaction | Appointment, queue entry, and prediction write together. | All commit or rollback together. | `appointment.repository.ts -> runInTransaction` | What if queue write fails? | Transaction rolls back appointment write. |
| 12 | Show advisory lock | Slot/position operations are serialized by scope. | `pg_advisory_xact_lock` query. | `appointment.repository.ts -> acquireAppointmentSlotLock`, `queue.repository.ts` | Does lock prevent all races? | No; it protects designed scopes. |
| 13 | Show Prisma models | Appointment links clinic/doctor/patient/user/queue/prediction. | Schema relationships visible. | `schema.prisma -> Appointment`, `QueueEntry`, `NoShowPrediction`. | Why FK `Restrict`? | Preserve historical records. |
| 14 | Show result in UI | Appointment appears with queue/risk data. | New record and risk explanation visible. | `AppointmentsPage.tsx`, `RiskExplanation.tsx` | Does risk take action? | No, advisory only. |

## Failure Recovery

| Failure | What to do | What to say | Evidence instead |
| --- | --- | --- | --- |
| No sample doctor/patient | Create records first or use sample-data flow. | The booking workflow requires linked records by design. | `DoctorClinic`, `PatientClinic` schema and service checks. |
| Conflict error | Keep the error; it proves conflict handling. | This is expected when the doctor already has that exact active slot. | `APPOINTMENT_SLOT_CONFLICT` code path. |
| Auth failure | Switch to auth runbook. | The backend is rejecting unauthenticated access correctly. | `auth.middleware.ts`. |
| Backend unavailable | Use code trace and docs. | I cannot complete live mutation, so I will show the exact route/service/repository path. | Workflow atlas and files above. |
