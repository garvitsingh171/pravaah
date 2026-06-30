# Decisions

## Why Monorepo

Frontend, backend, docs, and future shared code belong to the same MVP. npm workspaces keep local development and repository review simple.

Current state:

- `apps/web`
- `apps/server`
- `packages/*` reserved

## Why React + Vite Instead Of Next.js

The MVP is an authenticated clinic-side app, not a content-heavy server-rendered site. React + Vite keeps the frontend lightweight and easy to deploy as static assets.

Next.js is not needed for the current routing/data model.

## Why Express Instead Of NestJS

Express is smaller and easier to inspect for an MVP and interview project. The codebase enforces structure manually through feature modules:

```txt
routes -> controller -> service -> repository
```

NestJS could be considered later if the backend grows significantly.

## Why PostgreSQL Instead Of MongoDB

Pravaah data is relational:

- clinics have users
- clinics link to doctors and patients
- appointments connect clinic, doctor, patient, and creator
- queue entries belong to appointments
- predictions belong to appointments

PostgreSQL gives foreign keys, indexes, constraints, and transactions that fit the workflow.

## Why Prisma

Prisma gives:

- schema-driven modeling
- migrations
- typed database access
- generated client
- clear relation definitions

It keeps database design visible in `apps/server/prisma/schema.prisma`.

## Why Clerk

Auth is important but not the core product differentiator. Clerk handles sign-in and session identity, letting Pravaah focus on clinic workflow.

Pravaah still keeps internal authorization in its own database.

## Why Rule-Based No-Show Prediction

There is no real training dataset in the MVP. A trained ML claim would be misleading.

Rule-based scoring is:

- transparent
- testable
- easy to explain
- useful as starter staff context
- honest about limitations

## Why No Patient Or Doctor Login In MVP

The MVP solves clinic-side flow first. Patient and doctor portals would expand scope into scheduling preferences, notifications, permissions, privacy, and user support.

Patients and doctors are records only until the clinic-side workflow is stable.

## Why DoctorClinic And PatientClinic

`DoctorClinic` and `PatientClinic` avoid locking doctors or patients to one clinic globally.

They also allow clinic-specific details:

- doctor display name/fee
- patient appointment/no-show/late-arrival counts
- patient distance from clinic
- clinic-specific notes

## Why Feature-Module Backend Structure

Each backend feature owns its route, controller, service, repository, validation, and types. This keeps related code together and makes modules easier to review.

Avoid global folders like:

```txt
routes/
controllers/
services/
repositories/
```

## Why Human-Controlled Queue Decisions

The MVP assists staff but does not replace them. No-show risk and queue data are advisory. Staff still decide when to call, complete, cancel, mark no-show, or reorder.

This reduces risk and keeps the workflow realistic for small clinics.

## Future Decisions To Revisit

- membership model for multi-clinic users
- queue reorder UI
- production deployment target
- audit logging
- notification/reminder provider
- whether to generate OpenAPI from Zod schemas
- when enough data exists for trained ML
