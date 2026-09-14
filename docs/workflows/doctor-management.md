# Doctor Management

## Workflow Summary

| Field                 | Evidence                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | List, create, edit, activate/deactivate doctor records, and manage recurring weekly availability                                                                |
| Product status        | Implemented                                                                                                                                                     |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                      |
| Actor                 | Active internal `ADMIN` or `STAFF`                                                                                                                              |
| Entry route           | `/doctors`, `/doctors/new`; doctor selector in `/appointments`                                                                                                  |
| Frontend files        | `apps/web/src/features/doctors/DoctorsPage.tsx`, `DoctorCreatePage.tsx`, `DoctorForm.tsx`, `doctorApi.ts`                                                       |
| Main frontend symbols | `DoctorsPage`, `loadDoctors`, `DoctorEditPanel`, `handleStatusActionConfirm`, `DoctorCreatePage`, `handleSubmit`, `listDoctors`, `createDoctor`, `updateDoctor` |
| API endpoint          | `GET /api/clinics/:clinicId/doctors`, `POST /api/clinics/:clinicId/doctors`, `PATCH /api/clinics/:clinicId/doctors/:doctorId`, `GET/PUT /api/clinics/:clinicId/doctors/:doctorId/availability` |
| Middleware            | `authenticateRequest`, `validateRequest`, `requireClinicAccess`, `requireClinicStaffRole`                                                                       |
| Authentication        | Clerk token plus active internal user required                                                                                                                  |
| Authorization         | Admin and Staff both allowed                                                                                                                                    |
| Clinic scoping        | Clinic route param checked by `requireClinicAccess`; service checks `DoctorClinic` link for update                                                              |
| Validation            | `doctor.validation.ts -> createDoctorSchema`, `updateDoctorSchema`, `replaceDoctorAvailabilitySchema`, params schemas                                           |
| Controller            | `doctor.controller.ts -> create/list/update doctor controllers`, `getDoctorAvailabilityController`, `replaceDoctorAvailabilityController`                        |
| Service               | `doctor.service.ts -> createDoctor`, `listDoctorsByClinic`, `updateDoctor`, `getDoctorAvailability`, `replaceDoctorAvailability`                                |
| Repository            | `doctor.repository.ts -> createDoctorWithClinicLink`, `findDoctorLinksByClinicId`, `updateDoctor`, availability read/replace                                    |
| Database models       | `Doctor`, `DoctorClinic`, `DoctorAvailabilityPeriod`, `Clinic`, plus appointment/queue references elsewhere                                                     |
| Prisma operations     | `clinic.findUnique`, `doctor.create`, `doctorClinic.create/findMany`, `doctor.update`, `doctorAvailabilityPeriod.findMany/deleteMany/createMany`                 |
| Transaction           | Create wraps `Doctor` and `DoctorClinic`; availability replacement deletes/inserts periods atomically                                                           |
| Concurrency control   | No explicit duplicate doctor lock. `DoctorClinic` has `@@unique([doctorId, clinicId])`, but create always creates a new `Doctor`                                |
| State changes         | Doctor row and clinic link; frontend refetches list after edit/status changes                                                                                   |
| Errors                | `CLINIC_NOT_FOUND`, `DOCTOR_NOT_FOUND`, `DOCTOR_NOT_LINKED_TO_CLINIC`, `VALIDATION_ERROR`, availability/clinic-hours validation errors                          |
| Tests                 | `doctor.validation.test.ts`, `DoctorsPage.test.tsx`                                                                                                             |
| Known gaps            | No doctor login. `DoctorClinic` has `displayName` and `consultationFee` fields, but normal doctor UI/API does not edit them. Appointment booking does not yet enforce weekly availability |

## Create Doctor Trace

```text
User opens /doctors/new
    ↓
DoctorCreatePage -> DoctorForm
    ↓
DoctorForm -> handleSubmit(event) -> props.onSubmit()
    ↓
DoctorCreatePage -> handleSubmit()
    ↓
validateDoctorForm()
    ↓
toCreateDoctorRequest()
    ↓
doctorApi.createDoctor(clinicId, payload)
    ↓
POST /api/clinics/:clinicId/doctors
    ↓
authenticateRequest -> validateRequest(params, body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
doctor.controller.ts -> createDoctorController()
    ↓
doctor.service.ts -> createDoctor()
    ↓
doctor.repository.ts -> findClinicById()
    ↓
doctor.repository.ts -> createDoctorWithClinicLink()
    ↓
prisma.$transaction
    ↓
tx.doctor.create(...)
    ↓
tx.doctorClinic.create({ doctorId, clinicId, isActive: true })
    ↓
201 { doctor }
    ↓
DoctorCreatePage navigates to /doctors with statusMessage
```

## List And Edit Trace

```text
/doctors
    ↓
DoctorsPage -> loadDoctors()
    ↓
doctorApi.listDoctors(clinicId)
    ↓
GET /api/clinics/:clinicId/doctors
    ↓
doctor.service.ts -> listDoctorsByClinic()
    ↓
doctor.repository.ts -> findDoctorLinksByClinicId()
    ↓
prisma.doctorClinic.findMany({ where: { clinicId }, select: { doctor } })
    ↓
service maps doctorClinicId and clinicLinkIsActive into doctor summaries
```

```text
User edits doctor or toggles status
    ↓
DoctorsPage -> DoctorEditPanel.handleSubmit()
or DoctorsPage -> handleStatusActionConfirm()
    ↓
doctorApi.updateDoctor(clinicId, doctor.id, payload)
    ↓
PATCH /api/clinics/:clinicId/doctors/:doctorId
    ↓
doctor.service.ts -> updateDoctor()
    ↓
find clinic, find doctor, find DoctorClinic link
    ↓
doctor.repository.ts -> updateDoctor()
    ↓
prisma.doctor.update({ where: { id: doctorId } })
    ↓
DoctorsPage refreshes list via loadDoctors()
```

## DoctorClinic Relationship

`DoctorClinic` links a doctor record to a clinic. Current code uses it for clinic-scoped listing, appointment eligibility, and future-ready schema separation. In current product behavior, doctor creation always creates a brand-new `Doctor` and one active link. Multi-clinic doctor sharing is not exposed by UI/API.

## How To Explain This Workflow

Doctor records are clinic-operational data, not authenticated doctor accounts. Creating a doctor atomically creates the doctor and its clinic link. Updating a doctor first proves the doctor is linked to the active clinic, then updates the doctor row.

## Weekly Availability

Recurring weekly availability belongs to `DoctorClinic`, not the global `Doctor` row. This keeps the schedule clinic-specific and future-ready for doctors linked to more than one clinic. `DoctorAvailabilityPeriod` rows store one working window for one weekday. No row for a weekday means no recurring availability that day.

Availability periods use clinic-local wall-clock `HH:mm` strings. They are not UTC instants and do not use fake calendar dates. The API response includes the clinic timezone from `Clinic.timezone` so the frontend can label the schedule correctly.

All seven weekdays are represented in the API response in Monday-through-Sunday order. A day can have zero periods or multiple periods, so split schedules such as `09:00-13:00` and `15:00-18:00` are supported. Intervals are interpreted as half-open `[startTime, endTime)`, so `09:00-12:00` followed by `12:00-15:00` is valid.

The weekly availability editor is loaded on demand when staff opens a specific doctor for editing. The doctors list does not issue one availability request per doctor.

## Load Availability Trace

```text
User opens doctor schedule editor
    ↓
GET /api/clinics/:clinicId/doctors/:doctorId/availability
    ↓
authenticateRequest -> validateRequest(params)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
doctor.service.ts -> getDoctorAvailability()
    ↓
verify clinic
    ↓
verify doctor
    ↓
verify DoctorClinic link
    ↓
load availability periods by doctorClinicId
    ↓
normalize seven-day response with timezone
    ↓
render editor
```

## Replace Availability Trace

```text
User edits weekly schedule
    ↓
frontend validates obvious HH:mm/order/overlap errors
    ↓
PUT /api/clinics/:clinicId/doctors/:doctorId/availability
    ↓
authenticateRequest -> validateRequest(params, full seven-day body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
doctor.service.ts -> replaceDoctorAvailability()
    ↓
verify clinic / doctor / DoctorClinic
    ↓
validate all periods are inside clinic opening/closing hours
    ↓
prisma.$transaction
    ↓
delete old periods for doctorClinicId
    ↓
insert normalized replacement periods
    ↓
re-read periods
    ↓
return normalized schedule
```

Saving weekly availability does not cancel appointments, reschedule appointments, change queue entries, update predictions, generate slots, or enforce booking availability. Those policies remain separate appointment-slot engine work.
