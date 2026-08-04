# Database Design

This database summary is derived from `apps/server/prisma/schema.prisma` and should stay aligned with [High-Level Design](../HLD.md). The HLD explains how the schema supports product workflows; this file remains the database-focused reference.

## Source Of Truth

The current schema source of truth is:

```txt
apps/server/prisma/schema.prisma
```

Historical migration files show how the schema evolved, but the current model definitions live in `schema.prisma`.

## Prisma Generator And Datasource

```prisma
generator client {
  provider = "prisma-client"
  output   = "../src/generated/prisma"
}

datasource db {
  provider = "postgresql"
}
```

`DATABASE_URL` is supplied by `apps/server/prisma.config.ts` and runtime database setup, not directly inside `schema.prisma`.

The generated Prisma client lives in `apps/server/src/generated/prisma` and is ignored from version control.

## Enums

| Enum                | Values                                                                                         |
| ------------------- | ---------------------------------------------------------------------------------------------- |
| `UserRole`          | `ADMIN`, `STAFF`                                                                               |
| `UserStatus`        | `INVITED`, `ACTIVE`, `SUSPENDED`                                                               |
| `Gender`            | `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`                                                 |
| `AppointmentStatus` | `SCHEDULED`, `CONFIRMED`, `ARRIVED`, `IN_QUEUE`, `CALLED`, `COMPLETED`, `CANCELLED`, `NO_SHOW` |
| `QueueStatus`       | `WAITING`, `ARRIVED`, `CALLED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`                            |
| `RiskLevel`         | `LOW`, `MEDIUM`, `HIGH`                                                                        |
| `BookingSource`     | `RECEPTION`, `PHONE`, `WEB`, `WALK_IN`                                                         |

## Models Overview

| Model              | Table                 | Purpose                                                   |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `Clinic`           | `clinics`             | Operational clinic boundary and settings.                 |
| `User`             | `users`               | Internal app user mapped to Clerk identity.               |
| `Doctor`           | `doctors`             | Doctor record; does not log in.                           |
| `DoctorClinic`     | `doctor_clinics`      | Join table linking doctors to clinics.                    |
| `Patient`          | `patients`            | Patient record; does not log in.                          |
| `PatientClinic`    | `patient_clinics`     | Join table with clinic-specific patient history.          |
| `Appointment`      | `appointments`        | Scheduled visit for clinic, doctor, patient, and creator. |
| `QueueEntry`       | `queue_entries`       | Daily queue position/status for an appointment.           |
| `NoShowPrediction` | `no_show_predictions` | Stored rule-based no-show risk result for an appointment. |

## Important Fields And Constraints

### Clinic

Important fields:

- `slug` unique
- contact/address fields
- `timezone`, default `Asia/Kolkata`
- `openingTime`, `closingTime`
- `slotDurationMinutes`, `bufferMinutes`
- `isActive`

Indexes:

- `isActive`
- `city`

Deletion behavior:

- Users set `clinicId` to null on clinic deletion.
- `DoctorClinic` and `PatientClinic` cascade from clinic.
- Appointments, queue entries, and predictions restrict deletion.

### User

Important fields:

- `clerkUserId` unique
- `email` unique
- `role`
- `status`
- `clinicId` optional MVP single-clinic access field

Indexes:

- `clinicId`
- `role`
- `status`

Why `User.clinicId` exists in MVP:

- It keeps access control simple for Admin/Staff users.
- Backend can verify one active clinic context quickly.
- It avoids adding a membership table before the MVP needs multi-clinic access.

Future improvement: add `ClinicMember` or `UserClinic` for multi-clinic users and role-per-clinic behavior.

v0.2 keeps `User.clerkUserId` unique. A single Clerk identity must not create duplicate internal users or bootstrap multiple clinics through the self-service onboarding path.

### Doctor

Important fields:

- identity/profile fields such as `fullName`, `specialization`, `qualification`
- optional `registrationNumber`, `phone`, `email`, `gender`, `experienceYears`
- `isActive`

Indexes:

- `isActive`
- `specialization`

Doctors are records only. They do not authenticate in the MVP.

### DoctorClinic

Important fields:

- `doctorId`
- `clinicId`
- `isActive`
- optional `displayName`
- optional `consultationFee`

Constraints and indexes:

- unique `(doctorId, clinicId)`
- index `doctorId`
- index `clinicId`
- index `isActive`

Deletion behavior:

- cascades when the linked Doctor or Clinic is deleted.

Why `DoctorClinic` exists:

- The MVP can use one clinic per doctor in practice.
- The data model still supports a doctor working with multiple clinics later.
- Clinic-specific doctor settings can live on the link instead of the global Doctor record.

### Patient

Important fields:

- `fullName`
- required `phone`
- optional email, gender, DOB, age, address, city, emergency contact
- `isActive`

Indexes:

- `phone`
- `fullName`
- `isActive`

Patients are records only. They do not authenticate in the MVP.

### PatientClinic

Important fields:

- `patientId`
- `clinicId`
- `totalAppointments`
- `totalNoShows`
- `totalLateArrivals`
- `lastVisitAt`
- `notes`
- `distanceFromClinicKm`
- `isActive`

Constraints and indexes:

- unique `(patientId, clinicId)`
- index `clinicId`
- index `patientId`
- index `isActive`

Deletion behavior:

- cascades when the linked Patient or Clinic is deleted.

Why `PatientClinic` exists:

- A patient can be known to more than one clinic in the future.
- Attendance history and distance are clinic-specific.
- No-show scoring should use the patient's history at the current clinic, not global assumptions.

### Appointment

Important fields:

- `clinicId`
- `doctorId`
- `patientId`
- `createdByUserId`
- `scheduledAt`
- `durationMinutes`
- `status`
- `bookingSource`
- optional `reason`, `notes`

Indexes:

- `(clinicId, scheduledAt)`
- `(clinicId, doctorId, scheduledAt)`
- `(clinicId, patientId, scheduledAt)`
- `(clinicId, status)`
- partial unique index from migration: `(clinicId, doctorId, scheduledAt)` for active statuses `SCHEDULED`, `CONFIRMED`, `ARRIVED`, `IN_QUEUE`, `CALLED`

Deletion behavior:

- restricts deletion of linked Clinic, Doctor, Patient, and User.

Appointment lifecycle:

```txt
SCHEDULED -> CONFIRMED -> ARRIVED -> IN_QUEUE -> CALLED -> COMPLETED
                              \         \          \          \
                               -> CANCELLED or NO_SHOW where staff decides
```

The code allows several manual transitions through service rules and blocks changing final statuses to a different status.

### QueueEntry

Important fields:

- `appointmentId` unique
- `clinicId`, `doctorId`, `patientId`
- `position`
- `status`
- `queuedAt`, `calledAt`, `completedAt`

Indexes:

- `(clinicId, status)`
- `(clinicId, doctorId, position)`
- `(clinicId, queuedAt)`

Deletion behavior:

- restricts deletion of linked Clinic, Appointment, Doctor, and Patient.

QueueEntry lifecycle:

```txt
WAITING -> ARRIVED -> CALLED -> COMPLETED
    \         \          \
     -> CANCELLED or NO_SHOW where staff decides
```

The appointment creation workflow currently creates a `QueueEntry` immediately, including for future appointments. Queue list APIs filter by the appointment's clinic-local date.

### NoShowPrediction

Important fields:

- `appointmentId` unique
- `clinicId`
- `patientId`
- `riskLevel`
- `score`
- `reasons` JSON

Indexes:

- `clinicId`
- `patientId`

Deletion behavior:

- restricts deletion of linked Appointment, Clinic, and Patient.

Storage notes:

- The database stores score, risk level, and JSON reasons.
- The response layer adds `suggestedActions`, `modelVersion = starter-rule-v1`, and `generatedAt` from `createdAt`.
- There is no separate model version column in the current schema.

## Relationships

```txt
Clinic 1 -> many User
Clinic many <-> many Doctor through DoctorClinic
Clinic many <-> many Patient through PatientClinic
Clinic 1 -> many Appointment
Doctor 1 -> many Appointment
Patient 1 -> many Appointment
User 1 -> many Appointment as createdBy
Appointment 1 -> 0/1 QueueEntry
Appointment 1 -> 0/1 NoShowPrediction
Clinic 1 -> many QueueEntry
Clinic 1 -> many NoShowPrediction
Patient 1 -> many NoShowPrediction
```

## Transaction-Sensitive Workflows

### Doctor Creation

`doctorRepository.createDoctorWithClinicLink` creates:

1. `Doctor`
2. `DoctorClinic`

inside one transaction.

### Patient Creation

`patientRepository.createPatientWithClinicLink` creates:

1. `Patient`
2. `PatientClinic`

inside one transaction.

### Appointment Booking

`appointmentService.createAppointment` validates clinic, doctor, patient, and active links, then inside a transaction:

1. obtains a PostgreSQL advisory lock for the doctor/time slot
2. checks active slot conflicts
3. obtains queue position lock and next queue position
4. creates `Appointment`
5. creates `QueueEntry`
6. creates `NoShowPrediction`

### Status Updates

Appointment status updates synchronize matching queue status where applicable.

Queue status updates synchronize matching appointment status.

Both paths guard against final-status conflicts and return conflict errors when data changes mid-update.

### Dashboard Prediction Backfill

Dashboard summary and high-risk endpoints backfill missing predictions for active appointments on the selected clinic-local date before reading risk summaries.

### v0.2 Clinic And First Admin Bootstrap

Self-service clinic onboarding must create:

1. `Clinic`
2. first internal `User` for that clinic

inside one Prisma transaction.

Consistency rules:

- `User.clerkUserId` remains unique.
- `Clinic.slug` remains unique.
- The first user is created with server-controlled `role = ADMIN`, `status = ACTIVE`, and `clinicId = newly created clinic`.
- Failures must roll back all related writes.
- Completed retries return the existing completed user and clinic summaries without creating, updating, or reassigning records.
- Existing inconsistent users require recovery and cannot create another clinic through onboarding.
- Unique conflicts during onboarding are resolved by re-reading the current Clerk identity before returning an idempotent replay or safe conflict.
- Onboarding must not leave an orphan clinic without an active owning Admin.
- Client-provided role, status, clinic ownership, user ID, or Clerk user ID must be ignored or rejected.
- Clinic ownership and role assignment are server-controlled.
- The ordinary `POST /api/clinics` path is disabled so it cannot create standalone clinic records.

Prefer deriving onboarding state from the existing `User` and `Clinic` relationship. Do not add an `Onboarding` table unless a future implementation issue proves durable onboarding-step persistence is required.

### v0.2 Isolated Sample Data

Optional onboarding sample data must be:

- fake and clearly demo-oriented
- linked only to the newly created clinic
- created only after the clinic and first Admin exist
- unable to reference another clinic's doctors, patients, appointments, queue entries, or predictions
- retry-safe so repeated requests do not duplicate the whole sample dataset

Production seed data and demo assets must never include real patient data.

## Seed/Demo Data Notes

`apps/server/prisma/seed.ts` creates demo-only data:

- demo family clinic
- Admin and Staff internal users
- doctors and doctor-clinic links
- patients and patient-clinic history
- appointments across several dates
- today's queue entries
- stored no-show predictions

The seed uses placeholder contact data. Never replace it with real patient data.

## Future Schema Improvements

- `ClinicMember` or `UserClinic` for multi-clinic user access
- audit logs for appointment/queue changes
- doctor availability and schedules
- pagination-friendly indexes for large lists
- no-show prediction version/history table
- reminder logs and notification preferences
- stricter status transition tables if workflow complexity grows

## What Not To Change Casually

- Do not remove `DoctorClinic` or `PatientClinic`.
- Do not move authorization truth into the frontend.
- Do not edit applied migrations casually.
- Do not hard-delete operational records without checking history and foreign keys.
- Do not add patient/doctor auth tables during the MVP or v0.2 without a product decision.
- Do not add an `Onboarding` table during v0.2 documentation work.
