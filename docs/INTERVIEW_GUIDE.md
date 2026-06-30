# Interview Guide

## Two-Minute Project Explanation

Pravaah is an AI-assisted clinic flow management MVP for small and medium clinics. It helps clinic-side Admin and Staff users manage the daily workflow: sign in, work inside a clinic, create doctor and patient records, book appointments, manage today's queue, view dashboard activity, and see starter no-show risk context.

The no-show feature is intentionally honest: it is a rule-based starter scoring system, not trained ML. It produces LOW, MEDIUM, or HIGH risk with a score, reasons, and suggested staff actions. Staff stay in control.

## Architecture Explanation

```txt
React/Vite frontend
  -> Clerk session token
  -> Express API
  -> internal User, role, status, clinic checks
  -> Prisma
  -> PostgreSQL
```

The frontend handles UI and token sending. The backend is the source of truth for authorization and workflow rules. PostgreSQL stores the relational clinic workflow data.

## Stack Ownership Answers

| Topic        | Interview answer                                                                                |
| ------------ | ----------------------------------------------------------------------------------------------- |
| React + Vite | Chosen for a fast TypeScript SPA and simple deployment as static assets.                        |
| Express      | Lightweight REST API structure that is easy to inspect and explain.                             |
| Prisma       | Schema-first database modeling and typed database access.                                       |
| PostgreSQL   | The domain is relational: clinics, users, doctors, patients, appointments, queues, predictions. |
| Clerk        | Avoids building custom auth while still requiring internal app authorization.                   |
| Tailwind     | Fast utility styling for a practical dashboard-style app.                                       |
| Vitest       | Lightweight testing for services and validation.                                                |

## Database Explanation

The schema has nine MVP entities:

```txt
User, Clinic, Doctor, DoctorClinic, Patient, PatientClinic,
Appointment, QueueEntry, NoShowPrediction
```

`DoctorClinic` and `PatientClinic` are join tables. They prevent doctors and patients from being locked to one clinic forever and allow clinic-specific details like patient history and distance.

`User.clinicId` is an MVP simplification for single-clinic access. A future multi-clinic version should introduce membership tables.

## Auth Explanation

Clerk handles identity:

```txt
Who is signed in?
```

Pravaah backend handles authorization:

```txt
Is this signed-in person an ACTIVE internal User?
What role do they have?
Which clinic can they access?
```

That is why the backend still checks `User.status`, `User.role`, and `User.clinicId`.

## Appointment Flow Explanation

When staff book an appointment:

1. frontend sends doctor, patient, scheduled time, duration, reason, notes
2. backend validates input and clinic access
3. service checks clinic, doctor, patient, and active clinic links
4. service checks active slot conflicts using an advisory lock and a partial unique index
5. transaction creates Appointment
6. transaction creates QueueEntry
7. transaction creates NoShowPrediction

## Queue Flow Explanation

Queue entries are linked 1:1 with appointments. Staff can update status through the UI. Queue status changes synchronize appointment status in a transaction. Final queue statuses cannot be changed again.

Backend reorder exists, but the current frontend does not expose queue reordering controls.

## No-Show Prediction Explanation

No-show scoring is rule-based:

- previous no-shows increase risk
- late arrivals increase risk
- longer distance can increase risk
- short-notice and long-advance booking can increase risk
- new patients receive some risk
- strong attendance history reduces risk

The output is stored in `NoShowPrediction` and displayed in appointments, queue, and dashboard views. It is advisory, not automatic.

## Trade-Offs

- Simple MVP role model means faster delivery, but no full multi-clinic membership yet.
- Rule-based risk is transparent and honest, but not as powerful as trained ML.
- Express is flexible, but the team must maintain conventions manually.
- Manual queue control respects clinic staff decisions, but does not optimize automatically.
- Separate frontend/backend workspaces are easy to reason about, but shared types are manual today.

## Known Limitations

- no patient login
- no doctor login
- no full clinic settings UI
- no doctor/patient edit UI
- no frontend queue reorder UI
- no trained ML
- no production deployment proof
- no audit logging
- no frontend automated tests

## Responsible AI Tools Answer

I used AI tools as an assistant, not as an authority. I kept source files as the source of truth, reviewed generated changes, avoided claiming features that were not implemented, and documented limitations clearly. For the no-show feature, I avoided fake AI claims and described it as rule-based starter scoring because there is no training dataset yet.

## Possible Interviewer Questions

| Question                              | Strong answer direction                                                                 |
| ------------------------------------- | --------------------------------------------------------------------------------------- |
| Why not patient login?                | MVP focuses on clinic-side flow first. Patient portal is post-MVP.                      |
| Why PostgreSQL?                       | The data is relationship-heavy and needs constraints/transactions.                      |
| Why join tables for doctors/patients? | Future-ready multi-clinic relationships and clinic-specific history/settings.           |
| Is the no-show system ML?             | No, it is explainable rule-based scoring for MVP.                                       |
| How is auth secured?                  | Clerk identity plus backend internal User, role, status, and clinic checks.             |
| What was hardest?                     | Keeping appointment, queue, and prediction writes consistent while staying simple.      |
| How would you scale it?               | Add membership tables, pagination, audit logs, deployment automation, and richer tests. |

## Coding Exercises Based On The Project

- Add frontend doctor edit screen using existing backend route.
- Add patient edit screen and preserve `PatientClinic` fields.
- Add tests for queue reorder.
- Add pagination to patient list.
- Add an audit log for queue status changes.
- Generate OpenAPI docs from route/validation schemas.
- Add frontend tests for appointment booking error states.
