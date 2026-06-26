<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah Architecture

## 1. Purpose

This document is the architecture source of truth for Pravaah.

If any planning note, AI-generated suggestion, issue description, or future document conflicts with this file, this file wins until the architecture is intentionally changed through a reviewed documentation pull request.

The goal of this file is to help a beginner contributor, an AI coding assistant, and an interviewer understand:

- what Pravaah is
- what stack is locked
- how the frontend, backend, database, and authentication parts connect
- how the MVP remains simple while still being future-ready
- what should not be built during the MVP

## 2. Product Identity

Pravaah is an AI-assisted clinic flow management system for small and medium clinics.

It helps clinic-side users manage:

- clinics
- doctors
- patients
- appointments
- live queues
- starter no-show risk scoring

The word **Pravaah** means **flow**. In product terms, Pravaah is not only about booking appointments. It is about improving the daily operational flow of a clinic.

The MVP should solve the core problem first:

> Clinic staff need a simple system to manage appointments, queues, and no-show risk without depending on notebooks, scattered calls, and manual guesswork.

## 3. Locked MVP Stack

The MVP stack is fixed.

| Layer            | Locked Choice        | Reason                                                                                      |
| ---------------- | -------------------- | ------------------------------------------------------------------------------------------- |
| Frontend         | React + TypeScript   | Good for component-based UI, maintainability, and internship-ready frontend practice.       |
| Backend          | Express + TypeScript | Simple, flexible, beginner-friendly, and suitable for REST APIs.                            |
| Authentication   | Clerk                | Handles sign-in/session identity so the MVP does not waste time building auth from scratch. |
| Database Hosting | Neon PostgreSQL      | Managed PostgreSQL with a modern developer workflow.                                        |
| ORM              | Prisma               | Type-safe database access, schema modeling, and migration workflow.                         |
| Repository Style | Monorepo             | Keeps frontend, backend, docs, and shared code in one repository.                           |
| Package Manager  | npm workspaces       | Simple workspace support without adding unnecessary tooling complexity.                     |

### 3.1 Explicitly rejected for MVP

Do not reintroduce these unless a future architecture decision officially changes the stack:

- Supabase Auth
- Supabase database hosting
- Next.js
- MongoDB
- Firebase
- a mobile app stack
- a microservices architecture
- a layer-first backend folder structure

These are not bad technologies. They are rejected only because the MVP needs focus.

## 4. System Overview

```txt
Clinic Admin / Staff
        |
        v
React + TypeScript Frontend
        |
        | HTTP requests with Clerk session token
        v
Express + TypeScript Backend
        |
        | Auth verification + role checks + business rules
        v
Prisma ORM
        |
        v
Neon PostgreSQL
```

### 4.1 Responsibility of each layer

| Layer      | Responsibility                                                                     | Must Not Do                                     |
| ---------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| Frontend   | Render UI, collect form input, call APIs, show loading/errors.                     | Make final authorization decisions.             |
| Backend    | Verify auth, enforce roles, validate input, run business logic, call repositories. | Trust frontend role or clinic IDs blindly.      |
| Prisma     | Represent database schema and provide typed database access.                       | Contain business workflow decisions.            |
| PostgreSQL | Store reliable relational data with constraints, indexes, and transactions.        | Depend on frontend-only validation.             |
| Clerk      | Authenticate users and provide external identity.                                  | Replace app-level roles and clinic permissions. |

## 5. Monorepo Layout

```txt
pravaah/
├── apps/
│   ├── web/
│   │   ├── src/
│   │   ├── package.json
│   │   └── ...
│   └── server/
│       ├── src/
│       ├── prisma/
│       ├── package.json
│       └── ...
├── packages/
│   └── shared/              # optional later, not required on day one
├── docs/
│   ├── ARCHITECTURE.md
│   ├── MVP.md
│   ├── DATABASE_DESIGN.md
│   ├── ROADMAP.md
│   ├── SETUP.md
│   ├── USER_ROLES.md
│   ├── CONTRIBUTING.md
│   └── AI_CONTEXT.md
├── .github/
├── README.md
├── package.json
└── .env.example
```

### 5.1 Why monorepo?

A monorepo is useful for Pravaah because:

- the frontend and backend belong to the same product
- issues and pull requests stay easier to connect
- shared types can later move into `packages/shared`
- documentation stays close to code
- the project is easier to explain in interviews

## 6. Backend Architecture

The backend is feature-module based.

```txt
apps/server/src/
├── modules/
│   ├── auth/
│   ├── users/
│   ├── clinics/
│   ├── doctors/
│   ├── patients/
│   ├── appointments/
│   ├── queues/
│   └── predictions/
├── middleware/
├── config/
├── utils/
├── app.ts
└── server.ts
```

### 6.1 Module structure

Each feature module should own its routes, controller, service, repository, validation, and types.

Example:

```txt
modules/appointments/
├── appointment.routes.ts
├── appointment.controller.ts
├── appointment.service.ts
├── appointment.repository.ts
├── appointment.validation.ts
└── appointment.types.ts
```

### 6.2 Backend layer rules

| File type  | Job                                          | Example                                    |
| ---------- | -------------------------------------------- | ------------------------------------------ |
| Route      | Connect URL + method to controller.          | `POST /appointments`                       |
| Controller | Read request, call service, return response. | `createAppointmentController`              |
| Service    | Business decisions and workflow rules.       | Check slot conflict, generate queue entry. |
| Repository | Prisma/database queries only.                | `appointmentRepository.create()`           |
| Validation | Request body/query validation.               | Validate appointment date and patient ID.  |
| Types      | Local TypeScript types.                      | `CreateAppointmentInput`                   |

### 6.3 Strict backend rules

- Keep controllers thin.
- Keep business decisions in services.
- Keep Prisma access in repositories.
- Keep authentication in middleware and backend handlers.
- Keep role checks on the backend.
- Do not create global top-level `routes`, `controllers`, or `repositories` folders.
- Do not allow frontend-sent `role` or `clinicId` to decide access without backend verification.

## 7. Backend modules

### 7.1 Auth module

Responsibilities:

- verify Clerk tokens
- map Clerk identity to internal `User`
- expose current user/profile endpoint if needed
- support backend route protection

### 7.2 Users module

Responsibilities:

- store app user profile
- store role such as Admin or Staff
- connect authenticated users to clinic operations
- support future user management by Admin

### 7.3 Clinics module

Responsibilities:

- create and update clinic profile
- store clinic timings and operational settings
- act as the tenant boundary for appointments, queues, and analytics

### 7.4 Doctors module

Responsibilities:

- create doctor profiles
- update doctor identity and practice details
- link doctors to clinics through `DoctorClinic`
- check active doctor-clinic relationship before appointments

### 7.5 Patients module

Responsibilities:

- create patient profiles
- update contact details
- link patients to clinics through `PatientClinic`
- track clinic-specific visit/no-show/late-arrival history

### 7.6 Appointments module

Responsibilities:

- book appointments
- update appointment status
- filter appointments by clinic, doctor, date, patient, and status
- trigger queue and prediction-related workflows

### 7.7 Queues module

Responsibilities:

- show today's live queue
- create queue entries for appointments
- update queue status
- preserve consistency when appointment status changes

### 7.8 Predictions module

Responsibilities:

- generate starter no-show risk score
- store risk score, risk level, and reasons
- expose prediction details to appointment and queue views

For MVP, this module is rule-based. It must not pretend to be an advanced ML system.

## 8. Frontend Architecture

Suggested structure:

```txt
apps/web/src/
├── app/
├── components/
├── features/
│   ├── auth/
│   ├── dashboard/
│   ├── clinics/
│   ├── doctors/
│   ├── patients/
│   ├── appointments/
│   └── queues/
├── lib/
├── routes/
├── types/
└── main.tsx
```

### 8.1 Frontend responsibilities

The frontend should:

- render the clinic staff UI
- manage forms and local UI state
- call backend APIs
- display server validation errors clearly
- protect private routes at the UI level
- show no-show risk badges and explanations

The frontend should not:

- make final authorization decisions
- store secrets
- directly talk to the database
- bypass backend validation
- implement business rules that must remain server-side

## 9. Authentication and authorization flow

```txt
1. Admin or Staff signs in using Clerk.
2. Frontend receives Clerk session state.
3. Frontend sends authenticated request to backend.
4. Backend verifies Clerk token.
5. Backend finds internal User by clerkUserId.
6. Backend checks role and clinic access.
7. Backend performs the requested operation.
```

### 9.1 Why Clerk is not enough alone

Clerk answers:

> Who is this authenticated person?

Pravaah backend must answer:

> What is this person allowed to do inside this clinic?

That is why role checks and clinic access checks must remain in the backend.

## 10. Database architecture

Pravaah uses relational modeling because clinic operations are relationship-heavy.

Final MVP entities:

1. User
2. Clinic
3. Doctor
4. DoctorClinic
5. Patient
6. PatientClinic
7. Appointment
8. QueueEntry
9. NoShowPrediction

Important rule:

> Doctor and Patient are not directly locked to one clinic. Their clinic relationship is handled through `DoctorClinic` and `PatientClinic`.

This keeps the database more future-ready for multi-clinic SaaS growth.

## 11. MVP AI architecture

The MVP includes one AI-assisted feature:

> Starter No-Show Risk Prediction

This should be built as an explainable rule-based scoring service for clinic-side Admin and Staff users.
For the MVP, Pravaah does not use a trained machine-learning model for no-show prediction.

Example input factors:

- patient previous no-shows
- patient previous late arrivals
- distance from clinic
- appointment timing
- same-day booking
- total appointment history

Example output:

```json
{
    "score": 72,
    "riskLevel": "HIGH",
    "reasons": [
        "Patient has previous no-shows",
        "Patient lives far from the clinic",
        "Appointment was booked on the same day"
    ]
}
```

If the backend stores a rule/model version or generated timestamp, the UI should display it in the
risk detail view. If those fields are not returned, the UI should use a safe "not available" fallback.

The frontend can use this stored prediction output to show:

- low, medium, and high no-show risk badges
- human-readable prediction reasons
- staff-friendly suggested actions
- risk detail views for appointment and queue workflows

Suggested actions are advisory only. They should help staff decide what to review or follow up on,
such as considering a manual confirmation call for a high-risk appointment. They must not make
final operational decisions for the clinic.

### 11.1 AI boundary

Allowed in MVP:

- rule-based risk score
- low/medium/high risk level
- human-readable reasons
- staff-assistive suggested actions
- storage in `NoShowPrediction`
- display in appointment and queue views as badges and explanation details

Not allowed in MVP:

- trained ML model
- live patient location tracking
- traffic API
- weather API
- automatic cancellation
- fully automatic queue reordering
- WhatsApp/voice automation

These excluded items are not part of the MVP AI feature or the no-show risk UI issue. They belong
only in future roadmap discussions after the core appointment, queue, and starter prediction flow is
stable.

## 12. Main product workflow

```txt
Admin/Staff signs in
        ↓
Clinic profile is created or selected
        ↓
Doctor profile is created
        ↓
Doctor is linked to clinic through DoctorClinic
        ↓
Patient profile is created
        ↓
Patient is linked to clinic through PatientClinic
        ↓
Appointment is booked
        ↓
Starter no-show prediction is generated
        ↓
Queue entry is created or shown for the clinic day
        ↓
Staff manages queue status during operations
```

## 13. API design style

Use REST-style resource URLs.

Good examples:

```txt
GET    /api/clinics/:clinicId/doctors
POST   /api/clinics/:clinicId/doctors
GET    /api/clinics/:clinicId/patients
POST   /api/clinics/:clinicId/appointments
PATCH  /api/appointments/:appointmentId/status
GET    /api/clinics/:clinicId/queue/today
POST   /api/appointments/:appointmentId/prediction
```

Avoid RPC-style route names such as:

```txt
/getAllUsers
/createDoctor
/deleteAppointment
```

## 14. Error handling architecture

Use a consistent error response shape.

Example:

```json
{
    "success": false,
    "error": {
        "code": "APPOINTMENT_SLOT_CONFLICT",
        "message": "This doctor already has an appointment in this time slot."
    }
}
```

Common error categories:

- authentication error
- authorization error
- validation error
- not found error
- conflict error
- database error
- unexpected server error

## 15. Security principles

- Never commit secrets.
- Verify Clerk tokens on backend routes.
- Do not trust client-provided role values.
- Do not expose database connection strings to frontend.
- Validate all request bodies.
- Scope every clinic operation by clinic access.
- Use transactions for appointment + queue updates.
- Keep patient data minimal for MVP.

## 16. Deployment architecture

MVP deployment can use:

- Frontend: Vercel, Netlify, or similar static frontend hosting
- Backend: Render, Railway, Fly.io, or similar Node hosting
- Database: Neon PostgreSQL
- Auth: Clerk

Deployment is not the main architecture decision. The important rule is that environment variables must be separated by environment:

- local development
- preview/staging
- production

## 17. Post-MVP architecture direction

After MVP, Pravaah can grow into:

- advanced no-show prediction
- reminders and notification integrations
- doctor availability windows
- patient portal
- doctor login
- multi-clinic admin workflows
- analytics dashboard
- audit logs
- role and permission expansion
- location/weather/traffic-based prediction
- mobile app

These should not be mixed into the MVP unless the MVP is already stable.

## 18. Final architecture principle

Build the spine first:

```txt
Auth → Clinic → Doctor/Patient → Appointment → Queue → Starter Prediction
```

Do not expand into a healthcare super-app before this spine works end to end.
