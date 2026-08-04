# Database And Transactions

Authoritative current references: [High-Level Design](../HLD.md), [Product Requirements](../PRD.md), and [Interview Guide](../INTERVIEW_GUIDE.md). This file summarizes the schema and transaction story for interviews.

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
