# Pravaah Architecture

## Product Identity

Pravaah is an AI-assisted clinic flow management MVP. The name means "flow"; the product focuses on the daily movement from authenticated clinic staff to records, appointments, queue work, and explainable no-show risk context.

The implementation is clinic-side only:

```txt
Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter No-show Prediction
```

## Current Stack

| Layer      | Current implementation                                                      |
| ---------- | --------------------------------------------------------------------------- |
| Monorepo   | npm workspaces                                                              |
| Frontend   | React 19 + TypeScript + Vite                                                |
| Styling    | Tailwind CSS                                                                |
| Routing    | React Router                                                                |
| Backend    | Express 5 + TypeScript                                                      |
| Auth       | Clerk frontend SDK + `@clerk/express`                                       |
| Database   | PostgreSQL through `DATABASE_URL`                                           |
| ORM        | Prisma 7 with generated client output in `apps/server/src/generated/prisma` |
| Validation | Zod                                                                         |
| Testing    | Vitest where configured, mainly backend tests                               |

The code does not require a specific PostgreSQL host. Neon works as a hosted option, but the source of truth is the PostgreSQL `DATABASE_URL`.

## Monorepo Structure

```txt
pravaah/
├── apps/
│   ├── web/              # React/Vite frontend
│   └── server/           # Express API, Prisma schema, seed, migrations
├── docs/                 # Project documentation
├── packages/             # Reserved for future shared workspace packages
├── .github/              # Issue and PR templates
├── .env.example          # Example variable names only
├── package.json          # Root npm workspace scripts
└── README.md
```

`packages/*` is reserved only. There is currently no shared package implementation.

## System Diagram

```txt
Browser
  |
  | Clerk sign-in and session
  v
React + TypeScript frontend
  |
  | HTTP JSON requests
  | Authorization: Bearer <Clerk token>
  v
Express + TypeScript backend
  |
  | clerkMiddleware + authenticateRequest
  | internal User, role, status, clinic access
  v
Services and repositories
  |
  | Prisma Client with PostgreSQL adapter
  v
PostgreSQL
```

## Frontend Responsibility

The frontend is responsible for:

- separating public, onboarding, and protected application routes
- rendering the Admin/Staff app shell
- Clerk sign-in and sign-out UI
- Clerk sign-up UI during v0.2 onboarding work
- resolving active clinic context through `GET /api/auth/me`
- resolving onboarding state before sending an authenticated-but-unprovisioned user into the protected app
- sending Clerk Bearer tokens through the API client
- rendering dashboard, doctor, patient, appointment, queue, and Admin clinic settings pages
- showing loading, empty, error, success, and toast states
- displaying starter no-show risk results from the backend

The frontend is not trusted for final authorization, role checks, clinic access, or database writes.

## Frontend Route Boundaries

v0.2 introduces three route groups:

| Route group                  | Session requirement                                    | Purpose                                                          |
| ---------------------------- | ------------------------------------------------------ | ---------------------------------------------------------------- |
| Public routes                | No Clerk session required                              | Landing, sign-in, sign-up, and public product information.       |
| Onboarding routes            | Clerk session required; internal `User` may be missing | First-time clinic bootstrap and setup flow.                      |
| Protected application routes | Clerk session plus active internal `User` required     | Dashboard, doctors, patients, appointments, queue, and settings. |

Valid application states include:

| State                           | Clerk session | Internal Pravaah user                            | Expected frontend destination |
| ------------------------------- | ------------- | ------------------------------------------------ | ----------------------------- |
| Signed out                      | No            | Unknown                                          | Public routes or auth pages   |
| Authenticated but unprovisioned | Yes           | Missing                                          | Onboarding routes             |
| Active internal user            | Yes           | `ACTIVE` `ADMIN` or `STAFF`                      | Protected application routes  |
| Invalid internal state          | Yes           | Missing/inactive/inconsistent outside onboarding | Recovery or error state       |

An authenticated-but-unprovisioned Clerk identity is valid only for onboarding-aware routes. It is not a Pravaah role and has no clinic access.

## Backend Responsibility

The backend is responsible for:

- verifying Clerk-authenticated requests
- mapping Clerk identity to the internal `User`
- allowing missing internal users only on explicitly onboarding-aware endpoints
- enforcing `UserStatus.ACTIVE`
- enforcing Admin/Staff role rules
- enforcing single-clinic MVP access through `User.clinicId`
- validating requests with Zod
- running business logic in services
- performing Prisma database access through repositories
- keeping appointment, queue, and prediction writes transactionally consistent
- keeping clinic and first Admin provisioning transactionally consistent in v0.2 onboarding
- replaying completed onboarding attempts idempotently from the current Clerk identity
- disabling standalone clinic creation so a clinic cannot be created without a linked Admin
- returning consistent JSON success and error shapes

## Database Responsibility

PostgreSQL stores:

- app users and clinic access
- clinic settings
- doctor and patient records
- doctor-clinic and patient-clinic links
- appointments
- queue entries
- no-show prediction records

The Prisma schema at `apps/server/prisma/schema.prisma` is the current database source of truth.

## Clerk/Auth Responsibility

Clerk answers:

```txt
Who is signed in?
```

Pravaah answers:

```txt
Is this signed-in person an ACTIVE internal User, what role do they have, and which clinic can they access?
```

Do not replace backend authorization with frontend checks or Clerk metadata alone.

For v0.2:

- Clerk-authenticated onboarding endpoints may accept a valid Clerk identity without an internal `User`.
- Operational APIs for clinics, doctors, patients, appointments, queue, dashboard, and prediction behavior still require an active internal user and clinic access.
- `INTERNAL_USER_NOT_FOUND` must not be removed or bypassed for normal protected APIs.
- The frontend must not choose role, status, clinic ownership, or another clinic's ID.

## Request Flow

```txt
Frontend page/action
  -> apiClient builds /api URL and adds Bearer token
  -> Express app runs clerkMiddleware
  -> feature route runs authenticateRequest
  -> validateRequest parses params/query/body with Zod
  -> requireClinicAccess and role middleware run where applicable
  -> controller reads validated data
  -> service applies workflow/business rules
  -> repository performs Prisma queries/transactions
  -> controller sends success JSON
  -> errorHandler sends AppError/Prisma/JSON error JSON when needed
```

Important route detail: API routers are registered before `errorHandler`; the root `GET /` welcome route is currently registered after the error handler and has no custom error path.

## v0.2 Middleware Responsibilities

Use names aligned with the current codebase where possible, while keeping these responsibilities separate:

| Responsibility                    | Current name                                                          | Rule                                                                                  |
| --------------------------------- | --------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Clerk authentication verification | `clerkMiddleware`, `authenticateRequest`, `authenticateClerkIdentity` | Verifies the Clerk session and exposes trusted identity claims.                       |
| Identity-only onboarding access   | `authenticateClerkIdentity`                                           | Allows a valid Clerk identity while the internal Pravaah `User` may still be missing. |
| Required internal user check      | `authenticateRequest`                                                 | Required for normal operational APIs.                                                 |
| Active user check                 | `authService.getActiveUserByClerkUserId`, `accessService`             | Requires `User.status = ACTIVE`.                                                      |
| Clinic access check               | `requireClinicAccess`, `accessService.verifyClinicAccess`             | Enforces server-side clinic scope.                                                    |
| Role check                        | `requireAdminRole`, `requireClinicStaffRole`                          | Enforces `ADMIN` or `STAFF` from the internal database.                               |

Only onboarding-aware endpoints should use optional internal user loading. Normal clinic, doctor, patient, appointment, queue, dashboard, and prediction APIs should keep required internal user, active user, clinic access, and role checks.

## Feature Module Architecture

Backend feature modules follow:

```txt
Route
-> validateRequest
-> Controller
-> Service
-> Repository
-> Prisma
```

The v0.2 onboarding endpoints live in the auth module and follow the same route/controller/service/repository pattern:

```txt
apps/server/src/modules/auth/
```

Onboarding services should own the provisioning workflow, including one Prisma transaction for clinic creation plus first Admin creation. Onboarding repositories should own Prisma reads/writes and transaction bodies. Do not route clinic bootstrap through the normal Admin-only clinic creation path.

The clinic bootstrap flow treats a completed current account as authoritative:
retries return the existing completed user and clinic summaries instead of
creating, updating, or comparing the retry body. If a unique constraint conflict
occurs during provisioning, the service re-reads the current Clerk identity
before returning an idempotent replay or a safe conflict. This keeps the database
constraints as the final concurrency protection without relying on in-memory
locks.

The ordinary `POST /api/clinics` route is retained only as a protected disabled
operation. It must not validate a creation body or write a standalone clinic.
Clinic updates remain protected by internal-user authentication, clinic access,
and Admin role checks.

## Deployment Shape

The v0.1.0 MVP is recorded as completed and deployed in the release freeze record, but this repository does not contain live deployment URLs, production credentials, or confirmed deployed commit SHAs. v0.2 is a release candidate until the owner verifies tests, builds, deployed URLs, and screenshots.

Expected deployment shape:

```txt
Static frontend host
  -> VITE_API_BASE_URL points to backend /api

Node backend host
  -> PORT, CLIENT_URL, CLERK_SECRET_KEY, DATABASE_URL

PostgreSQL database
  -> Prisma migrations/generate run during release setup

Clerk production app
  -> frontend publishable key and backend secret key
```

See `docs/guides/DEPLOYMENT.md` for a deployment checklist.

## Important Trade-Offs

| Decision                              | Trade-off                                                                      |
| ------------------------------------- | ------------------------------------------------------------------------------ |
| Express instead of a larger framework | Simple and direct, but conventions must be maintained manually.                |
| Clerk for auth                        | Faster secure identity setup, but internal authorization still needs app code. |
| `User.clinicId` in MVP                | Simple clinic access model, but not full multi-clinic membership.              |
| `DoctorClinic` and `PatientClinic`    | Slightly more schema complexity, but future-ready for multi-clinic records.    |
| Rule-based no-show scoring            | Honest and explainable without a dataset, but not trained ML.                  |
| Human-controlled queue                | Staff stay in control, but automation is intentionally limited.                |

## What Not To Change Casually

- Do not change runtime behavior in a docs-only task.
- Do not replace Clerk, PostgreSQL, Prisma, Express, React, or Vite without a formal decision.
- Do not remove backend auth, role, status, or clinic access checks.
- Do not turn patient or doctor records into login users during the MVP.
- Do not claim advanced AI or trained ML.
- Do not make queue or appointment decisions automatic without product approval.
- Do not edit applied Prisma migrations casually.
- Do not expose backend secrets to the frontend.
