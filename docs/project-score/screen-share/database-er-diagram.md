# Database And ER Diagram Runbook

Reliability status: `RELIABLE` for schema/code explanation; `REQUIRES_SETUP` for live database rows.

## Visual ER Explanation

Open `apps/server/prisma/schema.prisma`.

Whiteboard order:

```text
Clinic
  |
  |-- User
  |
  |-- DoctorClinic -- Doctor
  |
  |-- PatientClinic -- Patient
  |
  |-- Appointment
  |      |-- QueueEntry
  |      |-- NoShowPrediction
  |
  |-- QueueEntry
  |-- NoShowPrediction
```

## What To Explain

| Topic | Evidence | Explanation |
| --- | --- | --- |
| Primary keys | `@id @default(uuid())` | All main models use UUID primary keys. |
| Foreign keys | `@relation(fields: ..., references: ...)` | Appointments and queue entries link to clinic, doctor, patient, and creator. |
| Join tables | `DoctorClinic`, `PatientClinic` | Global doctor/patient records can have clinic-specific links/history. |
| Unique constraints | `Clinic.slug`, `User.clerkUserId`, `User.email`, `DoctorClinic(doctorId, clinicId)`, `PatientClinic(patientId, clinicId)`, `QueueEntry.appointmentId`, `NoShowPrediction.appointmentId` | Prevent duplicate identities and duplicate one-to-one workflow records. |
| Indexes | `@@index([clinicId, scheduledAt])`, `@@index([clinicId, doctorId, scheduledAt])`, queue/status indexes | Support common clinic/date/status queries. |
| Active slot unique index | migration `20260612120303_add_active_doctor_slot_unique_index` | Prevents duplicate active appointment slots for same doctor/time. |
| Transactions | appointment, queue, onboarding repositories | Related writes commit/rollback together. |
| Soft deactivation | `isActive`, `UserStatus`, status enums | Preserve history while limiting active operations. |
| Data minimization | Patient record stores operational info only | No diagnosis, prescription, or full medical record model. |

## Future Multi-Clinic Design

Current users have one optional `User.clinicId`. True multi-clinic user access would need a membership model such as:

```text
User -- UserClinic -- Clinic
```

Do not claim this exists today.
