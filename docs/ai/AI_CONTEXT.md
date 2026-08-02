# AI Context

This document is for future AI coding assistants working on Project Pravaah.

## Current Stack

| Layer      | Current implementation        |
| ---------- | ----------------------------- |
| Monorepo   | npm workspaces                |
| Frontend   | React + TypeScript + Vite     |
| Backend    | Express + TypeScript          |
| Auth       | Clerk                         |
| Database   | PostgreSQL                    |
| ORM        | Prisma                        |
| Styling    | Tailwind CSS                  |
| Validation | Zod                           |
| Testing    | Vitest, React Testing Library |

Do not suggest replacing the stack unless the user explicitly asks for a stack decision.

## Release State

- `v0.1.0` is the frozen historical MVP release.
- `v0.2.0` is the current release candidate for Public Demo and Self-Service Clinic Onboarding.
- Documentation has been prepared for v0.2, but final tests, builds, deployments, and screenshots must still be verified before calling it released.
- Active scope source: `docs/scope/V0_2_SCOPE.md`.
- Candidate release notes: `docs/releases/V0_2_0_RELEASE_NOTES.md`.

Implemented spine:

```txt
Public entry -> Clerk identity -> Onboarding -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter no-show risk scoring
```

Current authenticated Pravaah roles:

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
- Keep Clerk identity separate from internal Pravaah authorization.
- Treat a missing internal user as valid only on explicitly onboarding-aware endpoints.

## Current Database Rules

Current entities:

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
- Do not store real patient data in seed files, sample data, screenshots, tests, or docs.

## Current Backend Rules

- Routes compose middleware and controllers.
- Controllers stay thin.
- Services own business rules and `AppError`.
- Repositories own Prisma calls and transactions.
- `validateRequest` uses Zod and puts parsed query in `res.locals.validatedQuery`.
- Protected endpoints require `authenticateRequest`.
- Onboarding identity-only endpoints use the explicit identity middleware and must not expose operational clinic data.
- Clinic-scoped routes require clinic access checks.
- Admin-only clinic routes use `requireAdminRole`.
- Daily workflow routes use `requireClinicStaffRole`.
- Do not remove or bypass `INTERNAL_USER_NOT_FOUND` for normal operational APIs.
- Normal clinic, doctor, patient, appointment, queue, dashboard, and prediction APIs remain protected.

Transaction-sensitive flows:

- clinic plus first Admin onboarding
- optional sample data provisioning
- doctor plus doctor-clinic creation
- patient plus patient-clinic creation
- appointment plus queue entry plus prediction creation
- appointment/queue status synchronization
- queue reordering

Onboarding rules:

- Clerk answers who the user is.
- Pravaah answers what the user may access.
- A Clerk-authenticated but unprovisioned identity has no internal role and no clinic access.
- Only onboarding-aware endpoints may accept that missing internal user state.
- Frontend-provided role, status, clinic ID, user ID, or clinic ownership must not be trusted.
- Clinic and first Admin creation must happen in one Prisma transaction.
- Failed onboarding must not leave an orphan clinic.
- Isolated sample data must be fake and scoped only to the authenticated user's clinic.

## Current Frontend Rules

- `main.tsx` sets up Clerk, API auth, Toast provider, and App.
- `App.tsx` owns public, auth, onboarding, protected, and fallback routes.
- `ProtectedAppShell` guards private routes by resolving Clerk state first, then backend onboarding state through `GET /api/auth/onboarding-status`.
- `ActiveClinicProvider` resolves current clinic through `GET /api/auth/me` only after onboarding is complete.
- Feature API helpers live beside feature pages.
- Use `apiClient` for backend calls.
- Use `useActiveClinic()` for clinic-scoped pages.
- Show loading, empty, error, and success states.

Current UI:

- public landing, sign-in, sign-up, onboarding, and dashboard routes exist
- clinic settings loads and updates supported Admin-only clinic settings
- doctor edit is implemented as a list-page edit workflow
- patient edit is implemented as a list-page edit workflow
- queue reorder is implemented through manual move controls
- no patient or doctor login UI exists

## Forbidden Changes Unless Explicitly Requested

- Do not change runtime behavior during documentation-only tasks.
- Do not change database schema during documentation-only tasks.
- Do not run database migrations, production data scripts, deployments, release commands, or Git mutations unless the user explicitly asks.
- Do not change auth behavior casually.
- Do not remove security checks.
- Do not rename source folders/files unless obviously broken.
- Do not add patient login or doctor login.
- Do not add billing, prescriptions, inventory, hospital ERP features, reminders, WhatsApp/SMS automation, or mobile app features.
- Do not claim trained ML or advanced AI.
- Do not claim full multi-clinic SaaS support.
- Do not claim production deployment is complete without evidence.
- Do not fabricate URLs, screenshots, release results, test output, or patient data.

## How To Scan Before Editing

Before changing behavior or docs, inspect:

- root `README.md`
- `docs/README.md`
- root `package.json`
- workspace package files
- `.env.example`
- `apps/server/prisma/schema.prisma`
- backend `app.ts`, `server.ts`, config, middleware, routes, services, repositories, validation, tests
- frontend `main.tsx`, `App.tsx`, providers, routes, feature pages, API helpers, types, tests
- browser-based E2E testing is intentionally deferred; use manual workflow verification docs for full browser checks
- seed files
- GitHub issue/PR templates if contribution workflow is involved

## How To Avoid Stale Docs

When writing docs:

- say "implemented" only when code exists
- say "present in source but not release-verified" when tests/build/deploy have not been run
- say "future" or "post-v0.2" for planned features
- link to specific source folders/files where useful
- avoid copying large explanations into many files
- update renamed links immediately

## Implemented Vs Planned Language

Good:

- "Queue reorder is exposed through manual move controls and must be release-tested."
- "No-show scoring is rule-based and advisory."
- "v0.2 documentation is ready; release verification is pending."

Bad:

- "Pravaah uses advanced AI to predict no-shows."
- "Doctors and patients can log in."
- "The app supports multi-clinic SaaS accounts."
- "Deployment is complete."
- "Screenshots are available" when no screenshot file exists.

## Final Rule

Let the current codebase and `docs/scope/V0_2_SCOPE.md` lead. Do not invent a better Pravaah in docs or code unless the user explicitly asks for a product change.
