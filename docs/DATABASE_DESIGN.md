<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah Database Design

## 1. Purpose

This document explains the database strategy for Pravaah.

It should guide:

- Prisma schema design
- PostgreSQL table modeling
- migrations
- indexing
- relationships
- future database evolution
- interview explanation of database decisions

The database model is important because Pravaah is not a static website. It is a workflow product. Bad relationships can make the future codebase painful.

## 2. Final database stack

| Part                   | Choice                             |
| ---------------------- | ---------------------------------- |
| Database               | PostgreSQL                         |
| Hosting                | Neon PostgreSQL                    |
| ORM                    | Prisma                             |
| Migration strategy     | Prisma migrations                  |
| Schema source of truth | `apps/server/prisma/schema.prisma` |

Supabase is not part of the MVP database stack.

## 3. Why PostgreSQL fits Pravaah

Pravaah manages structured relationships:

- clinics have users
- clinics have doctors through clinic membership
- clinics have patients through clinic membership
- doctors and patients participate in appointments
- appointments produce queue entries
- appointments can have no-show predictions

These are relational problems.

PostgreSQL fits because it supports:

- joins
- foreign keys
- unique constraints
- transactions
- indexing
- reliable schema evolution
- reporting and analytics later

## 4. Final MVP entities

The MVP database model uses these entities:

1. User
2. Clinic
3. Doctor
4. DoctorClinic
5. Patient
6. PatientClinic
7. Appointment
8. QueueEntry
9. NoShowPrediction

## 5. Important modeling decision

### 5.1 Do not directly lock Doctor to one Clinic

Avoid this as the final direction:

```txt
Doctor
- id
- clinicId
```

This makes a doctor belong to only one clinic.

Better:

```txt
Doctor
DoctorClinic
Clinic
```

This supports:

- one doctor working in one clinic during MVP
- one doctor working in multiple clinics later
- clinic-specific doctor settings later

### 5.2 Do not directly lock Patient to one Clinic

Avoid this as the final direction:

```txt
Patient
- id
- clinicId
```

This makes a patient belong to only one clinic.

Better:

```txt
Patient
PatientClinic
Clinic
```

This supports:

- one patient visiting one clinic during MVP
- one patient visiting multiple clinics later
- clinic-specific patient history
- clinic-specific no-show and late-arrival counts

### 5.3 User membership is an intentional MVP simplification

For MVP, `User` can be kept simple because only Admin and Staff use the app.

Possible MVP approach:

- User has one active clinic context.
- Admin/Staff permissions are simple.

Future approach:

- Add a `UserClinic` or `ClinicMember` table if multi-clinic user access becomes necessary.

Do not add `UserClinic` in the MVP unless the product requirement changes. The current MVP entity list is intentionally limited to 9 entities.

## 6. Relationship overview

```txt
User ─────────────── Clinic
                       |
                       | 1 to many through DoctorClinic
                       v
Doctor ───── DoctorClinic ───── Clinic

Patient ──── PatientClinic ──── Clinic

Clinic ───── Appointment ───── Doctor
   |              |
   |              └──────────── Patient
   |
   └──── QueueEntry

Appointment ───── NoShowPrediction
```

## 7. Entity details

## 7.1 User

Represents an authenticated clinic-side app user.

### Responsibility

- map Clerk authentication to internal application user
- store Admin/Staff profile data
- support backend role checks
- track who created or updated records

### Suggested fields

| Field       | Type         | Notes                                                         |
| ----------- | ------------ | ------------------------------------------------------------- |
| id          | uuid/string  | Internal database ID.                                         |
| clerkUserId | string       | External Clerk identity reference. Unique.                    |
| fullName    | string       | User display name.                                            |
| email       | string       | User email. Unique if possible.                               |
| phone       | string?      | Optional for MVP.                                             |
| role        | enum         | ADMIN or STAFF.                                               |
| status      | enum         | ACTIVE, INVITED, SUSPENDED.                                   |
| clinicId    | foreign key? | Optional MVP simplification for single active clinic context. |
| createdAt   | datetime     | Record creation time.                                         |
| updatedAt   | datetime     | Last update time.                                             |

### Notes

- Do not store Clerk secrets.
- Store only Clerk user ID and app-specific data.
- Backend should not trust role values sent from frontend.

## 7.2 Clinic

Represents a clinic or practice using Pravaah.

### Responsibility

- store clinic identity and operating settings
- act as the top-level operational boundary
- group appointments, queue entries, users, doctors, and patients

### Suggested fields

| Field               | Type        | Notes                                 |
| ------------------- | ----------- | ------------------------------------- |
| id                  | uuid/string | Primary key.                          |
| name                | string      | Clinic name.                          |
| slug                | string      | URL-friendly identifier. Unique.      |
| phone               | string?     | Clinic contact number.                |
| email               | string?     | Clinic email.                         |
| addressLine1        | string?     | Address.                              |
| addressLine2        | string?     | Optional address line.                |
| city                | string?     | City.                                 |
| state               | string?     | State.                                |
| country             | string      | Default can be India.                 |
| pincode             | string?     | Postal code.                          |
| timezone            | string      | Example: Asia/Kolkata.                |
| openingTime         | string/time | Clinic daily opening time.            |
| closingTime         | string/time | Clinic daily closing time.            |
| slotDurationMinutes | int         | Example: 15.                          |
| bufferMinutes       | int         | Optional buffer between appointments. |
| isActive            | boolean     | Soft operational status.              |
| createdAt           | datetime    | Record creation time.                 |
| updatedAt           | datetime    | Last update time.                     |

## 7.3 Doctor

Represents a doctor profile independent of clinic membership.

### Responsibility

- store doctor identity and professional details
- allow doctor to be linked to clinics through `DoctorClinic`
- support appointment assignment

### Suggested fields

| Field              | Type        | Notes                           |
| ------------------ | ----------- | ------------------------------- |
| id                 | uuid/string | Primary key.                    |
| fullName           | string      | Doctor name.                    |
| specialization     | string?     | Example: General Physician.     |
| qualification      | string?     | Example: MBBS.                  |
| registrationNumber | string?     | Medical registration number.    |
| phone              | string?     | Contact number.                 |
| email              | string?     | Contact email.                  |
| gender             | enum?       | Optional.                       |
| experienceYears    | int?        | Optional.                       |
| isActive           | boolean     | Doctor profile active/inactive. |
| createdAt          | datetime    | Record creation time.           |
| updatedAt          | datetime    | Last update time.               |

### Important

Do not store `clinicId` directly in Doctor as the main relationship.

Use `DoctorClinic`.

## 7.4 DoctorClinic

Join table between Doctor and Clinic.

### Responsibility

- represent that a doctor works with a clinic
- support future multi-clinic doctor relationships
- store clinic-specific doctor settings later

### Suggested fields

| Field           | Type        | Notes                                    |
| --------------- | ----------- | ---------------------------------------- |
| id              | uuid/string | Primary key.                             |
| doctorId        | foreign key | References Doctor.                       |
| clinicId        | foreign key | References Clinic.                       |
| isActive        | boolean     | Whether doctor is active in this clinic. |
| displayName     | string?     | Optional clinic-specific display name.   |
| consultationFee | decimal?    | Post-MVP or optional.                    |
| createdAt       | datetime    | Record creation time.                    |
| updatedAt       | datetime    | Last update time.                        |

### Constraints

- Unique: `(doctorId, clinicId)`
- Index: `clinicId`
- Index: `doctorId`

## 7.5 Patient

Represents a patient profile independent of clinic membership.

### Responsibility

- store patient identity and contact details
- allow patient to be linked to clinics through `PatientClinic`
- support appointment booking

### Suggested fields

| Field                 | Type        | Notes                                                                                |
| --------------------- | ----------- | ------------------------------------------------------------------------------------ |
| id                    | uuid/string | Primary key.                                                                         |
| fullName              | string      | Patient name.                                                                        |
| phone                 | string      | Important for clinic contact.                                                        |
| email                 | string?     | Optional.                                                                            |
| gender                | enum?       | Optional.                                                                            |
| dateOfBirth           | date?       | Prefer DOB over storing only age.                                                    |
| age                   | int?        | Optional cached/display value.                                                       |
| address               | string?     | Optional.                                                                            |
| city                  | string?     | Optional.                                                                            |
| emergencyContactName  | string?     | Optional.                                                                            |
| emergencyContactPhone | string?     | Optional.                                                                            |
| distanceFromClinicKm  | decimal?    | Optional MVP input for prediction. Better later in PatientClinic if clinic-specific. |
| isActive              | boolean     | Soft status.                                                                         |
| createdAt             | datetime    | Record creation time.                                                                |
| updatedAt             | datetime    | Last update time.                                                                    |

### Important

Do not store `clinicId` directly in Patient as the main relationship.

Use `PatientClinic`.

## 7.6 PatientClinic

Join table between Patient and Clinic.

### Responsibility

- represent that a patient is known to a clinic
- store clinic-specific patient history
- support no-show risk scoring
- support future multi-clinic patient behavior

### Suggested fields

| Field                | Type        | Notes                                           |
| -------------------- | ----------- | ----------------------------------------------- |
| id                   | uuid/string | Primary key.                                    |
| patientId            | foreign key | References Patient.                             |
| clinicId             | foreign key | References Clinic.                              |
| totalAppointments    | int         | Default 0.                                      |
| totalNoShows         | int         | Default 0.                                      |
| totalLateArrivals    | int         | Default 0.                                      |
| lastVisitAt          | datetime?   | Optional.                                       |
| notes                | text?       | Clinic-specific notes.                          |
| distanceFromClinicKm | decimal?    | Better clinic-specific location/distance field. |
| isActive             | boolean     | Whether patient is active in this clinic.       |
| createdAt            | datetime    | Record creation time.                           |
| updatedAt            | datetime    | Last update time.                               |

### Constraints

- Unique: `(patientId, clinicId)`
- Index: `clinicId`
- Index: `patientId`

## 7.7 Appointment

Represents a scheduled clinic visit.

### Responsibility

- connect clinic, doctor, and patient for a scheduled time
- drive status updates
- connect with queue entry
- connect with no-show prediction

### Suggested fields

| Field           | Type        | Notes                                                     |
| --------------- | ----------- | --------------------------------------------------------- |
| id              | uuid/string | Primary key.                                              |
| clinicId        | foreign key | References Clinic.                                        |
| doctorId        | foreign key | References Doctor.                                        |
| patientId       | foreign key | References Patient.                                       |
| scheduledAt     | datetime    | Appointment time.                                         |
| durationMinutes | int         | Example: 15.                                              |
| status          | enum        | Appointment lifecycle status.                             |
| reason          | string?     | Reason for visit.                                         |
| notes           | text?       | Staff notes.                                              |
| bookingSource   | enum        | RECEPTION, PHONE, WEB, etc. MVP can default to RECEPTION. |
| createdByUserId | foreign key | User who booked appointment.                              |
| createdAt       | datetime    | Record creation time.                                     |
| updatedAt       | datetime    | Last update time.                                         |

### Service-level validation

Before creating appointment, backend must verify:

- clinic exists and is active
- doctor exists
- patient exists
- doctor is linked to clinic through DoctorClinic
- patient is linked to clinic through PatientClinic
- appointment is inside clinic operating hours
- doctor does not have an obvious conflicting appointment

### Suggested indexes

- `(clinicId, scheduledAt)`
- `(clinicId, doctorId, scheduledAt)`
- `(clinicId, patientId, scheduledAt)`
- `(clinicId, status)`

## 7.8 QueueEntry

Represents the live working order for a clinic day.

### Responsibility

- show who is waiting
- show who has arrived
- show who is called or completed
- reflect current clinic flow

### Suggested fields

| Field         | Type        | Notes                                                                      |
| ------------- | ----------- | -------------------------------------------------------------------------- |
| id            | uuid/string | Primary key.                                                               |
| clinicId      | foreign key | References Clinic.                                                         |
| appointmentId | foreign key | Usually references Appointment. Unique if one queue entry per appointment. |
| doctorId      | foreign key | Denormalized reference for faster filtering.                               |
| patientId     | foreign key | Denormalized reference for faster display/filtering.                       |
| position      | int         | Queue position.                                                            |
| status        | enum        | WAITING, ARRIVED, CALLED, COMPLETED, CANCELLED, NO_SHOW.                   |
| queuedAt      | datetime    | When added to queue.                                                       |
| calledAt      | datetime?   | When called.                                                               |
| completedAt   | datetime?   | When completed.                                                            |
| createdAt     | datetime    | Record creation time.                                                      |
| updatedAt     | datetime    | Last update time.                                                          |

### Suggested indexes

- `(clinicId, status)`
- `(clinicId, doctorId, position)`
- `(clinicId, queuedAt)`
- unique `(appointmentId)` for MVP

## 7.9 NoShowPrediction

Stores the MVP AI-assisted no-show risk output.

### Responsibility

- store risk score for appointment
- store risk level
- store explanation reasons
- track prediction model/rule version
- keep risk result available for appointment and queue views

### Suggested fields

| Field         | Type        | Notes                                    |
| ------------- | ----------- | ---------------------------------------- |
| id            | uuid/string | Primary key.                             |
| appointmentId | foreign key | References Appointment. Unique for MVP.  |
| clinicId      | foreign key | References Clinic. Useful for filtering. |
| patientId     | foreign key | References Patient. Useful for history.  |
| riskScore     | int         | 0 to 100.                                |
| riskLevel     | enum        | LOW, MEDIUM, HIGH.                       |
| reasons       | json/text   | Human-readable explanation list.         |
| modelVersion  | string      | Example: starter-rule-v1.                |
| generatedAt   | datetime    | When prediction was generated.           |
| createdAt     | datetime    | Record creation time.                    |
| updatedAt     | datetime    | Last update time.                        |

### MVP rule

This is not fake ML.

For MVP, prediction can be a deterministic rule-based scoring service.

Example:

```txt
+30 if patient has previous no-shows
+20 if patient has repeated late arrivals
+15 if distance from clinic is high
+10 if appointment was booked on same day
+10 if appointment time is historically risky
```

## 8. Enums

Suggested enums:

### UserRole

```txt
ADMIN
STAFF
```

### UserStatus

```txt
INVITED
ACTIVE
SUSPENDED
```

### AppointmentStatus

```txt
SCHEDULED
CONFIRMED
ARRIVED
IN_QUEUE
CALLED
COMPLETED
CANCELLED
NO_SHOW
```

### QueueStatus

```txt
WAITING
ARRIVED
CALLED
COMPLETED
CANCELLED
NO_SHOW
```

### RiskLevel

```txt
LOW
MEDIUM
HIGH
```

### BookingSource

```txt
RECEPTION
PHONE
WEB
WALK_IN
```

## 9. Transaction rules

Use transactions when multiple related records must stay consistent.

Examples:

### 9.1 Appointment booking

When booking an appointment:

1. Validate clinic, doctor, patient relationship.
2. Create appointment.
3. Generate no-show prediction.
4. Optionally create queue entry if appointment is for today.

These related steps should be treated carefully. If one critical step fails, the system should not leave inconsistent data.

### 9.2 Appointment status update

When appointment status changes:

- update Appointment
- update QueueEntry if needed
- update PatientClinic counters if completed/no-show/late-arrival rules apply

Use a transaction to avoid queue mismatch.

## 10. Deletion strategy

Prefer soft deletion for important clinic records.

Use fields such as:

```txt
isActive
status
deletedAt optional later
```

Do not hard-delete doctors, patients, or appointments casually because historical appointments and analytics may depend on them.

## 11. Indexing strategy

Add indexes intentionally.

High-value indexes:

```txt
Appointment: clinicId + scheduledAt
Appointment: clinicId + doctorId + scheduledAt
Appointment: clinicId + patientId + scheduledAt
Appointment: clinicId + status
QueueEntry: clinicId + doctorId + position
QueueEntry: clinicId + status
DoctorClinic: clinicId
PatientClinic: clinicId
NoShowPrediction: clinicId + riskLevel
```

Do not add random indexes everywhere. Indexes improve reads but add write overhead.

## 12. Migration strategy

Prisma migrations should be small and meaningful.

Good migration examples:

```txt
init_core_schema
add_queue_entries
add_no_show_predictions
add_patient_clinic_history_fields
```

Bad migration examples:

```txt
changes
fix
new_stuff
final_final_schema
```

Rules:

- Commit migration files.
- Do not edit already-applied migrations casually.
- Create new migrations for schema changes.
- Keep schema changes aligned with issues/PRs.
- Test migration locally before PR.

## 13. Seed data strategy

Seed data should help demo the app.

Suggested seed data:

- one clinic
- one admin user placeholder
- two staff users optional
- three doctors
- ten patients
- appointments for today
- queue entries
- some patient history that produces Low, Medium, and High no-show risk

Seed data should never include real patient data.

## 14. Privacy and data safety

Pravaah should collect only what is needed for the MVP.

Avoid storing unnecessary sensitive medical details.

For MVP, focus on operational data:

- contact details
- appointment details
- queue status
- no-show/late-arrival history
- reason/notes only when necessary

Do not store prescriptions, diagnosis history, or full medical records in MVP.

## 15. Future database expansion

Post-MVP additions may include:

- UserClinic or ClinicMember table for multi-clinic user membership
- DoctorSchedule
- DoctorAvailabilityWindow
- ReminderLog
- NotificationPreference
- AuditLog
- PatientPortalAccount
- DoctorPortalAccount
- PredictionRun or PredictionHistory
- Payment/Billing tables
- Prescription/MedicalRecord tables if the product direction expands

Do not add these until the MVP workflow is stable.

## 16. Final database principle

Database design should be future-ready, but not over-engineered.

For Pravaah MVP:

```txt
Use join tables for Doctor-Clinic and Patient-Clinic.
Keep User simple.
Keep Appointment and Queue reliable.
Keep Prediction explainable.
```
