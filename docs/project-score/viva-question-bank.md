# Viva Question Bank

Each answer is repository-backed. Link to [Evidence Index](evidence-index.md) and [Workflow Atlas](../workflows/README.md) when the interviewer asks for a deeper trace.

## Project Introductions

### 30 Seconds

Pravaah is a clinic flow management app for small and medium clinics. It helps Admin and Staff users manage doctors, patients, appointments, today's queue, and explainable no-show risk context. The main technical differentiator is that appointment booking creates a connected workflow: it validates clinic relationships, checks conflicts, creates a queue entry, stores deterministic risk reasons, and keeps staff in control.

### 1 Minute

Pravaah uses React, TypeScript, Express, Clerk, Prisma, and PostgreSQL. A signed-in Admin or Staff user works inside a clinic context. When staff book an appointment, the backend verifies the doctor and patient are linked to the clinic, protects the doctor's slot, creates the appointment and queue entry transactionally, and generates a transparent no-show risk score with reasons. The queue remains manually controlled; the risk assistance never cancels, reorders, or makes clinical decisions.

### 2 Minutes

The frontend is a Vite React app with public, auth, onboarding, and protected routes. Clerk handles identity, but Pravaah's backend handles authorization by resolving an internal active `User`, checking role, and checking clinic access. The backend is organized into Express feature modules with route, validation, controller, service, and repository layers. PostgreSQL stores relational entities like `Clinic`, `DoctorClinic`, `PatientClinic`, `Appointment`, `QueueEntry`, and `NoShowPrediction`. The strongest workflow is appointment creation because it combines validation, authorization, relational checks, transaction boundaries, advisory locks, queue creation, and deterministic risk assistance.

### 5 Minute Architecture

Start with the browser and React routes in `apps/web/src/App.tsx`. Public pages do not fetch clinic data. Protected routes mount `ProtectedAppShell`, then `ActiveClinicProvider`, then feature pages. API calls go through `apps/web/src/lib/apiClient.ts`, which attaches a Clerk Bearer token.

The Express API starts in `apps/server/src/app.ts`. `clerkMiddleware` runs globally, then route-level middleware such as `authenticateRequest`, `validateRequest`, `requireClinicAccess`, and role checks run before controllers. Controllers call services, services enforce business rules, and repositories use Prisma/PostgreSQL.

For data, `schema.prisma` models clinic operations relationally. Doctors and patients use join tables because clinic-specific links and history differ from the global person/provider record. Appointments connect clinic, doctor, patient, creator, queue entry, and no-show prediction. Transactions protect multi-write workflows, and advisory locks help with exact doctor-slot conflict and queue-position ordering.

Deployment is documented for a Vite frontend and Node backend, but the repository does not record live production URLs or deployed SHAs.

### 10 Minute Walkthrough

1. Problem: clinics need reliable daily flow across appointments, arrivals, waiting order, and missed-appointment risk.
2. Users: Admin and Staff sign in; doctors and patients are records, not logged-in users.
3. Product flow: onboarding creates clinic and first Admin; staff manage doctors/patients; appointment booking creates queue/risk; queue status/reorder supports clinic day operations.
4. Architecture: React/Vite frontend, Express API, Clerk identity, Prisma/PostgreSQL persistence.
5. Authorization: Clerk answers who is signed in; backend answers what they can do.
6. Database: relational models with join tables, constraints, indexes, and status enums.
7. Difficult decisions: Postgres over Mongo, Clerk over custom auth, deterministic scoring over ML, human queue control over automation.
8. Current status: implemented in source but release/deployment verification remains pending.
9. Limitations: no patient/doctor login, no trained ML, no browser E2E, lifecycle strictness gaps, no verified production URL in repo.
10. Next steps: deployment proof, test/build records, strict transition graph, E2E, notifications, observability.

## Level 1 - Foundation

### What is Pravaah?

Simple answer: Pravaah is a clinic flow management app for appointments, queue operations, and explainable no-show risk assistance.

Deep answer: It is not just CRUD. The appointment workflow connects clinic-scoped users, linked doctors and patients, queue entries, status synchronization, dashboard data, and deterministic risk reasons.

Exact evidence: `docs/PRD.md`, `docs/HLD.md`, `apps/server/prisma/schema.prisma`, `docs/workflows/appointment-management.md`.

Likely follow-up: What is out of scope?

Common mistake to avoid: Do not call it a hospital ERP or patient portal.

### Who are the users?

Simple answer: Admin and Staff are authenticated users. Doctors and patients are records only.

Deep answer: `User` stores Clerk mapping, role, status, and current clinic. `Doctor` and `Patient` do not authenticate in the current product; they are linked to clinics through `DoctorClinic` and `PatientClinic`.

Exact evidence: `docs/product/USER_ROLES.md`, `apps/server/prisma/schema.prisma -> User`, `Doctor`, `Patient`.

Likely follow-up: Why no patient login?

Common mistake: Do not imply patients or doctors can sign in today.

### What is the current status?

Simple answer: The implementation exists in source, but repository docs say release/deployment verification is pending.

Deep answer: Product docs use `Implemented but not yet released` for many capabilities. Deployment config exists, but no live URLs, deployed SHAs, screenshots, or production smoke results are committed.

Exact evidence: `docs/PRD.md`, `docs/README.md`, `docs/guides/DEPLOYMENT.md`, `apps/web/vercel.json`.

Likely follow-up: Can you show production?

Common mistake: Do not claim production deployment unless owner has proof.

### What is the MVP?

Simple answer: Clinic-side Admin/Staff operations for onboarding, doctors, patients, appointments, queue, dashboard, and deterministic risk assistance.

Deep answer: It excludes patient login, doctor login, trained ML, billing, prescriptions, inventory, and autonomous decisions.

Evidence: `docs/product/MVP.md`, `docs/PRD.md`, `docs/scope/ROADMAP.md`.

Likely follow-up: Why keep the scope narrow?

Common mistake: Do not expand scope verbally to sound bigger.

### Why React and TypeScript?

Simple answer: React fits component-based UI, and TypeScript helps keep frontend/backend code safer.

Deep answer: React supports route-level pages, shared UI, and local state for forms and workflow screens. TypeScript helps with API helper types, enums, component props, service inputs, and tests, while runtime validation still uses Zod.

Evidence: `apps/web/package.json`, `apps/web/src/App.tsx`, `apps/web/src/types`, `apps/server/src/modules/**/*.types.ts`.

Likely follow-up: Does TypeScript replace validation?

Common mistake: Do not say TypeScript protects runtime API input.

### Why Express, PostgreSQL, Prisma, Clerk, and monorepo?

Simple answer: Express keeps the API inspectable, PostgreSQL fits relational clinic data, Prisma gives typed access and migrations, Clerk avoids custom auth, and the monorepo keeps frontend/backend together.

Deep answer: The architecture favors understandable MVP ownership over premature complexity. Clerk owns identity, while Pravaah owns internal authorization. Prisma/PostgreSQL support constraints, join tables, and transactions used by appointment and queue workflows.

Evidence: `package.json`, `apps/server/package.json`, `apps/server/src/app.ts`, `schema.prisma`, `auth.middleware.ts`.

Likely follow-up: Why not MongoDB or custom authentication?

Common mistake: Do not say MongoDB is worse generally; say Postgres matches this relational domain.

## Level 2 - Implementation

### How is an appointment created?

Simple answer: The frontend submits a booking request; the backend authenticates, validates, authorizes clinic access, checks doctor/patient links, checks slot conflict, then creates appointment, queue entry, and risk prediction in a transaction.

Deep answer: `AppointmentBookingForm` owns the HTML form submit event, prevents the browser default, and calls its `onSubmit` prop. `AppointmentsPage.handleSubmit` is the async owner: it validates form values, calls `appointmentApi.createAppointment`, handles success/error UI state, and refreshes the appointment list. The route `POST /api/clinics/:clinicId/appointments` runs `authenticateRequest`, `validateRequest`, `requireClinicAccess`, and `requireClinicStaffRole`. The service validates ownership, counts patient history, acquires an advisory slot lock, checks active appointment conflict, calculates next queue position, writes appointment, queue entry, and no-show prediction inside `runInTransaction`.

Evidence: `AppointmentBookingForm.tsx -> handleSubmit`, `AppointmentsPage.tsx -> handleSubmit`, `appointmentApi.ts -> createAppointment`, `appointment.routes.ts`, `appointment.service.ts -> createAppointment`, `appointment.repository.ts`, `queue.repository.ts`, `prediction.service.ts`.

Likely follow-up: What happens if prediction creation fails?

Common mistake: Do not claim duration-overlap conflict detection; current conflict is exact doctor/time for active statuses.

### How is authentication performed?

Simple answer: Clerk authenticates the browser session and backend token; Pravaah then resolves an internal active user.

Deep answer: `ApiAuthProvider` gives the API client a Clerk token. Backend `clerkMiddleware` and `getAuth(req)` verify the request identity. Normal protected routes call `authenticateRequest`, which loads the internal `User` by `clerkUserId` and requires active status.

Evidence: `ApiAuthProvider.tsx`, `apiClient.ts`, `app.ts`, `auth.middleware.ts -> authenticateRequest`, `auth.service.ts`.

Likely follow-up: What if Clerk user has no internal User?

Common mistake: Do not say Clerk handles Pravaah roles.

### How is authorization performed?

Simple answer: The backend checks active user, role, and clinic access.

Deep answer: `access.service.ts` rejects missing/inactive users, non-Admin users on Admin routes, and users whose `clinicId` does not match the route `clinicId`. Appointment status uses `verifyAppointmentClinicAccess` to derive clinic access from the appointment itself.

Evidence: `access.service.ts`, `auth.middleware.ts`, `clinic.routes.ts`, `appointment.routes.ts`, `queue.routes.ts`, auth/access tests.

Likely follow-up: Why is frontend route guarding insufficient?

Common mistake: Do not present hidden navigation as security.

### How is queue data loaded and updated?

Simple answer: The queue page calls clinic-scoped queue APIs; backend verifies access and returns queue entries with appointment and risk context.

Deep answer: `QueuePage` loads today's queue through `listTodayQueue`, updates status through `updateQueueStatus`, and reorders via `reorderQueue`. The backend syncs queue status to appointment status transactionally and validates doctor/date scope for reorder.

Evidence: `QueuePage.tsx`, `queueApi.ts`, `queue.routes.ts`, `queue.service.ts`, `queue.repository.ts`.

Likely follow-up: What happens during simultaneous reorders?

Common mistake: Do not say risk automatically reorders the queue.

### How is risk generated?

Simple answer: A deterministic function scores known factors and returns risk level, reasons, and suggested actions.

Deep answer: `predictNoShowRisk` uses no-show history, late arrivals, distance, short-notice or long-advance booking, new-patient status, and strong attendance history. The score is clamped to 0-100. Stored predictions keep score, level, and JSON reasons; response adds suggested actions and model version.

Evidence: `prediction.service.ts`, `prediction.types.ts`, `NoShowPrediction` model, prediction tests.

Likely follow-up: Is this machine learning?

Common mistake: Do not call it trained AI.

## Level 3 - Engineering Decisions

### Why `DoctorClinic` and `PatientClinic`?

Simple answer: They separate global records from clinic-specific relationships.

Deep answer: A doctor or patient may conceptually relate to more than one clinic. `DoctorClinic` stores clinic-specific provider link data, and `PatientClinic` stores clinic-specific history, notes, distance, and link status. This keeps appointment validation clinic-scoped and prepares future multi-clinic support.

Evidence: `schema.prisma -> DoctorClinic`, `PatientClinic`; `appointment.service.ts -> findActiveDoctorClinicLink`, `findActivePatientClinicLink`.

Likely follow-up: Is user access also multi-clinic?

Common mistake: Do not say current users support many clinics; `User.clinicId` is a current simplification.

### Why service and repository layers?

Simple answer: Services own business rules; repositories own database access.

Deep answer: Controllers remain thin. For example, appointment service coordinates validation, conflict handling, transaction work, queue creation, and prediction, while repositories hide Prisma details.

Evidence: `appointment.controller.ts`, `appointment.service.ts`, `appointment.repository.ts`, `queue.service.ts`, `queue.repository.ts`.

Likely follow-up: Is this over-engineered?

Common mistake: Do not add layers that do nothing; show where they separate real responsibilities.

### Why deterministic scoring instead of ML?

Simple answer: The project has no validated clinic dataset, so deterministic rules are more honest and explainable.

Deep answer: Staff can see reasons and suggested actions. The system avoids automatic decisions and does not claim accuracy. A real ML version would need historical attendance data, bias checks, validation metrics, monitoring, and a fallback process.

Evidence: `prediction.service.ts`, `docs/PRD.md`, `docs/HLD.md`, `docs/design/CONTENT_GUIDELINES.md`.

Likely follow-up: What data would ML need?

Common mistake: Do not pretend there is a trained model.

## Level 4 - Deep Technical Questions

### Race condition vs transaction problem?

Simple answer: A transaction groups writes atomically; a race condition is concurrent requests interfering with each other.

Deep answer: Transactions guarantee all-or-nothing for grouped writes, but they do not automatically serialize every business rule. Pravaah uses transactions plus advisory locks/unique constraints in selected appointment and queue flows.

Evidence: `appointment.repository.ts -> runInTransaction`, `acquireAppointmentSlotLock`; `queue.repository.ts -> reorderQueueEntries`; migration `20260612120303_add_active_doctor_slot_unique_index`.

Likely follow-up: Do transactions prevent every duplicate position?

Common mistake: Do not say a transaction alone prevents all races.

### Where are advisory locks used?

Simple answer: Appointment slot protection and queue position/reorder operations use PostgreSQL advisory transaction locks.

Deep answer: Repository code calls `pg_advisory_xact_lock` to serialize specific clinic/doctor/date/slot scopes. This reduces concurrent conflict risk for exact slot booking and queue ordering but still needs tests and constraints around the specific workflow.

Evidence: `appointment.repository.ts -> acquireAppointmentSlotLock`, `queue.repository.ts -> findHighestQueuePosition` for inline queue-position locking, and `queue.repository.ts -> acquireQueueScopeLock` for reorder locking.

Likely follow-up: Why advisory locks instead of only unique constraints?

Common mistake: Do not invent advisory locks in flows that do not use them.

### What guarantees queue position uniqueness?

Simple answer: Queue creation calculates next position inside a transaction with lock support; reorder uses doctor/date scoped validation and two-phase updates. There is no schema-level unique constraint on queue position.

Evidence: `QueueEntry` indexes in `schema.prisma`, `queue.repository.ts`, `queue.service.ts`.

Likely follow-up: What would strengthen it?

Common mistake: Do not claim a unique `(clinicId, doctorId, date, position)` constraint exists; date is derived from `queuedAt`.

### What happens when Clerk user has no internal User?

Simple answer: Normal protected APIs fail; onboarding-aware APIs can use Clerk identity only.

Deep answer: `authenticateRequest` loads an active internal user and will fail if missing. `authenticateClerkIdentity` allows onboarding status and clinic provisioning to handle a first-time Clerk identity safely.

Evidence: `auth.middleware.ts`, `auth.routes.ts`, onboarding workflow docs.

Likely follow-up: Why is this exception safe?

Common mistake: Do not allow the frontend to choose Admin role.

## Level 5 - Trade-Offs And Future Design

### What fails at 100x scale?

Simple answer: Manual fetches, no caching, no pagination in some lists, no observability, and limited deployment proof would become pressure points.

Deep answer: The current design is suitable for an MVP and assessment demo, not proven high-scale production. I would add pagination, monitoring, query analysis, E2E smoke tests, background jobs for notifications, and stronger operational dashboards.

Evidence: PRD/HLD limitations, testing/deployment docs.

Likely follow-up: What would you optimize first?

Common mistake: Do not invent throughput or uptime metrics.

### How would patient or doctor login change the model?

Simple answer: Add authenticated user relationships and permissions for those roles.

Deep answer: Patient login would need identity mapping, consent/privacy rules, patient-owned profile access, and self-booking constraints. Doctor login would need provider identity, schedule visibility, and clinic membership rules. Current `Doctor`/`Patient` are records only.

Evidence: `UserRole` only has `ADMIN` and `STAFF`; no patient/doctor auth routes.

Likely follow-up: Could `User.clinicId` handle multi-clinic doctors?

Common mistake: Do not claim it already supports portals.

### Why do you not have E2E tests?

Simple answer: The current repo focuses automated tests on frontend components, API client behavior, backend services, validation, and controllers; browser E2E is an acknowledged future gap.

Deep answer: E2E would be valuable for auth, onboarding, appointment booking, queue status, and authorization denial. It is deferred because Clerk-auth browser setup and test-data isolation add maintenance complexity. Manual workflow verification is currently the release gate.

Evidence: `docs/guides/TESTING.md`, no Playwright/Cypress dependency/scripts in package files.

Likely follow-up: Which E2E would you add first?

Common mistake: Do not say E2E is unnecessary.

## AI Assistance Questions

### How much AI did you use?

Simple answer: AI was used as an assistance tool for coding, documentation, review, and preparation, but project claims still need to be understood and verified against the repository.

Deep answer: Separate product decisions, architecture decisions, implementation assistance, testing, and documentation. The defensible answer is that AI helped produce and review work, while the owner remains responsible for understanding code paths, running checks, validating behavior, and correcting hallucinated or unsupported claims.

Evidence: `docs/ai/AI_CONTEXT.md`, this evidence pack's repository-verification rules.

Likely follow-up: Can you explain AI-generated code?

Common mistake: Do not pretend AI was not used; do not claim exact percentages without evidence.
