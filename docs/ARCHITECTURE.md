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

- rendering the Admin/Staff app shell
- Clerk sign-in and sign-out UI
- resolving active clinic context through `GET /api/auth/me`
- sending Clerk Bearer tokens through the API client
- rendering dashboard, doctor, patient, appointment, queue, and placeholder clinic settings pages
- showing loading, empty, error, success, and toast states
- displaying starter no-show risk results from the backend

The frontend is not trusted for final authorization, role checks, clinic access, or database writes.

## Backend Responsibility

The backend is responsible for:

- verifying Clerk-authenticated requests
- mapping Clerk identity to the internal `User`
- enforcing `UserStatus.ACTIVE`
- enforcing Admin/Staff role rules
- enforcing single-clinic MVP access through `User.clinicId`
- validating requests with Zod
- running business logic in services
- performing Prisma database access through repositories
- keeping appointment, queue, and prediction writes transactionally consistent
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

## Deployment Shape

The repository is deployable in principle, but no production deployment is configured or proven in the repo.

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

See `docs/DEPLOYMENT.md` for a deployment checklist.

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
