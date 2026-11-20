# Database And Transactions

Authoritative current references: [High-Level Design](../HLD.md), [Product Requirements](../PRD.md), and [Interview Guide](INTERVIEW_GUIDE.md). This file summarizes the schema and transaction story for interviews.

## Main Models

- `Clinic`
- `User`
- `Doctor`
- `DoctorClinic`
- `Patient`
- `PatientClinic`
- `Appointment`
- `QueueEntry`
- `NoShowPrediction`

`DoctorClinic` and `PatientClinic` exist so records can carry clinic-specific details and remain future-ready for multi-clinic relationships.

## Important Constraints

- `User.clerkUserId` is unique.
- Clinic slug is unique.
- `User.clinicId` is the current single-clinic access model.
- Appointment, queue, and prediction records are linked through foreign keys.

## Transactional Flows

Clinic onboarding:

```txt
create Clinic
create first ADMIN User
commit both or neither
```

Appointment creation:

```txt
validate clinic/doctor/patient
create Appointment
create QueueEntry
create NoShowPrediction
commit together
```

Sample data:

```txt
verify Admin clinic access
create fake doctors/patients/appointments/queue/predictions
commit inside the authenticated clinic
```

## Why Transactions Matter

Without transactions, onboarding could create a clinic with no owning Admin, and appointment booking could create an appointment without queue or risk data. Pravaah keeps those workflows atomic because partial writes would confuse both staff and demos.

## Future Database Work

- add membership table for multi-clinic access
- add audit logs
- add pagination support for large lists
- add prediction versioning only when no-show scoring evolves

## Current booking and queue concurrency trace (HEAD)

A race occurs when two workers both read a free slot before either commits. `POST /api/clinics/:clinicId/appointments` enters through `apps/server/src/modules/appointments/appointment.routes.ts`; Clerk identity, internal user, clinic access, Zod validation and rate limiting run before the controller. `appointment.service.ts` owns scheduling rules. The repository starts a Prisma transaction, acquires a PostgreSQL transaction-scoped advisory lock for the clinic, doctor and local date, locks relevant active memberships, and checks overlapping effective intervals again before creating related rows. The effective interval includes appointment duration plus the clinic buffer. Two appointments can overlap even when their start times differ, so the exact-start uniqueness index is an additional guard, not the entire conflict rule. A failed write inside the transaction rolls back the booking operation. See `apps/server/src/modules/appointments/appointment.repository.ts`, `appointment.scheduling.ts`, and `apps/server/prisma/migrations/20260612120303_add_active_doctor_slot_unique_index/migration.sql`.

For a dry run, imagine a 09:00 booking lasting 30 minutes with a 10-minute buffer. Its effective interval is `[09:00, 09:40)`. A 09:35 request for the same doctor and date conflicts although its start is different. A 09:40 request touches the boundary and does not overlap by the half-open interval rule, subject to availability and other constraints. A prior available-slots response is advice, not a reservation; the transaction must recheck.

Queue reorder uses a different scope: clinic, doctor and local date. The client sends both requested IDs and its expected active snapshot. `queue.service.ts` rejects duplicates, final entries, mixed doctors and wrong-clinic entries. `queue.repository.ts` locks and rechecks membership and order before updating positions. If another receptionist changed the queue, the request receives a conflict and the user should refresh. A stale reorder must never silently overwrite the other operator's work. PostgreSQL concurrency tests are under `apps/server/src/modules/queues/__tests__` and security regression configuration is `.github/workflows/security-regression.yml`; a committed test alone is not evidence of a specific run.
