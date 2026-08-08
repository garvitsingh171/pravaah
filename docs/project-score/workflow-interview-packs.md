# Workflow Interview Packs

Use this as the compact workflow-specific viva map. For exact product-action traces, open [Workflow Atlas](../workflows/README.md).

## Authentication And Authorization

Summary: Clerk proves identity; Pravaah resolves internal `User`, active status, role, and clinic access.

Best demo entry point: sign in and open `/dashboard`, then show `GET /api/auth/me` or a protected clinic route.

Important files: `ApiAuthProvider.tsx`, `apiClient.ts`, `ProtectedAppShell.tsx`, `ActiveClinicProvider.tsx`, `app.ts`, `auth.middleware.ts`, `auth.service.ts`, `access.service.ts`, `auth.routes.ts`.

Likely questions:

- What is authentication vs authorization?
- What happens without Bearer token?
- What happens if Clerk token is valid but no internal user exists?
- Why is onboarding special?
- Where is Admin-only access enforced?
- How is cross-clinic access rejected?

Deep questions: 401 vs 403 vs 404, Clerk provider boundary, frontend route hiding vs backend authorization, single-clinic `User.clinicId` limitation.

Trade-offs: Clerk reduces custom auth risk but requires external provider configuration and still needs internal authorization.

Common mistakes: "Clerk handles authorization", "frontend protected routes are security", "Staff can access clinic settings because the UI route exists".

Improvements: user-management UI, invitation flow, multi-clinic membership, rate limiting, audit logs.

## Onboarding And Clinic Provisioning

Summary: A Clerk-authenticated user without an internal user can create the first clinic and Admin via onboarding-specific endpoints.

Best demo entry point: `/onboarding/clinic`.

Files: `ClinicOnboardingPage.tsx`, `onboardingApi.ts`, `auth.routes.ts`, `auth.validation.ts`, `auth.service.ts`, `auth.repository.ts`, `clinic.service.ts`.

Questions: Why no frontend role field? How is duplicate onboarding handled? What if transaction fails? Why sample data is optional?

Trade-offs: Simple first-run self-service vs no full org/team invitation yet.

Improvements: invitation flow, admin user management, onboarding analytics.

## Clinic Setup

Summary: Admin updates clinic settings and may provision fictional sample data.

Best demo: `/clinic-settings` as Admin.

Files: `ClinicSettingsPage.tsx`, `clinicApi.ts`, `clinic.routes.ts`, `clinic.validation.ts`, `clinic.service.ts`, `clinic.repository.ts`, `sampleData.definitions.ts`.

Questions: Why Admin-only? Which fields are editable? Is standalone clinic creation enabled? How is fake data marked?

Common mistake: Do not say Staff can update clinic settings.

## Doctor Management

Summary: Admin/Staff create and edit doctor records linked to clinic through `DoctorClinic`.

Best demo: `/doctors`, `/doctors/new`.

Files: `DoctorForm.tsx`, `DoctorsPage.tsx`, `doctorApi.ts`, `doctor.routes.ts`, `doctor.validation.ts`, `doctor.service.ts`, `doctor.repository.ts`.

Questions: Why a join table? What is global vs clinic-specific? What does deactivation preserve?

Known limitation: current edit API updates `Doctor.isActive`, not full `DoctorClinic` link settings.

## Patient Management

Summary: Admin/Staff create and edit patient records linked to clinic through `PatientClinic`, including clinic-specific history context used by risk scoring.

Best demo: `/patients`, `/patients/new`.

Files: `PatientForm.tsx`, `PatientsPage.tsx`, `patientApi.ts`, `patient.routes.ts`, `patient.validation.ts`, `patient.service.ts`, `patient.repository.ts`.

Questions: Why no patient login? What data is collected? How is distance used? What is the active-filter gap?

Known limitation: `PatientClinic.isActive` filtering is not fully link-aware in the current product docs/audit.

## Appointment Creation

Summary: Booking validates doctor/patient clinic links, checks conflicts, creates appointment, queue entry, and risk prediction transactionally.

Best demo: `/appointments` booking form.

Files: `AppointmentBookingForm.tsx`, `AppointmentsPage.tsx`, `appointmentApi.ts`, `appointment.routes.ts`, `appointment.validation.ts`, `appointment.controller.ts`, `appointment.service.ts`, `appointment.repository.ts`.

Questions: How is conflict prevented? Why transaction? What happens on failure? What status does new appointment have? Does it detect duration overlap?

Known limitation: conflict is exact doctor/time for active statuses, not duration overlap.

## Appointment Lifecycle

Summary: Staff manually updates appointment status; final statuses cannot be changed; queue status syncs where applicable.

Best demo: status controls on `/appointments`.

Files: `AppointmentsPage.tsx`, `appointmentApi.ts`, `appointment.service.ts`, `appointment.repository.ts`, `appointment.validation.ts`.

Questions: Which statuses are final? How does queue sync work? What strict transition gap remains?

Known limitation: broad non-final transitions are still allowed.

## Queue Management

Summary: Queue entries are created during appointment booking, listed by clinic/date, manually status-updated, and reordered by doctor-specific active queue.

Best demo: `/queue`.

Files: `QueuePage.tsx`, `queueApi.ts`, `queue.routes.ts`, `queue.validation.ts`, `queue.service.ts`, `queue.repository.ts`.

Questions: Why created at booking, not arrival? How are final entries handled? Can risk reorder entries? What does reorder require?

Deep questions: concurrent reorder, advisory locks, two-phase updates, no position unique constraint.

## Queue Reordering

Summary: Reorder requires all active entries for one doctor and date, rejects duplicates/finals/cross-clinic entries, and persists inside a transaction.

Best demo: move an active waiting queue item up/down.

Files: `QueuePage.tsx -> handleQueueMove`, `queue.service.ts -> reorderQueue`, `queue.repository.ts -> reorderQueueEntries`.

Common mistake: Do not claim all doctors' queues reorder together.

## No-Show Assistance

Summary: Deterministic risk scoring returns risk level, score, reasons, and suggested manual actions.

Best demo: book appointment or open risk details in appointment/queue/dashboard.

Files: `prediction.service.ts`, `prediction.types.ts`, `AppointmentBookingForm.tsx`, `RiskExplanation.tsx`, `RiskBadge.tsx`.

Questions: Is it ML? What if it is wrong? Does it cancel or reorder? What bias could exist?

Answer boundary: Current system is deterministic assistance, not trained ML or LLM.

## Dashboard

Summary: Dashboard summarizes clinic-local date operations, high-risk appointments, activity, and setup state.

Best demo: `/dashboard`.

Files: `DashboardOverviewPage.tsx`, `dashboardApi.ts`, `dashboard.routes.ts`, `dashboard.service.ts`, `dashboard.repository.ts`.

Questions: How are summaries scoped? Why backfill missing predictions? What is not a business metric?

Common mistake: Do not invent impact metrics or queue reduction percentages.

## Public And Fallback Flows

Summary: Public landing, auth pages, onboarding redirect, protected redirects, and not-found page provide safe navigation.

Best demo: `/`, `/login`, bad path, signed-out `/dashboard`.

Files: `App.tsx`, `PublicLandingPage.tsx`, `LoginPage.tsx`, `SignUpPage.tsx`, `NotFoundPage.tsx`, `RouteMetadata.tsx`.

Questions: How does the SPA handle refresh? What is indexed? What is noindex?

Known limitation: no SSR.

## Database Design

Summary: PostgreSQL/Prisma schema captures clinic tenant boundary, role user, doctor/patient links, appointment, queue, and prediction records.

Best demo: open `schema.prisma` and draw ER relationships.

Files: `schema.prisma`, migrations, `DATABASE_DESIGN.md`.

Questions: PK/FK, join tables, constraints, indexes, transactions, denormalization, privacy.

## Deployment

Summary: Frontend Vercel config and backend Node start/build scripts exist; live deployment evidence is not committed.

Best demo: show config and deployment guide, not production claims.

Files: `apps/web/vercel.json`, `apps/server/package.json`, `apps/server/src/server.ts`, `docs/guides/DEPLOYMENT.md`.

Questions: What must be verified before release? What env vars are needed?

Common mistake: Do not claim deployed production without URL/SHA/smoke evidence.

## Documentation Architecture

Summary: PRD/HLD/LLD explain product/design/implementation, atlas traces workflows, Project Score pack maps evidence to assessment preparation.

Best demo: `docs/README.md`.

Questions: Which doc is source of truth when docs and code conflict?

Answer: Code is immediate implementation truth; docs should be updated in the same PR.
