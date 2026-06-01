<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# AI Context for Pravaah

## 1. Purpose

This document is written for AI coding assistants such as ChatGPT, GitHub Copilot, Codex, Cursor, and similar tools.

Its purpose is to prevent AI tools from deviating from the locked Pravaah product direction, MVP scope, architecture, database model, and implementation rules.

If an AI-generated suggestion conflicts with this document or the core documentation, the suggestion should be rejected unless the project owner intentionally updates the architecture.

## 2. What Pravaah is

Pravaah is an AI-assisted clinic flow management system for small and medium clinics.

The MVP focuses on clinic-side operations:

- managing clinics
- managing doctors
- managing patients
- booking appointments
- managing live queues
- showing starter no-show risk scoring

Pravaah is not a generic project-management app, hospital ERP, billing system, inventory system, prescription system, or full patient portal.

## 3. Locked stack

Do not suggest stack changes casually.

| Layer          | Locked Choice           |
| -------------- | ----------------------- |
| Frontend       | React + TypeScript      |
| Backend        | Express + TypeScript    |
| Authentication | Clerk                   |
| Database       | Neon PostgreSQL         |
| ORM            | Prisma                  |
| Repository     | npm workspaces monorepo |

Do not reintroduce Supabase for the MVP unless the core architecture is officially changed.

## 4. Workspace layout

Use this structure:

```txt
pravaah/
├── apps/
│   ├── web/
│   └── server/
├── packages/
├── docs/
└── .github/
```

## 5. MVP users

Only these users are authenticated in MVP:

- Admin
- Staff

Patients and doctors do not log in during MVP.

## 6. Final MVP entities

The database model should use these entities:

1. User
2. Clinic
3. Doctor
4. DoctorClinic
5. Patient
6. PatientClinic
7. Appointment
8. QueueEntry
9. NoShowPrediction

## 7. Database modeling rules

Doctor and Patient should not be directly locked to one clinic using only `clinicId`.

Use join tables:

- `DoctorClinic` connects doctors to clinics.
- `PatientClinic` connects patients to clinics.

Appointment can reference `clinicId`, `doctorId`, and `patientId`, but backend services must verify that the doctor and patient are linked to the clinic before creating an appointment.

## 8. MVP AI scope

The MVP must include one AI-assisted feature:

> Starter No-Show Risk Prediction

For MVP, this can be rule-based and explainable.

Possible factors:

- previous no-shows
- previous late arrivals
- distance from clinic
- same-day booking
- appointment history
- appointment timing

Output can include:

- risk score
- risk level
- explanation reasons
- model/rule version

Risk levels:

- LOW
- MEDIUM
- HIGH

## 9. Post-MVP AI features

Do not include these in MVP unless explicitly approved later:

- trained machine learning model
- weather-based prediction
- traffic-based prediction
- live patient location tracking
- automatic appointment cancellation
- automatic queue reordering without staff control
- WhatsApp automation
- voice calls
- advanced analytics assistant

## 10. Human decision rule

Pravaah should assist clinic staff, not replace them.

The system can suggest risk, highlight issues, and show alerts.

Final decisions should remain with Admin or Staff users.

## 11. Backend architecture rules

The backend should be feature-module based.

Use modules such as:

- auth
- users
- clinics
- doctors
- patients
- appointments
- queues
- predictions

Each module may contain:

- routes
- controller
- service
- repository
- validation
- types

Rules:

- Controllers stay thin.
- Services contain business logic.
- Repositories contain Prisma/database access.
- Middleware handles auth and shared request concerns.
- Backend verifies role and clinic access.
- Do not create messy global route/controller/repository folders.

## 12. Frontend rules

Frontend should focus on clinic staff workflows:

- dashboard
- clinic settings
- doctor management
- patient management
- appointment booking
- queue view
- no-show risk display

Frontend route protection is useful, but backend authorization is mandatory.

The frontend must not be treated as the source of truth for permissions.

## 13. MVP non-goals

Do not build these during MVP:

- patient login
- doctor login
- billing
- inventory
- prescriptions
- full medical records
- hospital management system
- advanced analytics
- multi-branch admin dashboard
- mobile app
- WhatsApp integration
- live GPS tracking
- weather/traffic integrations
- advanced ML model

## 14. Implementation priority

Build in this order:

1. Workspace setup
2. Server setup
3. Prisma schema
4. Authentication middleware
5. Clinic APIs
6. Doctor APIs
7. Patient APIs
8. Appointment APIs
9. Queue APIs
10. Starter no-show prediction service
11. Frontend screens
12. Deployment
13. Final documentation

## 15. Instructions for AI assistants

When helping with Pravaah:

- scan existing docs first
- follow locked MVP scope
- do not expand the product unnecessarily
- do not suggest stack changes casually
- keep solutions beginner-friendly but production-minded
- prefer small issues and small pull requests
- explain trade-offs clearly
- keep database design future-ready
- avoid fake AI claims
- treat starter no-show scoring as explainable rule-based logic for MVP
- keep advanced AI as post-MVP

## 16. Forbidden AI behavior

AI tools should not:

- convert the MVP into a hospital ERP
- replace Clerk with another auth provider
- replace Neon/PostgreSQL with another database
- add Supabase back into MVP
- add patient portal into MVP
- add doctor login into MVP
- create advanced ML without data
- pretend rule-based scoring is trained AI
- create huge unrelated PRs
- ignore docs and invent new architecture

## 17. Core principle

Pravaah should first become a working clinic appointment and queue management MVP.

Build the spine first:

```txt
Auth → Clinic → Doctor/Patient → Appointment → Queue → Starter Prediction
```

Then improve intelligence, automation, and scale.
