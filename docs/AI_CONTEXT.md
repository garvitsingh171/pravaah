# AI Context

This document is for future AI coding assistants working on Project Pravaah.

## Current Stack

| Layer      | Current implementation    |
| ---------- | ------------------------- |
| Monorepo   | npm workspaces            |
| Frontend   | React + TypeScript + Vite |
| Backend    | Express + TypeScript      |
| Auth       | Clerk                     |
| Database   | PostgreSQL                |
| ORM        | Prisma                    |
| Styling    | Tailwind CSS              |
| Validation | Zod                       |
| Testing    | Vitest where configured   |

Do not suggest replacing the stack unless the user explicitly asks for a stack decision.

## Current MVP Scope

Pravaah is an AI-assisted clinic flow management MVP for small and medium clinics.

Implemented spine:

```txt
Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter no-show risk scoring
```

Current authenticated users:

- Admin
- Staff

Patients and doctors are records only.

## Current Architecture Rules

- Keep the monorepo structure.
- Keep backend feature modules.
- Keep frontend features under `apps/web/src/features`.
- Keep backend authorization server-side.
- Keep Prisma schema as database source of truth.
- Keep docs aligned with code.

## Current Database Rules

Current MVP entities:

1. `User`
2. `Clinic`
3. `Doctor`
4. `DoctorClinic`
5. `Patient`
6. `PatientClinic`
7. `Appointment`
8. `QueueEntry`
9. `NoShowPrediction`

Rules:

- Do not remove `DoctorClinic`.
- Do not remove `PatientClinic`.
- Do not replace `User.clinicId` with a membership model unless the task explicitly asks for multi-clinic access.
- Do not edit applied migrations casually.
- Use new migrations for schema changes.
- Do not store real patient data in seed files.

## Current Backend Rules

- Routes compose middleware and controllers.
- Controllers stay thin.
- Services own business rules and `AppError`.
- Repositories own Prisma calls and transactions.
- `validateRequest` uses Zod and puts parsed query in `res.locals.validatedQuery`.
- Protected endpoints require `authenticateRequest`.
- Clinic-scoped routes require clinic access checks.
- Admin-only clinic routes use `requireAdminRole`.
- Daily workflow routes use `requireClinicStaffRole`.

Transaction-sensitive flows:

- doctor + doctor-clinic creation
- patient + patient-clinic creation
- appointment + queue entry + prediction creation
- appointment/queue status synchronization
- queue reordering

## Current Frontend Rules

- `main.tsx` sets up Clerk, API auth, Toast provider, and App.
- `ProtectedAppShell` guards private routes.
- `ActiveClinicProvider` resolves current clinic through `GET /api/auth/me`.
- Feature API helpers live beside feature pages.
- Use `apiClient` for backend calls.
- Use `useActiveClinic()` for clinic-scoped pages.
- Show loading, empty, error, and success states.

Current UI limitations:

- clinic settings page is placeholder only
- doctor edit page is not implemented
- patient edit page is not implemented
- queue reorder UI is not implemented
- no patient or doctor login UI exists

## Forbidden Changes Unless Explicitly Requested

- Do not change runtime behavior during documentation-only tasks.
- Do not change database schema during documentation-only tasks.
- Do not change auth behavior casually.
- Do not remove security checks.
- Do not rename source folders/files unless obviously broken.
- Do not add patient login or doctor login to the MVP.
- Do not add billing, prescriptions, inventory, hospital ERP features, reminders, WhatsApp/SMS automation, or mobile app features to the MVP.
- Do not claim trained ML or advanced AI.
- Do not claim full multi-clinic SaaS support.
- Do not claim production deployment is complete without evidence.

## How To Scan Before Editing

Before changing behavior or docs, inspect:

- root `README.md`
- `docs/README.md`
- root `package.json`
- workspace package files
- `.env.example`
- `apps/server/prisma/schema.prisma`
- backend `app.ts`, `server.ts`, config, middleware, routes, services, repositories, validation, tests
- frontend `main.tsx`, `App.tsx`, providers, routes, feature pages, API helpers, types
- seed files
- GitHub issue/PR templates if contribution workflow is involved

## How To Avoid Stale Docs

When writing docs:

- say "implemented" only when code exists
- say "partial" when backend and frontend coverage differ
- say "future" or "post-MVP" for planned features
- link to specific source folders/files where useful
- avoid copying large explanations into many files
- update renamed links immediately

## Implemented Vs Planned Language

Good:

- "Backend queue reorder API exists, but the frontend does not currently expose it."
- "No-show scoring is rule-based and advisory."
- "Clinic settings UI is a placeholder; backend clinic create/update routes exist."

Bad:

- "Pravaah uses advanced AI to predict no-shows."
- "Doctors and patients can log in."
- "The app supports multi-clinic SaaS accounts."
- "Deployment is complete."

## Final Rule

Let the current codebase lead. Do not invent a better Pravaah in the docs or code unless the user explicitly asks for a product change.
