# Database Revision

Important models:

- `Clinic`: tenant/workflow boundary.
- `User`: Clerk-mapped Admin/Staff with role, status, optional `clinicId`.
- `Doctor` and `DoctorClinic`: provider record and clinic link.
- `Patient` and `PatientClinic`: patient record and clinic-specific history/context.
- `Appointment`: scheduled visit tied to clinic, doctor, patient, creator.
- `QueueEntry`: one queue record per appointment.
- `NoShowPrediction`: stored deterministic score, risk level, JSON reasons.

Constraints and indexes:

- UUID primary keys on main models.
- `User.clerkUserId` and `User.email` unique.
- `DoctorClinic(doctorId, clinicId)` unique.
- `PatientClinic(patientId, clinicId)` unique.
- `QueueEntry.appointmentId` unique.
- `NoShowPrediction.appointmentId` unique.
- Appointment and queue clinic/date/status indexes.
- Active doctor slot unique migration for active appointment statuses.

Transactions:

- clinic onboarding
- appointment + queue + prediction creation
- queue status/appointment sync
- queue reorder

Limitations:

- no `UserClinic` membership model
- no persisted prediction model version column
- no unique queue position constraint in schema
