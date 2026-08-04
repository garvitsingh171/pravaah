# Pravaah High-Level Design

## Document Control

| Field                | Value                                                                                                               |
| -------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Architecture version | 1.0                                                                                                                 |
| Verification status  | Verified against repository implementation on 2026-08-04.                                                           |
| Last verified date   | 2026-08-04                                                                                                          |
| Repository scope     | Current repository state for root package version `0.2.0`; `v0.2.0` release verification remains pending.           |
| Intended audience    | Engineers, reviewers, maintainers, interviewers, and AI coding assistants.                                          |
| Maintainer           | Owner verification required for production deployment and personal-contribution claims.                             |
| Change process       | Update this file when architecture, stack, APIs, schema, auth, transactions, deployment, or major workflows change. |

Related documents:

- [Product Requirements](PRODUCT_REQUIREMENTS.md)
- [Architecture Overview](architecture/ARCHITECTURE.md)
- [Backend Structure](architecture/BACKEND_STRUCTURE.md)
- [Frontend Structure](architecture/FRONTEND_STRUCTURE.md)
- [Database Design](architecture/DATABASE_DESIGN.md)
- [API Structure](architecture/API_STRUCTURE.md)
- [API Reference](architecture/API_REFERENCE.md)
- [Auth And Security](architecture/AUTH_AND_SECURITY.md)
- [Testing](guides/TESTING.md)
- [Deployment](guides/DEPLOYMENT.md)
- [AI Context](ai/AI_CONTEXT.md)

Status taxonomy:

| Status                           | Meaning                                                                                      |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| Implemented and deployed         | Repository and deployment evidence prove the capability is live.                             |
| Implemented but not yet released | Code exists, but release or deployment verification is pending.                              |
| Under development                | Implementation is incomplete or known to need follow-up.                                     |
| Planned                          | Future work, not implemented.                                                                |
| Explicitly out of scope          | Deliberately excluded from the current product boundary.                                     |
| Deprecated or historical         | Historical context, not current architecture.                                                |
| Owner verification required      | External deployment, product status, or personal claim cannot be proven from the repository. |

Known limitation disclaimer: this document describes the repository as inspected on 2026-08-04. It does not prove production behavior, uptime, public URLs, customer usage, or external provider configuration.

## Architecture Summary

Pravaah is a two-app TypeScript monorepo: a React/Vite frontend and an Express backend. Clerk provides user identity, the backend maps Clerk identities to internal Pravaah users, Prisma persists clinic workflow data in PostgreSQL, and feature modules enforce clinic-scoped business rules.

Core product spine:

```txt
Authentication
  -> Clinic context
  -> Doctor and Patient relationships
  -> Appointment
  -> Queue
  -> Explainable no-show risk assistance
```

Component diagram:

```mermaid
flowchart LR
    Browser[Browser] --> Web[React + Vite frontend]
    Web --> Clerk[Clerk frontend SDK]
    Web -->|HTTP JSON + Bearer token| API[Express API]
    API --> ClerkAPI[Clerk token verification]
    API --> Services[Feature services]
    Services --> Repositories[Prisma repositories]
    Repositories --> DB[(PostgreSQL)]
```

Architecture principles:

- one monorepo for one product
- feature-oriented frontend and backend modules
- backend-enforced authorization
- relational integrity through Prisma/PostgreSQL
- transactions for related writes
- deterministic and explainable assistance
- human-controlled clinic decisions
- minimal sensitive patient data
- no premature microservices

## System Context

```mermaid
flowchart TD
    User[Admin or Staff in browser]
    WebHost[Frontend static host]
    Clerk[Clerk identity service]
    BackendHost[Node backend host]
    API[Express TypeScript API]
    Prisma[Prisma Client]
    Database[(PostgreSQL database)]

    User --> WebHost
    WebHost --> User
    User --> Clerk
    User -->|HTTPS + Clerk session token| API
    API --> Clerk
    API --> Prisma
    Prisma --> Database
    BackendHost --> API
```

Text fallback:

```txt
Admin/Staff browser
  -> React frontend
  -> Clerk for identity
  -> Express backend with Bearer token
  -> Prisma Client
  -> PostgreSQL
```

Trust boundaries:

- Public frontend routes may render without internal user data.
- Clerk proves identity but does not define Pravaah role or clinic access.
- Backend is the authorization boundary.
- PostgreSQL is the persistence boundary.
- Browser state and request bodies are untrusted for role, status, user ID, clinic ownership, and cross-clinic access.

Deployment context: frontend Vercel rewrite config exists; backend provider and database provider are documented but live deployment URLs, deployed SHAs, production smoke tests, and custom domains require owner verification.

## Technology Decisions

| Technology     | Responsibility          | Why selected                                     | Trade-off                                       | Current limitation                       | Reconsider when                                |
| -------------- | ----------------------- | ------------------------------------------------ | ----------------------------------------------- | ---------------------------------------- | ---------------------------------------------- |
| React 19       | Frontend UI             | Familiar component model and ecosystem.          | Client-side routing needs SPA hosting config.   | No SSR.                                  | SEO or server rendering becomes a requirement. |
| TypeScript     | Frontend/backend typing | Shared language and safer refactors.             | Requires build/type discipline.                 | Types do not replace runtime validation. | Never casually; locked stack.                  |
| Vite           | Frontend build/dev      | Fast local development and simple static output. | Needs backend API host separately.              | No full-stack routing.                   | Full-stack hosting changes scope.              |
| Tailwind CSS   | Styling                 | Utility-first consistent UI.                     | Design consistency is manual.                   | No formal design system package.         | Component system expands.                      |
| Express 5      | Backend API             | Direct REST API with low ceremony.               | Conventions are project-owned.                  | No generated OpenAPI.                    | API surface grows substantially.               |
| Clerk          | Identity                | Avoids custom password/session implementation.   | App still needs internal authorization.         | Provider config external to repo.        | Auth product requirements change.              |
| Prisma         | ORM/schema/migrations   | Typed relational access and migration workflow.  | Some concurrency uses raw SQL locks.            | Generated client ignored.                | Complex SQL dominates.                         |
| PostgreSQL     | Database                | Fits relational clinic workflow and constraints. | Requires operational database management.       | No provider config committed.            | Data model becomes document/search-heavy.      |
| Neon           | Hosted Postgres option  | Works as managed PostgreSQL.                     | Production provider cannot be proven from repo. | Owner verification required.             | Owner chooses another PostgreSQL host.         |
| npm workspaces | Monorepo orchestration  | Simple root scripts for two apps.                | No dedicated build system cache.                | `packages/*` reserved only.              | Workspace count grows.                         |
| Vitest/RTL     | Tests                   | Fast unit/component/business tests.              | No browser E2E suite.                           | Full browser workflows manual.           | Release risk requires E2E.                     |

Rejected directions for current scope: Next.js, MongoDB, Supabase/Firebase as full backend replacement, direct database access from frontend, microservices, patient authentication, and doctor authentication. These are not inherently bad; they are outside the current product and architecture boundary.

## Repository Architecture

```txt
pravaah/
├── apps/
│   ├── web/              # React, Vite, Tailwind frontend
│   │   ├── public/       # Frontend static assets
│   │   └── src/          # Routes, providers, features, UI, API helpers, tests
│   └── server/           # Express API, Prisma schema, migrations, seed, tests
│       ├── prisma/       # schema.prisma, migrations, seed
│       └── src/          # app, server, config, middleware, modules, utils
├── docs/                 # Product, architecture, guides, release, interview, AI docs
├── packages/             # Reserved shared workspace
├── .github/              # Issue templates and PR template
├── package.json          # Root workspace scripts
├── .env.example          # Root example env names
└── README.md
```

There are no tracked GitHub Actions workflow files. Deployment evidence is configuration and documentation only, not live production proof.

## Frontend Architecture

### Entry And Providers

| Area            | Implementation                                                              |
| --------------- | --------------------------------------------------------------------------- |
| Entry           | `apps/web/src/main.tsx`                                                     |
| Root app        | `apps/web/src/App.tsx`                                                      |
| Auth provider   | Clerk `ClerkProvider`                                                       |
| API auth bridge | `ApiAuthProvider` sets API token provider using Clerk `getToken`            |
| Toasts          | `ToastProvider`                                                             |
| Active clinic   | `ActiveClinicProvider` calls `GET /api/auth/me` after onboarding completion |
| Error handling  | Public error boundary and feature-level error states                        |

No Redux, Zustand, React Query, or server-state library is installed in the current frontend. State is primarily local component state, context, custom hooks, URL/query state, and API helper responses.

### Route Matrix

| Route                | Type            | Role                                  | Component               | Data dependency                      | Guard                                | Status                           |
| -------------------- | --------------- | ------------------------------------- | ----------------------- | ------------------------------------ | ------------------------------------ | -------------------------------- |
| `/`                  | Public          | Any visitor                           | `PublicLandingPage`     | Clerk state only                     | Public                               | Implemented but not yet released |
| `/login/*`           | Public/auth     | Signed-out user                       | `LoginPage`             | Clerk UI                             | Redirect signed-in users             | Implemented but not yet released |
| `/sign-up/*`         | Public/auth     | New user                              | `SignUpPage`            | Clerk UI                             | Redirect signed-in users             | Implemented but not yet released |
| `/onboarding`        | Redirect        | Clerk user                            | `Navigate`              | None                                 | Redirect to clinic onboarding        | Implemented but not yet released |
| `/onboarding/clinic` | Onboarding      | Clerk user, possibly no internal user | `ClinicOnboardingPage`  | onboarding APIs                      | Onboarding-aware                     | Implemented but not yet released |
| `/dashboard`         | Protected       | Admin, Staff                          | `DashboardOverviewPage` | auth/current clinic, dashboard APIs  | `ProtectedAppShell`                  | Implemented but not yet released |
| `/doctors`           | Protected       | Admin, Staff                          | `DoctorsPage`           | doctor APIs                          | App shell + clinic                   | Implemented but not yet released |
| `/doctors/new`       | Protected       | Admin, Staff                          | `DoctorCreatePage`      | doctor create API                    | App shell + clinic                   | Implemented but not yet released |
| `/patients`          | Protected       | Admin, Staff                          | `PatientsPage`          | patient APIs                         | App shell + clinic                   | Implemented but not yet released |
| `/patients/new`      | Protected       | Admin, Staff                          | `PatientCreatePage`     | patient create API                   | App shell + clinic                   | Implemented but not yet released |
| `/appointments`      | Protected       | Admin, Staff                          | `AppointmentsPage`      | doctors, patients, appointments APIs | App shell + clinic                   | Implemented but not yet released |
| `/queue`             | Protected       | Admin, Staff                          | `QueuePage`             | queue APIs                           | App shell + clinic                   | Implemented but not yet released |
| `/clinic-settings`   | Protected       | Admin                                 | `ClinicSettingsPage`    | clinic APIs                          | route metadata + backend Admin check | Implemented but not yet released |
| `*`                  | Public fallback | Any                                   | `NotFoundPage`          | Clerk state                          | Public                               | Implemented but not yet released |

Not implemented as routes: doctor detail, patient detail, appointment detail, dedicated unauthorized route, standalone prediction route, patient portal, and doctor portal.

### API Client

`apps/web/src/lib/apiClient.ts`:

- requires `VITE_API_BASE_URL`
- expects the configured base URL to end in `/api`
- attaches `Authorization: Bearer <token>` when a token is available
- serializes query params while skipping `null` and `undefined`
- parses standard success/error envelopes
- maps network, abort, base URL, and invalid-response failures to `ApiClientError`
- has no retry policy

### Forms And Shared UI

Forms use React component state and local validation/helpers rather than a form library. Server validation errors are mapped into UI error states. Duplicate submits are generally prevented through disabled loading states. Shared UI includes buttons, badges, empty states, loading states, status/risk presentation, form sections, form errors, and confirmation dialogs. Dialog focus management must keep focus inside the modal for the full dialog lifetime, including pending confirmation states.

### Date And Timezone

Appointments are sent as ISO datetimes. Backend dashboard and queue queries interpret selected dates using clinic timezone-aware date ranges. Frontend date filters use `YYYY-MM-DD` strings. Known risks include timezone edge cases, past-date booking, clinic-hours enforcement, and browser-local display differences.

## Backend Architecture

Actual backend structure:

```txt
apps/server/src/
├── app.ts
├── server.ts
├── config/
├── generated/
├── middleware/
├── modules/
│   ├── appointments/
│   ├── auth/
│   ├── clinics/
│   ├── dashboard/
│   ├── doctors/
│   ├── health/
│   ├── patients/
│   ├── predictions/
│   └── queues/
└── utils/
```

`apps/server/src/generated/prisma` is generated and ignored as architectural source of truth; `apps/server/prisma/schema.prisma` owns the schema.

Request flow:

```txt
HTTP request
  -> Express shared middleware
  -> Clerk middleware
  -> feature route middleware
  -> authentication and authorization
  -> Zod validation
  -> controller
  -> service
  -> repository
  -> Prisma
  -> PostgreSQL
  -> controller success response or global error handler
```

Module responsibilities:

| Module         | Purpose                                            | Routes                                                                           | Key model(s)                                    | Important transactions/errors                                                     |
| -------------- | -------------------------------------------------- | -------------------------------------------------------------------------------- | ----------------------------------------------- | --------------------------------------------------------------------------------- |
| `health`       | Health check.                                      | `GET /api/health`                                                                | None                                            | No auth.                                                                          |
| `auth`         | Current user, onboarding status, clinic bootstrap. | `/api/auth/me`, `/onboarding-status`, `/onboarding/clinic`                       | `User`, `Clinic`                                | Clinic/Admin transaction; provisioning conflicts.                                 |
| `clinics`      | Settings and sample data.                          | `/api/clinics`, `/:clinicId`, `/:clinicId/sample-data`                           | `Clinic`, all sample models                     | Standalone create disabled; sample data transaction/advisory lock.                |
| `doctors`      | Doctor create/list/update.                         | `/api/clinics/:clinicId/doctors`                                                 | `Doctor`, `DoctorClinic`                        | Create transaction.                                                               |
| `patients`     | Patient create/list/update.                        | `/api/clinics/:clinicId/patients`                                                | `Patient`, `PatientClinic`                      | Create/update transactions.                                                       |
| `appointments` | Booking, listing, status updates.                  | `/api/clinics/:clinicId/appointments`, `/api/appointments/:appointmentId/status` | `Appointment`, `QueueEntry`, `NoShowPrediction` | Slot lock, conflict check, appointment/queue/prediction transaction, status sync. |
| `queues`       | Queue listing, status, reorder.                    | `/api/clinics/:clinicId/queue`                                                   | `QueueEntry`, `Appointment`                     | Status sync transaction, reorder transaction.                                     |
| `dashboard`    | Summary, high-risk, activity.                      | `/api/clinics/:clinicId/dashboard/...`                                           | `Appointment`, `QueueEntry`, `NoShowPrediction` | Prediction backfill.                                                              |
| `predictions`  | Deterministic risk scoring service.                | No standalone route                                                              | `NoShowPrediction`                              | Called by appointment/dashboard services.                                         |

Route layer composes path, method, middleware, validation, and controller binding. Controllers read validated input, call services, return `{ success, message, data }`, and pass errors to `next`. Services own business rules and expected `AppError`s. Repositories own Prisma reads/writes, transactions, includes, and projections.

## Authentication Architecture

```mermaid
sequenceDiagram
    participant User as Admin or Staff
    participant Web as React app
    participant Clerk as Clerk
    participant API as Express API
    participant DB as PostgreSQL
    User->>Web: Sign in
    Web->>Clerk: Clerk session established
    Web->>Clerk: getToken()
    Clerk-->>Web: Session token
    Web->>API: Request with Authorization: Bearer token
    API->>Clerk: Verify token via Clerk middleware/getAuth
    API->>DB: Resolve User by clerkUserId
    API->>API: Check User.status, role, clinic access
    API->>DB: Perform scoped operation
    DB-->>API: Scoped result
    API-->>Web: JSON response
```

Onboarding exception: `GET /api/auth/onboarding-status` and `POST /api/auth/onboarding/clinic` require a valid Clerk identity but allow the internal `User` row to be missing. They do not become anonymous APIs. Trusted identity is resolved server-side from Clerk, and client role/clinic ownership values are not trusted.

## Authorization Architecture

```mermaid
flowchart TD
    A[Request] --> B{Bearer token valid?}
    B -- No --> C[401 authentication error]
    B -- Yes --> D{Internal User exists and ACTIVE?}
    D -- No --> E[401/403 auth or recovery error]
    D -- Yes --> F{Role allowed?}
    F -- No --> G[403 role error]
    F -- Yes --> H{Clinic/resource belongs to user clinic?}
    H -- No --> I[403 clinic access error]
    H -- Yes --> J[Service operation]
```

Role storage is `User.role`. User status is `User.status`. Clinic context is the current MVP `User.clinicId`. Doctor/patient scoping is verified through `DoctorClinic` and `PatientClinic`. Appointment status routes derive clinic from the appointment because the route does not include `clinicId`. Queue routes verify queue entry clinic. Frontend role-aware navigation is convenience only; backend middleware and services enforce security.

## Data Architecture

```mermaid
erDiagram
    Clinic ||--o{ User : has
    Clinic ||--o{ DoctorClinic : links
    Doctor ||--o{ DoctorClinic : links
    Clinic ||--o{ PatientClinic : links
    Patient ||--o{ PatientClinic : links
    Clinic ||--o{ Appointment : owns
    Doctor ||--o{ Appointment : attends
    Patient ||--o{ Appointment : books
    User ||--o{ Appointment : creates
    Appointment ||--o| QueueEntry : has
    Appointment ||--o| NoShowPrediction : has
    Clinic ||--o{ QueueEntry : owns
    Patient ||--o{ NoShowPrediction : has
```

Model summary:

| Model              | Purpose                            | Key fields/defaults                                                                           | Relationships and constraints                                              | Current limitation                                     |
| ------------------ | ---------------------------------- | --------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ |
| `User`             | Internal app user mapped to Clerk. | `clerkUserId` unique, `email` unique, `role`, `status`, optional `clinicId`.                  | Many users to one clinic with `SetNull`; indexes on clinic, role, status.  | Single-clinic access model.                            |
| `Clinic`           | Clinic tenant and settings.        | `slug` unique, timezone, hours, slot duration, buffer, `isActive`.                            | Has users, links, appointments, queue, predictions.                        | No active-state settings update endpoint.              |
| `Doctor`           | Provider profile.                  | name, specialization, qualification, contact, gender, experience, `isActive`.                 | Linked to clinics through `DoctorClinic`; appointments restrict deletion.  | No login or schedule model.                            |
| `DoctorClinic`     | Doctor-clinic join.                | `doctorId`, `clinicId`, `isActive`, optional display name and fee.                            | Unique `(doctorId, clinicId)`; cascade from doctor/clinic.                 | Link fields not exposed in current edit API.           |
| `Patient`          | Patient profile.                   | name, phone, optional demographics/address/emergency contact, `isActive`.                     | Linked to clinics through `PatientClinic`; appointments restrict deletion. | No login or full medical record.                       |
| `PatientClinic`    | Clinic-specific patient history.   | total appointments/no-shows/late arrivals, last visit, notes, distance, `isActive`.           | Unique `(patientId, clinicId)`; cascade from patient/clinic.               | Some counters are not updated by all status flows.     |
| `Appointment`      | Scheduled visit.                   | clinic, doctor, patient, creator, scheduledAt, duration, status, source, reason/notes.        | Partial unique active doctor/time index; many query indexes.               | Exact start-time conflict only; no duration overlap.   |
| `QueueEntry`       | Daily queue record.                | unique appointment, clinic, doctor, patient, position, status, queued/called/completed times. | Indexes by status, doctor/position, queuedAt.                              | Created during booking, including future appointments. |
| `NoShowPrediction` | Stored deterministic risk.         | unique appointment, clinic, patient, riskLevel, score, reasons JSON.                          | Indexes by clinic and patient.                                             | No persisted model version column.                     |

## Enums And State Models

Enums from `schema.prisma`:

- `UserRole`: `ADMIN`, `STAFF`
- `UserStatus`: `INVITED`, `ACTIVE`, `SUSPENDED`
- `Gender`: `MALE`, `FEMALE`, `OTHER`, `PREFER_NOT_TO_SAY`
- `AppointmentStatus`: `SCHEDULED`, `CONFIRMED`, `ARRIVED`, `IN_QUEUE`, `CALLED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`
- `QueueStatus`: `WAITING`, `ARRIVED`, `CALLED`, `COMPLETED`, `CANCELLED`, `NO_SHOW`
- `RiskLevel`: `LOW`, `MEDIUM`, `HIGH`
- `BookingSource`: `RECEPTION`, `PHONE`, `WEB`, `WALK_IN`

Appointment state design:

```mermaid
stateDiagram-v2
    [*] --> SCHEDULED
    SCHEDULED --> CONFIRMED
    CONFIRMED --> ARRIVED
    ARRIVED --> IN_QUEUE
    IN_QUEUE --> CALLED
    CALLED --> COMPLETED
    SCHEDULED --> CANCELLED
    CONFIRMED --> CANCELLED
    ARRIVED --> CANCELLED
    IN_QUEUE --> CANCELLED
    CALLED --> CANCELLED
    SCHEDULED --> NO_SHOW
    CONFIRMED --> NO_SHOW
    ARRIVED --> NO_SHOW
    IN_QUEUE --> NO_SHOW
    CALLED --> NO_SHOW
```

Text note: this diagram is the intended human workflow. Current code allows any non-final appointment status to move to any enum value and blocks changes only after `COMPLETED`, `CANCELLED`, or `NO_SHOW`.

Queue lifecycle:

```mermaid
stateDiagram-v2
    [*] --> WAITING
    WAITING --> ARRIVED
    ARRIVED --> CALLED
    CALLED --> COMPLETED
    WAITING --> CANCELLED
    ARRIVED --> CANCELLED
    CALLED --> CANCELLED
    WAITING --> NO_SHOW
    ARRIVED --> NO_SHOW
    CALLED --> NO_SHOW
```

Current code allows broad non-final queue status changes and blocks changes after final statuses.

## Database Constraints And Indexes

Key protections:

- unique `User.clerkUserId`
- unique `User.email`
- unique `Clinic.slug`
- unique `DoctorClinic(doctorId, clinicId)`
- unique `PatientClinic(patientId, clinicId)`
- unique `QueueEntry.appointmentId`
- unique `NoShowPrediction.appointmentId`
- partial unique appointment index on `(clinicId, doctorId, scheduledAt)` for active appointment statuses
- indexes for clinic, status, role, doctor/date, patient/date, queue status, queue position, queued time, prediction clinic/patient

Foreign-key behavior includes cascade for doctor/patient clinic links and restrict behavior for operational history such as appointments, queue entries, and predictions. Active flags are soft-deactivation fields, not hard-delete mechanisms.

## API Architecture And Catalog

| Method | Path                                                      | Auth/role      | Scope              | Params/query/body                 | Response resource                    | Important errors                 | Controller/service/repository             | Status                           |
| ------ | --------------------------------------------------------- | -------------- | ------------------ | --------------------------------- | ------------------------------------ | -------------------------------- | ----------------------------------------- | -------------------------------- |
| GET    | `/api/health`                                             | Public         | None               | None                              | health message                       | N/A                              | health router                             | Implemented but not yet released |
| GET    | `/api/auth/onboarding-status`                             | Clerk identity | Current Clerk user | None                              | onboarding, user, clinic, setup      | auth token errors                | auth controller/service/repository        | Implemented but not yet released |
| POST   | `/api/auth/onboarding/clinic`                             | Clerk identity | Current Clerk user | body clinic profile               | onboarding, user, clinic, setup      | slug/provisioning conflicts      | auth controller/service/repository        | Implemented but not yet released |
| GET    | `/api/auth/me`                                            | Active user    | User clinic        | None                              | current user and clinic              | internal user/user active errors | auth controller/service/repository        | Implemented but not yet released |
| POST   | `/api/clinics`                                            | Admin          | Disabled           | None                              | none                                 | standalone disabled              | clinic controller                         | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId`                                  | Admin          | Route clinic       | `clinicId`                        | clinic settings                      | access/admin/validation          | clinic controller/service/repository      | Implemented but not yet released |
| PATCH  | `/api/clinics/:clinicId`                                  | Admin          | Route clinic       | settings body                     | clinic settings                      | access/admin/validation          | clinic controller/service/repository      | Implemented but not yet released |
| POST   | `/api/clinics/:clinicId/sample-data`                      | Admin          | Route clinic       | empty body                        | sample data summary                  | admin/access/timezone            | clinic controller/service/repository      | Implemented but not yet released |
| POST   | `/api/clinics/:clinicId/doctors`                          | Admin/Staff    | Route clinic       | doctor body                       | doctor                               | access/validation                | doctor controller/service/repository      | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/doctors`                          | Admin/Staff    | Route clinic       | none                              | doctors                              | access                           | doctor controller/service/repository      | Implemented but not yet released |
| PATCH  | `/api/clinics/:clinicId/doctors/:doctorId`                | Admin/Staff    | Route clinic/link  | doctor update body                | doctor                               | not found/link/access            | doctor controller/service/repository      | Implemented but not yet released |
| POST   | `/api/clinics/:clinicId/patients`                         | Admin/Staff    | Route clinic       | patient body                      | patient                              | access/validation                | patient controller/service/repository     | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/patients`                         | Admin/Staff    | Route clinic       | `search`, `isActive`              | patients                             | access/validation                | patient controller/service/repository     | Implemented but not yet released |
| PATCH  | `/api/clinics/:clinicId/patients/:patientId`              | Admin/Staff    | Route clinic/link  | patient update body               | patient                              | not found/link/access            | patient controller/service/repository     | Implemented but not yet released |
| POST   | `/api/clinics/:clinicId/appointments`                     | Admin/Staff    | Route clinic       | appointment body                  | appointment, queue entry, prediction | slot/link/validation             | appointment controller/service/repository | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/appointments`                     | Admin/Staff    | Route clinic       | date, doctorId, patientId, status | appointments                         | link/date/validation             | appointment controller/service/repository | Implemented but not yet released |
| PATCH  | `/api/appointments/:appointmentId/status`                 | Admin/Staff    | Appointment clinic | status body                       | appointment                          | final/sync/access                | appointment controller/service/repository | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/queue`                            | Admin/Staff    | Route clinic/date  | date query                        | queue entries                        | access/validation                | queue controller/service/repository       | Implemented but not yet released |
| PATCH  | `/api/clinics/:clinicId/queue/:queueEntryId/status`       | Admin/Staff    | Route clinic/entry | status body                       | queue entry                          | final/sync/access                | queue controller/service/repository       | Implemented but not yet released |
| PATCH  | `/api/clinics/:clinicId/queue/reorder`                    | Admin/Staff    | Route clinic/date  | date, queueEntryIds               | queue entries                        | incomplete/final/conflict        | queue controller/service/repository       | Under development                |
| GET    | `/api/clinics/:clinicId/dashboard/summary`                | Admin/Staff    | Route clinic/date  | date query                        | summary                              | access/date                      | dashboard controller/service/repository   | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/dashboard/high-risk-appointments` | Admin/Staff    | Route clinic/date  | date query                        | high-risk appointments               | access/date                      | dashboard controller/service/repository   | Implemented but not yet released |
| GET    | `/api/clinics/:clinicId/dashboard/today-activity`         | Admin/Staff    | Route clinic/today | none                              | activity items                       | access                           | dashboard controller/service/repository   | Implemented but not yet released |
| GET    | `/`                                                       | Public         | None               | none                              | welcome message                      | N/A                              | app root route                            | Implemented but not yet released |

Planned or absent endpoints: doctor detail, patient detail, appointment detail, standalone prediction API, setup-status-only endpoint, patient portal APIs, doctor portal APIs, notification APIs, staff-management APIs.

## API Response, Validation, And Error Design

Success:

```json
{
    "success": true,
    "message": "Readable success message",
    "data": {
        "resource": {}
    }
}
```

Error:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Readable explanation"
    }
}
```

Validation errors include `error.details`. `validateRequest` parses params/body onto the request and stores parsed query in `res.locals.validatedQuery`. Zod schemas validate UUID-shaped params, ISO datetimes, `YYYY-MM-DD` dates, enums, strict onboarding bodies, update objects with at least one field, and numeric bounds.

Error flow:

```txt
Validation or service error
  -> AppError or known error
  -> controller next(error)
  -> global error handler
  -> consistent JSON response
```

The global error handler maps `AppError`, malformed JSON, selected auth errors, Prisma unique conflicts, Prisma record-not-found errors, and unexpected failures. Unexpected failures are logged server-side and returned as generic internal errors.

## Core Sequence Diagrams

### Doctor Creation

```mermaid
sequenceDiagram
    participant Web
    participant API
    participant Service
    participant Repo
    participant DB
    Web->>API: POST /api/clinics/:clinicId/doctors
    API->>API: Authenticate, clinic access, Admin/Staff, Zod
    API->>Service: create doctor
    Service->>Repo: createDoctorWithClinicLink
    Repo->>DB: Transaction creates Doctor and DoctorClinic
    DB-->>Repo: Commit
    Repo-->>Service: Doctor response
    Service-->>API: Result
    API-->>Web: success
```

### Patient Creation

```mermaid
sequenceDiagram
    participant Web
    participant API
    participant Repo
    participant DB
    Web->>API: POST /api/clinics/:clinicId/patients
    API->>API: Authenticate, clinic access, Admin/Staff, Zod
    API->>Repo: Transaction creates Patient and PatientClinic
    Repo->>DB: Commit or rollback
    DB-->>API: Patient response
```

### Clinic And Admin Provisioning

```mermaid
sequenceDiagram
    participant Web
    participant API
    participant Clerk
    participant DB
    Web->>API: POST /api/auth/onboarding/clinic
    API->>Clerk: Resolve trusted identity
    API->>DB: Check current onboarding state and slug
    API->>DB: Transaction creates Clinic and ADMIN User
    DB-->>API: Commit or conflict
    API-->>Web: Completed onboarding or safe conflict
```

### Appointment Arrival And Queue Integration

```mermaid
flowchart TD
    A[Appointment exists with QueueEntry from booking] --> B[Staff updates appointment or queue status]
    B --> C[Backend verifies access and non-final current state]
    C --> D[Repository transaction]
    D --> E[Appointment status synchronized]
    D --> F[QueueEntry status and timestamps synchronized]
    E --> G[Response]
    F --> G
```

### Queue Reorder

```mermaid
sequenceDiagram
    participant Web
    participant API
    participant Service
    participant Repo
    participant DB
    Web->>API: PATCH /api/clinics/:clinicId/queue/reorder
    API->>API: Authenticate, clinic access, Admin/Staff, validate
    API->>Service: reorderQueue(date, ids)
    Service->>DB: Load active queue entries for clinic/date
    Service->>Service: Verify all ids, no finals, complete set
    Service->>Repo: two-phase reorder
    Repo->>DB: Transaction temp positions then final positions
    DB-->>API: Ordered queue entries
```

### Prediction Generation

```mermaid
flowchart TD
    A[Appointment booking or dashboard backfill] --> B[Load patient history and timing inputs]
    B --> C[Apply deterministic rules]
    C --> D[Clamp score 0 to 100]
    D --> E{Score}
    E -->|0-29| F[LOW]
    E -->|30-59| G[MEDIUM]
    E -->|60-100| H[HIGH]
    F --> I[Store NoShowPrediction]
    G --> I
    H --> I
    I --> J[Return reasons and suggested actions]
```

### Dashboard Loading

```mermaid
flowchart TD
    A[Dashboard opens] --> B[Resolve active clinic]
    B --> C[Request summary, high-risk, activity]
    C --> D[Backend computes clinic-local date range]
    D --> E[Backfill missing active appointment predictions]
    E --> F[Aggregate appointment, queue, risk data]
    F --> G[Return dashboard data]
```

## Transaction Design

| Trigger             | Records involved                                    | Business reason                                   | Commit together                   | Failure behavior                          | Path                        | Limitation                                          |
| ------------------- | --------------------------------------------------- | ------------------------------------------------- | --------------------------------- | ----------------------------------------- | --------------------------- | --------------------------------------------------- |
| Clinic onboarding   | `Clinic`, first `User`                              | Prevent orphan clinic and user mismatch.          | Clinic and Admin.                 | Rollback and mapped conflict.             | `auth.repository.ts`        | Production verification pending.                    |
| Sample data         | doctors, patients, appointments, queue, predictions | Demo data must be isolated and repeat-safe.       | Full sample set.                  | Rollback or already-provisioned response. | `clinic.repository.ts`      | Demo-only.                                          |
| Doctor creation     | `Doctor`, `DoctorClinic`                            | Doctor must be linked to clinic.                  | Both records.                     | Rollback.                                 | `doctor.repository.ts`      | Link settings update not exposed.                   |
| Patient creation    | `Patient`, `PatientClinic`                          | Patient history must be clinic-linked.            | Both records.                     | Rollback.                                 | `patient.repository.ts`     | Counters can drift later.                           |
| Patient update      | `Patient`, `PatientClinic`                          | Profile and clinic history may update together.   | Requested fields.                 | Rollback.                                 | `patient.repository.ts`     | Link active field not exposed.                      |
| Appointment booking | `Appointment`, `QueueEntry`, `NoShowPrediction`     | Booking creates operational queue/risk context.   | All related writes.               | Rollback; conflicts mapped.               | `appointment.repository.ts` | Exact-slot conflict only.                           |
| Appointment status  | `Appointment`, `QueueEntry` where mapped            | Keep statuses consistent.                         | Appointment and queue status.     | Conflict or rollback.                     | `appointment.repository.ts` | No PatientClinic counter update.                    |
| Queue status        | `QueueEntry`, `Appointment`                         | Keep queue and appointment synchronized.          | Queue and appointment status.     | Conflict or rollback.                     | `queue.repository.ts`       | Broad transition rules.                             |
| Queue reorder       | `QueueEntry.position` rows                          | Avoid duplicate positions during reorder.         | Temporary and final positions.    | Rollback.                                 | `queue.repository.ts`       | Validation not doctor-scoped.                       |
| Dashboard backfill  | `NoShowPrediction` rows                             | Fill missing prediction records before summaries. | Bulk create with skip duplicates. | Dashboard error path.                     | `dashboard.service.ts`      | Backfill inputs are more limited than booking path. |

## Concurrency Design

| Area                 | Race condition                       | Protection                                                                | Scope                                | Remaining risk                                      |
| -------------------- | ------------------------------------ | ------------------------------------------------------------------------- | ------------------------------------ | --------------------------------------------------- |
| Clinic onboarding    | Duplicate user/clinic creation.      | Unique constraints and current-identity re-read after conflict.           | `User.clerkUserId`, `Clinic.slug`.   | External Clerk/provider runtime pending.            |
| Appointment conflict | Two bookings same doctor/time.       | PostgreSQL advisory lock plus active-slot query and partial unique index. | Clinic, doctor, exact `scheduledAt`. | Duration overlap not prevented.                     |
| Queue position       | Two bookings get same next position. | Advisory lock and max position query.                                     | Clinic, doctor, clinic-local date.   | Future appointments also get queue entries.         |
| Queue status         | Concurrent final/status updates.     | Transaction and final-state checks.                                       | Queue entry and appointment.         | Broad status graph.                                 |
| Queue reorder        | Duplicate positions during reorder.  | Two-phase temporary positions inside transaction.                         | Active clinic/date entries.          | Doctor-scope validation gap.                        |
| Prediction backfill  | Duplicate prediction insertion.      | `skipDuplicates` and appointment unique constraint.                       | Appointment.                         | Rules can generate stale scores if history changes. |

## No-Show Risk Architecture

`apps/server/src/modules/predictions/prediction.service.ts` implements deterministic starter rules.

Inputs:

- previous no-show count
- completed appointment count
- clinic-specific late-arrival count
- distance from clinic
- scheduled time versus booking time
- new-patient and strong-attendance signals

Rule behavior:

- previous no-shows add risk
- late arrivals add risk
- longer distance can add risk
- short-notice booking adds risk
- long-advance booking adds risk
- new patient adds risk
- strong attendance can reduce risk
- score is clamped from 0 to 100
- `MEDIUM` begins at 30 and `HIGH` begins at 60
- response version is `starter-rule-v1`

Storage: `NoShowPrediction` stores appointment, clinic, patient, risk level, score, JSON reasons, and timestamps. Suggested actions and version are response-layer fields. There is no trained model, no accuracy claim, and no automatic action.

## Security Architecture

- `VITE_CLERK_PUBLISHABLE_KEY` is public frontend configuration.
- `CLERK_SECRET_KEY` and `DATABASE_URL` are backend secrets.
- `VITE_API_BASE_URL` points frontend to backend `/api`.
- Backend CORS uses `CLIENT_URL` and `LOCAL_CLIENT_URL`.
- Protected routes require Clerk Bearer tokens.
- Internal roles and status are stored in `User`.
- Clinic access is checked server-side.
- Request shapes are validated by Zod.
- Seed/sample data must be fictional.
- `.env` files are ignored; examples contain placeholders.
- Known gaps: no formal audit logging, no advanced monitoring, no penetration test evidence, no field-level privacy model beyond current route scoping.

## Deployment Architecture

```mermaid
flowchart LR
    Browser --> Frontend[Static frontend host]
    Frontend -->|VITE_API_BASE_URL| Backend[Node backend host]
    Backend -->|DATABASE_URL| DB[(PostgreSQL)]
    Browser --> Clerk[Clerk]
    Backend --> Clerk
```

Repository evidence:

- Frontend static build command: `npm run build:web`
- Frontend output: `apps/web/dist`
- Frontend SPA rewrite config: `apps/web/vercel.json`
- Backend build command: `npm run build --workspace apps/server`
- Backend start command: `npm run start --workspace apps/server`
- Production migrations command: `npm run prisma:migrate:deploy --workspace apps/server`
- Health endpoint: `GET /api/health`

Owner verification required:

- frontend provider and public domain
- backend provider and public URL
- database provider
- deployed commit SHA
- production Clerk configuration
- main-branch deployment behavior
- custom domain behavior
- production smoke-test results

No secrets are documented here.

## Environment Variables

| Variable                     | Workspace   | Use             | Public/secret             | Required               | Purpose                                                     | Example placeholder                       |
| ---------------------------- | ----------- | --------------- | ------------------------- | ---------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| `NODE_ENV`                   | server/root | dev/prod        | public-ish runtime flag   | optional               | Runtime environment.                                        | `production`                              |
| `PORT`                       | server      | dev/prod        | public-ish runtime config | optional               | Backend listen port.                                        | `5000`                                    |
| `CLIENT_URL`                 | server      | dev/prod        | public origin             | required in production | Allowed frontend origin.                                    | `https://frontend.example.com`            |
| `LOCAL_CLIENT_URL`           | server      | dev             | public origin             | optional               | Local CORS origin.                                          | `http://localhost:5173`                   |
| `DATABASE_URL`               | server      | dev/prod        | secret                    | required               | PostgreSQL connection string.                               | `postgresql://USER:PASSWORD@HOST:PORT/DB` |
| `CLERK_SECRET_KEY`           | server      | dev/prod        | secret                    | required               | Backend Clerk verification.                                 | `sk_...`                                  |
| `CLERK_WEBHOOK_SECRET`       | server      | future/optional | secret                    | optional               | Example value exists; current source does not use webhooks. | `whsec_...`                               |
| `VITE_API_BASE_URL`          | web         | dev/prod        | public                    | required               | Backend API base ending in `/api`.                          | `http://localhost:5000/api`               |
| `VITE_CLERK_PUBLISHABLE_KEY` | web         | dev/prod        | public                    | required               | Clerk frontend key.                                         | `pk_...`                                  |
| `VITE_DEFAULT_CLINIC_ID`     | web         | legacy/demo     | public                    | optional               | Legacy fallback clinic ID.                                  | `00000000-0000-4000-8000-000000000000`    |
| `SEED_CLERK_USER_ID`         | server seed | dev             | secret-ish test config    | optional               | Demo Admin Clerk mapping.                                   | `user_...`                                |
| `DEV_CLERK_USER_ID`          | server seed | dev             | secret-ish test config    | optional               | Alternate demo Admin Clerk mapping.                         | `user_...`                                |
| `SEED_STAFF_CLERK_USER_ID`   | server seed | dev             | secret-ish test config    | optional               | Demo Staff Clerk mapping.                                   | `user_...`                                |
| `SEED_USER_EMAIL`            | server seed | dev             | fake data                 | optional               | Demo Admin email.                                           | `local-admin@pravaah.local`               |
| `SEED_USER_FULL_NAME`        | server seed | dev             | fake data                 | optional               | Demo Admin name.                                            | `Local Pravaah Admin`                     |
| `SEED_STAFF_USER_EMAIL`      | server seed | dev             | fake data                 | optional               | Demo Staff email.                                           | `local-staff@pravaah.local`               |
| `SEED_STAFF_USER_FULL_NAME`  | server seed | dev             | fake data                 | optional               | Demo Staff name.                                            | `Local Pravaah Staff`                     |
| `SEED_DEMO_CLINIC_ID`        | server seed | dev             | fake data                 | optional               | Stable demo clinic UUID.                                    | `00000000-0000-4000-8000-000000000000`    |

## Reliability And Failure Handling

| Failure                     | Handling                                                                               | Gap                                    |
| --------------------------- | -------------------------------------------------------------------------------------- | -------------------------------------- |
| Database connection failure | Request fails and global handler returns generic server error; provider logs required. | No circuit breaker or monitoring.      |
| Clerk verification failure  | Auth middleware returns authentication error.                                          | Runtime provider verification pending. |
| Missing internal user       | Protected APIs reject; onboarding-aware APIs can return `NOT_STARTED`.                 | Manual workflow verification pending.  |
| Unauthorized clinic         | Access service rejects.                                                                | Multi-clinic model planned.            |
| Validation failure          | `VALIDATION_ERROR` with details.                                                       | No generated contract docs.            |
| Transaction failure         | Transaction rolls back related writes.                                                 | Some workflows lack counter updates.   |
| Appointment conflict        | `APPOINTMENT_SLOT_CONFLICT`.                                                           | No duration-overlap conflict.          |
| Queue conflict              | Final-state/sync/reorder conflicts.                                                    | Broad transition graph.                |
| Prediction failure          | Surrounding request fails unless handled by dashboard backfill path.                   | No separate risk retry UI.             |
| Frontend network failure    | API client maps structured frontend errors.                                            | No retry policy.                       |
| Deployment failure          | Owner must inspect provider logs and health endpoint.                                  | No CI/CD workflow committed.           |

## Observability

Implemented:

- `GET /api/health`
- server-side logging for unexpected errors and onboarding/sample-data events
- frontend error states and toast messages
- provider logs available only through hosting providers, not repository code

Not implemented:

- structured centralized logs
- metrics
- tracing
- alerts
- Sentry or analytics integration
- audit log for appointment/queue changes

## Performance And Scalability

Current design is intended for small/medium clinic operations, not proven high-scale workloads. It uses clinic-scoped queries, date filters, selected includes, grouped dashboard queries, and indexes aligned to appointments, queues, patients, doctors, and predictions. Pagination is not implemented. N+1 risk is mitigated in main reads with Prisma includes, but large-history scaling needs pagination and query review. Microservices are unnecessary for the current scope.

## Testing Architecture

Backend tests use Vitest under `apps/server/src/modules/**/__tests__`. Covered areas include auth/access, onboarding, clinics, appointments, queue, dashboard, predictions, and validation. Frontend tests use Vitest, jsdom, React Testing Library, jest-dom, and user-event under `apps/web/src/**/*.test.tsx` and related test files. They mock Clerk and feature APIs.

Browser-based E2E testing is intentionally absent. Manual workflow checks are required before release. This documentation task did not run test suites, builds, migrations, deployments, or browser screenshots.

## Design Decisions And Trade-Offs

| Decision                 | Context                     | Alternatives                 | Benefit                                | Trade-off                               | Reconsider when                   |
| ------------------------ | --------------------------- | ---------------------------- | -------------------------------------- | --------------------------------------- | --------------------------------- |
| PostgreSQL               | Relational clinic workflow. | MongoDB.                     | Strong relations and constraints.      | Requires DB operations.                 | Document-like data dominates.     |
| Prisma                   | Typed database access.      | Raw SQL everywhere.          | Fast schema-driven development.        | Raw SQL still needed for locks/indexes. | Query complexity grows.           |
| Clerk                    | Identity provider.          | Custom password auth.        | Reduces auth risk.                     | External provider dependency.           | Custom identity becomes required. |
| Internal roles           | App authorization.          | Clerk metadata only.         | Server-owned role/status/clinic truth. | Extra user table.                       | Central org auth is introduced.   |
| Monorepo                 | One product, two apps.      | Multiple repos.              | Easier coordinated changes.            | Workspace discipline needed.            | Teams/services split.             |
| React + Vite             | SPA frontend.               | Next.js.                     | Simple static frontend.                | No SSR.                                 | SSR/SEO becomes critical.         |
| `DoctorClinic`           | Future-ready doctor links.  | Doctor owns one clinic.      | Supports future multi-clinic doctors.  | More joins.                             | Never remove casually.            |
| `PatientClinic`          | Clinic-specific history.    | Global patient history only. | Correct clinic-scoped risk context.    | More joins/counter consistency.         | Never remove casually.            |
| `User.clinicId`          | MVP user access.            | Membership table now.        | Simple secure access.                  | Not full SaaS.                          | Multi-clinic users required.      |
| Deterministic prediction | No reliable dataset.        | Trained ML.                  | Explainable and honest.                | Limited predictive power.               | Enough validated data exists.     |
| Human queue control      | Staff remain responsible.   | Automatic queue optimizer.   | Safer clinic operations.               | Manual workload remains.                | Clear automation policy exists.   |
| Soft deactivation        | Preserve history.           | Hard delete.                 | Safer operational records.             | More active filtering.                  | Retention rules defined.          |

## Known Technical Limitations

- `User.clinicId` is not multi-clinic membership.
- No doctor scheduling/availability model.
- No patient or doctor portal.
- No notifications or reminder integrations.
- No trained ML.
- Limited prediction inputs and no stored model version field.
- Limited observability and no audit log.
- No browser E2E suite.
- Deployment verification gaps.
- Broad appointment and queue transition behavior.
- Queue reorder validation is clinic/date scoped, not doctor/date scoped.
- Appointment conflict is exact same `scheduledAt`, not duration overlap.
- PatientClinic counters can drift because status updates do not update every history field.

## Future Architecture Direction

Future work should stay separate from current implementation:

- `UserClinic` or `ClinicMember`
- doctor schedule and availability windows
- stricter appointment/queue transition tables
- doctor-scoped queue reorder validation
- notifications and reminder logs
- audit logs
- prediction history and versioned scoring
- trained model only after enough safe historical data
- patient portal
- doctor portal
- multi-clinic access
- analytics, monitoring, and alerting
- mobile client

## PRD-To-HLD Traceability

| PRD requirement | HLD component                               | Frontend area          | Backend module       | Database model                                  | API                           | Test evidence      | Status                           |
| --------------- | ------------------------------------------- | ---------------------- | -------------------- | ----------------------------------------------- | ----------------------------- | ------------------ | -------------------------------- |
| PR-AUTH-001     | Authentication architecture                 | `ApiAuthProvider`      | `auth` middleware    | `User`                                          | protected endpoints           | auth tests         | Implemented but not yet released |
| PR-AUTH-003     | Authorization architecture                  | `ProtectedAppShell`    | `access.service.ts`  | `User`, `Clinic`                                | clinic-scoped routes          | access tests       | Implemented but not yet released |
| PR-ONB-002      | Onboarding exception and transaction design | `ClinicOnboardingPage` | `auth`               | `Clinic`, `User`                                | `/api/auth/onboarding/clinic` | onboarding tests   | Implemented but not yet released |
| PR-CLINIC-001   | API catalog and data architecture           | `ClinicSettingsPage`   | `clinics`            | `Clinic`                                        | `/api/clinics/:clinicId`      | clinic tests       | Implemented but not yet released |
| PR-DOC-001      | Transaction design                          | doctor feature         | `doctors`            | `Doctor`, `DoctorClinic`                        | doctor routes                 | doctor tests       | Implemented but not yet released |
| PR-PAT-001      | Transaction design                          | patient feature        | `patients`           | `Patient`, `PatientClinic`                      | patient routes                | patient tests      | Implemented but not yet released |
| PR-PAT-003      | Known limitations                           | `PatientsPage`         | `patients`           | `Patient`, `PatientClinic`                      | patient list                  | patient page tests | Under development                |
| PR-APT-001      | Appointment sequence and transaction design | `AppointmentsPage`     | `appointments`       | `Appointment`, `QueueEntry`, `NoShowPrediction` | appointment routes            | appointment tests  | Implemented but not yet released |
| PR-APT-005      | State models and limitations                | appointment feature    | `appointments`       | `Appointment`, `QueueEntry`                     | status endpoint               | status tests       | Planned                          |
| PR-QUEUE-003    | Queue reorder sequence/concurrency          | `QueuePage`            | `queues`             | `QueueEntry`                                    | queue reorder                 | queue tests        | Under development                |
| PR-RISK-001     | No-show risk architecture                   | risk badges/panels     | `predictions`        | `NoShowPrediction`                              | included responses            | prediction tests   | Implemented but not yet released |
| PR-PUBLIC-001   | Frontend architecture                       | public/auth routes     | auth onboarding APIs | N/A                                             | public routes                 | app route tests    | Implemented but not yet released |
