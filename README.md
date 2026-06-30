# Pravaah

Clinic appointment and queue flow management with starter no-show risk scoring.

Pravaah is an AI-assisted clinic flow management system for small and medium clinics. The Day 30 MVP focuses on clinic-side Admin and Staff users who manage doctors, patients, appointments, daily queues, and explainable no-show risk context.

## Problem Statement

Small and medium clinics often coordinate daily operations through notebooks, phone calls, spreadsheets, and messaging apps. That makes the clinic day harder to manage when patients miss appointments, arrive late, or need queue changes.

Pravaah is built around this real workflow problem:

- missed appointments waste doctor time
- late arrivals disturb the expected queue
- staff have poor visibility into the clinic day
- patients wait longer when queues are unclear
- appointment and queue decisions are scattered across manual tools

## MVP Summary

The MVP is a clinic-side appointment and queue management system with starter AI-assisted no-show risk scoring.

Pravaah currently focuses on authenticated clinic-side users only:

- **Admin**: clinic-side user with higher permissions
- **Staff**: clinic-side user who manages daily appointment and queue flow
- **Patient**: record only, does not log in
- **Doctor**: record only, does not log in

## Current MVP Status

Status as of Day 30, June 30, 2026.

| Area                          | Status      | Notes                                                                                                                                                                                      |
| ----------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Monorepo setup                | Completed   | npm workspaces are configured for `apps/web`, `apps/server`, and reserved `packages/*`.                                                                                                    |
| Backend API foundation        | Completed   | Express + TypeScript backend with feature modules, validation, error handling, health route, and REST-style routes.                                                                        |
| Prisma/PostgreSQL schema      | Completed   | Prisma schema and migrations exist for the 9 MVP entities: User, Clinic, Doctor, DoctorClinic, Patient, PatientClinic, Appointment, QueueEntry, and NoShowPrediction.                      |
| Clerk authentication          | Completed   | Frontend uses Clerk sign-in, and backend routes verify Clerk-authenticated requests.                                                                                                       |
| Internal user mapping         | Completed   | Backend maps Clerk identity to internal Pravaah users for role, status, and clinic access checks.                                                                                          |
| Doctor management             | Partial     | Backend supports create/list/update. Frontend supports list and create flows; dedicated edit UI is not yet a complete polished workflow.                                                   |
| Patient management            | Partial     | Backend supports create/list/update and clinic-specific patient history fields. Frontend supports list/search and create flows; dedicated edit UI is not yet a complete polished workflow. |
| Appointment booking           | Completed   | Backend and frontend support appointment creation, listing, status updates, validation, and risk generation/display.                                                                       |
| Queue management              | Completed   | Backend supports queue listing, status updates, and staff-controlled reorder APIs. Queue decisions remain human-controlled.                                                                |
| No-show risk scoring          | Completed   | Rule-based starter scoring generates LOW/MEDIUM/HIGH risk with reasons and suggested staff actions.                                                                                        |
| Dashboard/activity APIs       | Completed   | Backend exposes summary, high-risk appointments, and today activity endpoints.                                                                                                             |
| Frontend app shell            | Completed   | Vite React app has Clerk-protected routes, layout, sidebar/topbar, active clinic resolution, and API auth token handling.                                                                  |
| Frontend doctor/patient pages | Partial     | Staff-facing list/create pages exist with loading, empty, and error states; edit flows can be improved.                                                                                    |
| Appointment UI                | Completed   | Appointment page includes booking form, list, filters/status actions, and no-show risk badges/explanations.                                                                                |
| Queue UI                      | Partial     | Queue page shows today's queue, filters, status actions, and risk details. Manual reorder exists in API but is not fully surfaced in the UI.                                               |
| README/docs                   | In progress | Core docs exist; this README updates the root project overview to match the current MVP implementation.                                                                                    |
| Deployment preparation        | Partial     | Build scripts and environment examples exist. No production deployment URL or deployment claim is included.                                                                                |

## Core MVP Workflow

```txt
Admin/Staff signs in
        ↓
Clinic setup exists
        ↓
Staff adds doctor
        ↓
Staff adds patient
        ↓
Staff books appointment
        ↓
System generates starter no-show risk
        ↓
Appointment appears in appointment/queue flow
        ↓
Staff updates queue status
        ↓
Dashboard reflects clinic activity
```

## Feature Overview

### Authentication

Pravaah uses Clerk for sign-in and session identity. The frontend protects app routes, sends Clerk session tokens to the backend, and the backend verifies authenticated requests before allowing clinic operations.

### Clinic Management

Clinics act as the operational boundary for users, doctors, patients, appointments, queues, and dashboard data. Admin-only backend routes support clinic creation and updates.

### Doctor Management

Doctors are stored as records and linked to clinics through `DoctorClinic`. They do not log in during the MVP. Staff can use doctor records while booking appointments and filtering clinic flow.

### Patient Management

Patients are stored as records and linked to clinics through `PatientClinic`. Patients do not log in during the MVP. Clinic-specific history such as appointment count, no-shows, late arrivals, and distance from clinic can support no-show scoring.

### Appointment Management

Admin/Staff users can book appointments for a clinic, doctor, and patient. The backend validates clinic access, doctor-clinic links, patient-clinic links, appointment timing, and obvious slot conflicts. Appointment status can be updated during the clinic day.

### Queue Management

Queue entries represent the working clinic flow for a day. Staff can view the queue and update statuses such as waiting, called, completed, cancelled, and no-show. Manual queue control remains with clinic staff.

### Starter No-Show Risk Prediction

Pravaah generates starter no-show risk when an appointment is created. The risk output is stored and shown in appointment, queue, and dashboard contexts when available.

### Dashboard/Activity Overview

Dashboard APIs and UI summarize today's appointments, waiting queue, completed visits, cancelled/no-show counts, high-risk appointments, and recent clinic activity.

## No-Show Risk Scoring

The MVP no-show feature is **rule-based and explainable**. It is not a trained machine-learning model.

It produces:

- risk level: `LOW`, `MEDIUM`, or `HIGH`
- numeric score from 0 to 100
- staff-friendly reasons
- suggested staff actions

Possible factors include previous no-shows, late-arrival history, distance from the clinic, short-notice booking, long-advance booking, and new-patient history.

The risk feature is advisory only:

- it assists Admin/Staff users
- it does not make automatic decisions
- it does not automatically cancel appointments
- it does not automatically reorder queues
- it is not presented as trained ML

## Tech Stack

| Layer            | Technology              | Purpose                                                             |
| ---------------- | ----------------------- | ------------------------------------------------------------------- |
| Frontend         | React + TypeScript      | Clinic-side Admin/Staff UI.                                         |
| Frontend tooling | Vite                    | Local dev server and frontend build.                                |
| Backend          | Express + TypeScript    | REST API, validation, business rules, and authorization checks.     |
| Authentication   | Clerk                   | Sign-in and session identity.                                       |
| Database         | Neon PostgreSQL         | Hosted relational database for clinic workflow data.                |
| ORM              | Prisma                  | Schema modeling, migrations, and typed database access.             |
| Repository       | npm workspaces monorepo | Keeps frontend, backend, docs, and future shared packages together. |
| Testing          | Vitest                  | Backend unit tests where coverage exists.                           |

## Architecture Overview

```txt
React + TypeScript frontend
        ↓ Clerk session token
Express + TypeScript backend
        ↓ Prisma
Neon PostgreSQL
```

- The frontend renders the clinic UI, manages form state, and calls backend APIs.
- Clerk handles user identity and session tokens.
- The backend verifies authentication, role, clinic access, validation, and business rules.
- Prisma handles database access.
- The Pravaah database stores app roles, user status, clinic permissions, and workflow data.

Clerk answers: "Who is signed in?"

Pravaah backend answers: "What is this user allowed to do inside this clinic?"

## Repository Structure

```txt
pravaah/
├── apps/
│   ├── web/              # React + TypeScript frontend
│   └── server/           # Express + TypeScript backend and Prisma schema
├── docs/                 # Architecture, MVP, setup, database, and contribution docs
├── packages/             # Reserved for future shared workspace packages
├── .github/              # Issue templates and PR template
├── .env.example          # Example variable names only
├── package.json          # Root npm workspace scripts
└── README.md
```

## Local Development Setup

For full details, see [docs/SETUP.md](docs/SETUP.md).

1. Clone the repository.

    ```bash
    git clone <repo-url>
    cd pravaah
    ```

2. Install dependencies.

    ```bash
    npm install
    ```

3. Create local environment files.

    Typical local files:

    ```txt
    apps/web/.env
    apps/server/.env
    ```

    Use [.env.example](.env.example) for variable names only. Do not commit real secrets.

4. Set up the database with Prisma from `apps/server`.

    ```bash
    cd apps/server
    npx prisma migrate dev
    npx prisma generate
    ```

5. Seed local demo data when needed.

    From the repository root:

    ```bash
    npm run seed:demo
    ```

6. Run the app locally.

    From the repository root:

    ```bash
    npm run dev
    ```

    Or run each workspace separately:

    ```bash
    npm run dev:web
    npm run dev:server
    ```

Expected local URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
```

Useful root scripts:

| Command              | What it does                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`        | Runs workspace dev scripts.                                                              |
| `npm run dev:web`    | Starts the Vite frontend.                                                                |
| `npm run dev:server` | Starts the Express backend with `tsx watch`.                                             |
| `npm run build`      | Builds all workspaces.                                                                   |
| `npm run lint`       | Runs workspace lint scripts. Server lint currently prints that it is not configured yet. |
| `npm run check`      | Runs root build and lint.                                                                |
| `npm run seed:demo`  | Runs the backend Prisma seed.                                                            |

## Environment Variables

Example variable names are documented in [.env.example](.env.example). Do not put real values in README files, docs, screenshots, commits, or issues.

Frontend-safe Vite variables:

```txt
VITE_API_BASE_URL
VITE_CLERK_PUBLISHABLE_KEY
VITE_DEFAULT_CLINIC_ID
```

Backend/server variables:

```txt
PORT
CLIENT_URL
DATABASE_URL
CLERK_PUBLISHABLE_KEY
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
SEED_CLERK_USER_ID
SEED_STAFF_CLERK_USER_ID
SEED_DEMO_CLINIC_ID
```

Only frontend-safe values should use the `VITE_` prefix. Backend secrets such as `DATABASE_URL` and `CLERK_SECRET_KEY` must stay server-side.

## Important Docs

- [Architecture](docs/ARCHITECTURE.md)
- [MVP Scope](docs/MVP.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup](docs/SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)
- [User Roles](docs/USER_ROLES.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [AI Context](docs/AI_CONTEXT.md)

## MVP Limitations and Non-Goals

The MVP intentionally does not include:

- patient login
- doctor login
- billing
- inventory
- prescriptions
- full medical records
- hospital ERP features
- WhatsApp/SMS automation
- weather or traffic prediction
- trained ML no-show prediction
- automatic appointment cancellation
- fully automatic queue reordering
- mobile app

These are post-MVP possibilities only after the core clinic-side workflow is stable.

## How I Explain Pravaah in Interviews

Pravaah exists because small clinics lose time and clarity when appointments, arrivals, queues, and no-shows are handled manually across notebooks and calls. The MVP solves the core operational flow first: Admin/Staff sign in, manage doctors and patients, book appointments, view queue state, update statuses, and see explainable no-show risk context.

The stack is intentionally practical: React + TypeScript for a maintainable staff UI, Express + TypeScript for straightforward REST APIs, Clerk for authentication, Neon PostgreSQL for hosted relational data, and Prisma for schema-driven database access.

PostgreSQL and Prisma fit because the domain is relationship-heavy: clinics connect to users, doctors, patients, appointments, queue entries, and prediction records. The schema uses `DoctorClinic` and `PatientClinic` join tables so the MVP stays simple while leaving room for future multi-clinic growth.

Clerk handles identity, but backend authorization is still required. Pravaah must verify internal user status, role, and clinic access before allowing clinic operations. The frontend can improve UX, but it is not the source of truth for permissions.

No-show prediction is rule-based in the MVP because there is no real training dataset yet. That keeps the feature honest, explainable, and useful for staff without pretending to be advanced ML. Post-MVP, Pravaah can grow into reminders, portals, analytics, audit logs, and eventually trained ML once enough safe, relevant data exists.

## Contribution Note

Contributors should follow [docs/CONTRIBUTING.md](docs/CONTRIBUTING.md), keep changes focused, and avoid expanding the MVP beyond the documented product direction.
