# Mandatory Concept Evidence

Official source note: this file uses the mandatory concepts already listed in [Concept Tracker](CONCEPT_TRACKER.md). Because no separate official rubric file was found in the repository, official provenance is `NEEDS_REVIEW`.

Product status default: implemented source is `IMPLEMENTED_NOT_RELEASED` unless deployment evidence is recorded. Concepts that conflict with Pravaah scope are `NOT_APPLICABLE` or require another repository.

## Mandatory Inventory

### PS-001 React Component Composition

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | UI is built by composing reusable React components. |
| Why it matters | Keeps routes, shells, feature pages, and shared UI understandable. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Public routes, protected app shell, appointments, queue, dashboard. |
| Exact files | `apps/web/src/App.tsx`, `apps/web/src/app/AppLayout.tsx`, `apps/web/src/routes/dashboardRoutes.tsx`, `apps/web/src/features/*`, `apps/web/src/components/*`. |
| Exact symbols | `AppRoutes`, `ProtectedAppShell`, `AppLayout`, `AppointmentBookingForm`, `QueuePage`, `LoadingState`, `ErrorMessage`. |
| Code trace | `main.tsx -> App -> BrowserRouter -> AppRoutes -> dashboardRoutes -> feature component`. |
| Database evidence | None; frontend concept. |
| Test evidence | `apps/web/src/App.test.tsx`, `ProtectedAppShell.test.tsx`, feature tests. |
| Deployment evidence | `apps/web/vercel.json`; live deployment `NEEDS_REVIEW`. |
| Demonstration method | Open `/appointments` or `/queue`, then show route and component tree files. |
| Simple answer | Pravaah uses React components for each route and shared UI pieces. |
| Deep answer | The app separates shell, routing, feature pages, and generic UI. This lets appointment and queue screens share feedback and layout components without mixing backend rules into the UI. |
| Likely follow-up | Why not one large component? |
| Common mistake | Do not say React itself proves good architecture. Show actual components. |
| Limitation | No published component library package. |
| Improvement | Extract highly reused primitives if the UI surface grows. |

### PS-002 State Management With `useState`

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Components keep local UI/form state. |
| Why it matters | Forms, filters, loading states, pending mutations, and selected queue filters need predictable UI state. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Appointment booking, queue filtering/reorder, onboarding, protected shell. |
| Exact files | `AppointmentsPage.tsx`, `QueuePage.tsx`, `ClinicOnboardingPage.tsx`, `ProtectedAppShell.tsx`, `ActiveClinicProvider.tsx`. |
| Exact symbols | `useState`, `setQueueListState`, `setFormValues`, `setStatusUpdateError`, `setState`. |
| Code trace | User input/click -> page handler -> `useState` setter -> rerender. |
| Database evidence | None. |
| Test evidence | Frontend feature tests cover state changes and disabled pending states. |
| Deployment evidence | Frontend config only; live proof missing. |
| Demonstration method | Change queue filter or submit appointment form and show local state owners. |
| Simple answer | Pravaah mostly uses local React state instead of Redux. |
| Deep answer | That fits the app because each route owns its workflow state, while shared auth/clinic data uses context. Server state is refetched explicitly after mutations. |
| Likely follow-up | Why not React Query? |
| Common mistake | Do not imply local state replaces backend consistency. |
| Limitation | No cache/deduplication library. |
| Improvement | Add React Query if repeated server-state synchronization becomes painful. |

### PS-003 Side Effects With `useEffect`

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Components run effects after render for route metadata, auth checks, and data loading. |
| Why it matters | Avoids blocking render while loading current user, onboarding status, and feature data. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Protected route access, active clinic loading, route metadata, list pages. |
| Exact files | `ProtectedAppShell.tsx`, `ActiveClinicProvider.tsx`, `RouteMetadata.tsx`, `AppointmentsPage.tsx`, `QueuePage.tsx`. |
| Exact symbols | `useEffect`, `AbortController`, `RouteScrollRestoration`, `loadOnboardingStatus`, `refreshQueue`. |
| Code trace | Route mounts -> effect calls API/helper -> state updates or redirect. |
| Database evidence | Indirect through API reads. |
| Test evidence | `ProtectedAppShell.test.tsx`, queue and dashboard tests. |
| Deployment evidence | None beyond frontend build config. |
| Demonstration method | Open protected route and show loading, redirect, or data-fetching effect. |
| Simple answer | Effects load data and react to route/auth changes. |
| Deep answer | Pravaah keeps side effects near the route that owns them, and uses abort handling in key loading flows to avoid updating unmounted components. |
| Likely follow-up | What can go wrong in `useEffect`? |
| Common mistake | Do not put backend authorization inside effects as if it were security. |
| Limitation | Manual fetch lifecycle can become repetitive. |
| Improvement | Introduce a server-state library later. |

### PS-004 Async Data Fetching From API

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Frontend calls backend APIs asynchronously and handles responses. |
| Why it matters | All clinic workflows depend on server data and mutations. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Auth, doctors, patients, appointments, queue, dashboard. |
| Exact files | `apps/web/src/lib/apiClient.ts`, `apps/web/src/features/**/*Api.ts`. |
| Exact symbols | `createApiClient`, `apiClient.get/post/patch`, `createAppointment`, `listTodayQueue`, `reorderQueue`. |
| Code trace | Page handler -> feature API helper -> `apiClient` -> fetch with Bearer token -> API envelope parsed. |
| Database evidence | Backend writes/reads through Prisma. |
| Test evidence | `apps/web/src/lib/apiClient.test.ts`, feature tests with mocked APIs. |
| Deployment evidence | `VITE_API_BASE_URL` examples; live API missing. |
| Demonstration method | Use browser Network tab on appointment creation or queue reorder. |
| Simple answer | Pravaah wraps `fetch` in a typed API client. |
| Deep answer | The client normalizes base URLs, attaches Clerk tokens, serializes query params, and converts backend success/error envelopes into typed results or `ApiClientError`. |
| Likely follow-up | What happens if the backend is down? |
| Common mistake | Do not say the frontend directly touches the database. |
| Limitation | No retry policy or offline cache. |
| Improvement | Add retry/backoff only for safe idempotent reads. |

### PS-008 Client-Side Routing

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Browser URLs render different React screens. |
| Why it matters | Separates public, auth, onboarding, protected, and fallback flows. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | All UI entry points. |
| Exact files | `apps/web/src/App.tsx`, `apps/web/src/routes/dashboardRoutes.tsx`, `apps/web/src/routes/NotFoundPage.tsx`. |
| Exact symbols | `BrowserRouter`, `Routes`, `Route`, `Navigate`, `dashboardRoutes`, `getNavigationRoutesForRole`. |
| Code trace | URL -> React Router route -> public boundary or protected shell -> lazy page. |
| Database evidence | None. |
| Test evidence | App/protected shell tests. |
| Deployment evidence | `apps/web/vercel.json` SPA rewrite. |
| Demonstration method | Navigate `/`, `/login`, `/onboarding/clinic`, `/dashboard`, `/queue`, bad path. |
| Simple answer | React Router manages the frontend routes. |
| Deep answer | Public/auth/onboarding routes are separate from the protected shell. The backend still enforces access for protected APIs. |
| Likely follow-up | How does SPA deployment avoid 404 on refresh? |
| Common mistake | Do not call route hiding authorization. |
| Limitation | No SSR; private routes are not crawlable pages. |
| Improvement | Add dedicated unauthorized route if UX requires it. |

### PS-011 Problem Modeling

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | The product problem is modeled as real domain entities and workflows. |
| Why it matters | Prevents generic CRUD and keeps design tied to clinic operations. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Appointment-to-queue clinic-day flow. |
| Exact files | `docs/PRD.md`, `docs/product/MVP.md`, `docs/product/WORKFLOWS.md`, `apps/server/prisma/schema.prisma`. |
| Exact symbols | `Clinic`, `DoctorClinic`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`. |
| Code trace | Product problem -> Prisma models -> feature modules -> UI routes. |
| Database evidence | Relational model maps clinic operations. |
| Test evidence | Service/controller tests across auth, appointment, queue, dashboard. |
| Deployment evidence | Not deployment-specific. |
| Demonstration method | Explain one appointment turning into a queue entry and risk context. |
| Simple answer | Pravaah models clinic flow, not just appointment CRUD. |
| Deep answer | It connects clinic, staff user, doctor link, patient link, appointment, queue position, status synchronization, and risk assistance into one operational workflow. |
| Likely follow-up | What is out of scope? |
| Common mistake | Do not describe it as a hospital ERP. |
| Limitation | No patient/doctor portals. |
| Improvement | Add notifications and portals only after core workflow is stable. |

### PS-012 System Design Basics

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Frontend, backend, auth provider, and database have clear responsibilities. |
| Why it matters | Keeps trust boundaries and data ownership clear. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | All protected workflows. |
| Exact files | `docs/HLD.md`, `docs/architecture/ARCHITECTURE.md`, `apps/web`, `apps/server`, `apps/server/prisma/schema.prisma`. |
| Exact symbols | `AppRoutes`, `app`, `clerkMiddleware`, `authenticateRequest`, `prisma`. |
| Code trace | Browser -> Clerk session -> `apiClient` -> Express `/api` -> middleware -> service -> repository -> Prisma -> PostgreSQL. |
| Database evidence | Prisma datasource PostgreSQL and relational models. |
| Test evidence | Frontend and backend unit/component/service tests. |
| Deployment evidence | Vercel config, server start script, deployment guide; live proof missing. |
| Demonstration method | Draw the system diagram and open files per layer. |
| Simple answer | Pravaah is a React frontend, Express API, Clerk auth, and PostgreSQL database. |
| Deep answer | Clerk proves identity; the backend maps that identity to an internal active user and clinic role; Prisma handles persistence; the UI only requests and displays authorized workflow data. |
| Likely follow-up | Why not put everything in the frontend? |
| Common mistake | Do not trust browser-provided role or clinic. |
| Limitation | No microservices or background workers. |
| Improvement | Add observability and job processing if operational scale needs it. |

### PS-013 RESTful Endpoint Design

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Backend exposes HTTP JSON endpoints around resources and actions. |
| Why it matters | Provides clear frontend/backend contract. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Clinic, doctor, patient, appointment, queue, dashboard APIs. |
| Exact files | `apps/server/src/app.ts`, `apps/server/src/modules/**/*.routes.ts`, `docs/architecture/API_REFERENCE.md`. |
| Exact symbols | `clinicAppointmentRouter.post('/:clinicId/appointments')`, `queueRouter.patch('/:clinicId/queue/reorder')`, `authRouter`. |
| Code trace | Express app mounts `/api/*` routers -> route middleware -> controller. |
| Database evidence | Routes call services/repositories that touch models. |
| Test evidence | Controller/service tests for important routes. |
| Deployment evidence | Backend start/build config; live proof missing. |
| Demonstration method | Open route file and API reference while making a Network request. |
| Simple answer | APIs are grouped by feature modules with JSON request/response envelopes. |
| Deep answer | Collection routes handle list/create operations, action routes handle state changes such as appointment status and queue reorder, and validation/auth middleware runs before controllers. |
| Likely follow-up | Is every endpoint perfectly RESTful? |
| Common mistake | Do not claim an OpenAPI spec exists. |
| Limitation | No generated API contract. |
| Improvement | Add OpenAPI or contract tests later. |

### PS-014 HTTP Status Codes

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | API failures use meaningful HTTP status codes. |
| Why it matters | Helps frontend and interviewers understand failure semantics. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Validation, auth, conflicts, not-found, server errors. |
| Exact files | `AppError.ts`, `errorHandler.ts`, auth/access/appointment/queue services. |
| Exact symbols | `AppError`, `VALIDATION_ERROR`, `AUTHENTICATION_REQUIRED`, `CLINIC_ACCESS_DENIED`, `APPOINTMENT_SLOT_CONFLICT`, `QUEUE_REORDER_CONFLICT`. |
| Code trace | Service/middleware throws `AppError` -> `errorHandler` returns `{ success: false, error }`. |
| Database evidence | Prisma `P2002` -> 409, `P2025` -> 404. |
| Test evidence | Controller/service/error-path tests exist. |
| Deployment evidence | Not deployment-specific. |
| Demonstration method | Trigger invalid body, missing token, cross-clinic, duplicate slot. |
| Simple answer | Validation uses 400, auth uses 401/403, missing resources use 404, conflicts use 409. |
| Deep answer | The backend centralizes expected errors with `AppError` and handles malformed JSON plus selected Prisma errors in the global error handler. |
| Likely follow-up | Why does cross-clinic access return 403? |
| Common mistake | Do not invent ideal status codes where current code differs. |
| Limitation | Some unexpected Prisma errors become 500. |
| Improvement | Add broader error mapping and API contract tests. |

### PS-016 Server-Side Error Handling

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Server errors are converted into safe response envelopes. |
| Why it matters | Avoids leaking internals and gives frontend stable messages. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | All APIs. |
| Exact files | `apps/server/src/middleware/errorHandler.ts`, `apps/server/src/utils/AppError.ts`, `apps/server/src/app.ts`. |
| Exact symbols | `errorHandler`, `AppError`, `MALFORMED_JSON`, `UNIQUE_CONSTRAINT_FAILED`, `INTERNAL_SERVER_ERROR`. |
| Code trace | Route fails -> `next(error)` -> `app.use(errorHandler)`. |
| Database evidence | Prisma known-request error mapping. |
| Test evidence | Controller/service tests cover many expected errors; full integration coverage partial. |
| Deployment evidence | Not deployment-specific. |
| Demonstration method | Send malformed JSON or duplicate slot. |
| Simple answer | The API returns a consistent error object instead of raw stack traces. |
| Deep answer | Expected business failures use `AppError`; malformed JSON and common Prisma errors are mapped centrally; unknown errors log server-side and return a generic 500. |
| Likely follow-up | Why not expose stack traces? |
| Common mistake | Do not expose secrets or database internals in explanations. |
| Limitation | No centralized request ID/observability. |
| Improvement | Add structured logs and request IDs. |

### PS-017 Middleware

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Shared request logic runs before controllers. |
| Why it matters | Keeps authentication, validation, and authorization consistent. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Protected APIs, onboarding, clinic-scoped resources. |
| Exact files | `auth.middleware.ts`, `validateRequest.ts`, route files. |
| Exact symbols | `authenticateRequest`, `authenticateClerkIdentity`, `requireClinicAccess`, `requireAdminRole`, `validateRequest`. |
| Code trace | Route -> auth middleware -> Zod validation -> clinic/role middleware -> controller. |
| Database evidence | Internal user and clinic lookups in auth/access services. |
| Test evidence | Auth middleware and validation tests. |
| Deployment evidence | Not deployment-specific. |
| Demonstration method | Open `appointment.routes.ts` or `queue.routes.ts` and explain order. |
| Simple answer | Middleware verifies identity, validates requests, and checks access before business logic. |
| Deep answer | Normal APIs require an internal active user, while onboarding has a special identity-only path for first clinic creation. |
| Likely follow-up | Why does middleware order matter? |
| Common mistake | Do not validate after mutating data. |
| Limitation | No rate-limiting middleware. |
| Improvement | Add rate limiting/security headers as hardening. |

### PS-020 Schema Modeling Mongo

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory in existing tracker; official provenance `NEEDS_REVIEW` |
| Simple definition | MongoDB document schema modeling. |
| Why it matters | Official concept may require NoSQL modeling knowledge. |
| Evidence status | `NOT_APPLICABLE` for Pravaah; mandatory gap |
| Product status | `PLANNED` only if another repo is prepared |
| Workflow | None in Pravaah. |
| Exact files | No Mongo files found. PostgreSQL evidence is in `apps/server/prisma/schema.prisma`. |
| Exact symbols | None. |
| Code trace | Not implemented. |
| Database evidence | Pravaah uses PostgreSQL, not MongoDB. |
| Test evidence | None. |
| Deployment evidence | None. |
| Demonstration method | Do not demonstrate through Pravaah. |
| Simple answer | Pravaah does not use MongoDB; it uses PostgreSQL because relationships and constraints are central. |
| Deep answer | Mongo concepts should be shown through a real separate Mongo repository if the official rubric requires them. |
| Likely follow-up | Can SQL relationships count as Mongo references? |
| Common mistake | Do not claim `DoctorClinic` is Mongo referencing. |
| Limitation | Mandatory requirement may need another repo. |
| Improvement | Verify official rubric and prepare legitimate Mongo evidence elsewhere. |

### PS-021 CRUD Operations Mongo

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory in existing tracker; official provenance `NEEDS_REVIEW` |
| Simple definition | Create/read/update/delete operations using MongoDB. |
| Why it matters | Official concept may require NoSQL operations. |
| Evidence status | `NOT_APPLICABLE` for Pravaah; mandatory gap |
| Product status | `PLANNED` only if another repo is prepared |
| Workflow | None in Pravaah. |
| Exact files | No Mongo dependency, config, model, route, or repository found. |
| Exact symbols | None. |
| Code trace | Not implemented. |
| Database evidence | PostgreSQL/Prisma CRUD exists but does not prove Mongo CRUD. |
| Test evidence | None. |
| Deployment evidence | None. |
| Demonstration method | Do not claim through Pravaah. |
| Simple answer | Pravaah has CRUD-like workflows through Prisma/PostgreSQL, not MongoDB. |
| Deep answer | If Mongo CRUD is mandatory, it must be demonstrated in a separate real Mongo project. |
| Likely follow-up | Why not add Mongo just for the score? |
| Common mistake | Do not add unused Mongo code as evidence. |
| Limitation | Cannot clear this through current Pravaah scope. |
| Improvement | Owner verifies rubric and prepares another repo if needed. |

### PS-025 Relational Schema Design With PK/FK

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Tables have primary keys, foreign keys, and relationships. |
| Why it matters | Pravaah depends on clinic-scoped relational consistency. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Auth, doctor/patient links, appointments, queue, predictions. |
| Exact files | `apps/server/prisma/schema.prisma`, migrations, `docs/architecture/DATABASE_DESIGN.md`. |
| Exact symbols | `model Clinic`, `User`, `DoctorClinic`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`. |
| Code trace | Prisma schema -> migrations -> repositories -> workflows. |
| Database evidence | `@id`, `@relation`, `@unique`, `@@index`, `onDelete`. |
| Test evidence | Repository/service tests exercise relations. |
| Deployment evidence | DB provider config absent; schema/migrations present. |
| Demonstration method | Draw ER diagram and open schema. |
| Simple answer | PostgreSQL models clinic, users, doctor/patient links, appointments, queue, and risk records. |
| Deep answer | Join tables allow doctor/patient records to exist separately from clinic-specific links and history while appointments maintain foreign-key relationships. |
| Likely follow-up | Why `DoctorClinic` and `PatientClinic`? |
| Common mistake | Do not say a doctor belongs to only one clinic. |
| Limitation | User access is currently single-clinic via `User.clinicId`. |
| Improvement | Add `UserClinic` membership for true multi-clinic users. |

### PS-026 SQL JOINs

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Related SQL data is read together through joins/includes. |
| Why it matters | Appointment and queue screens need patient, doctor, prediction, and status context. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Appointment list, queue list, dashboard. |
| Exact files | `appointment.repository.ts`, `queue.repository.ts`, `dashboard.repository.ts`. |
| Exact symbols | Prisma `include`, `select`, relation filters; raw SQL advisory-lock queries are separate from joins. |
| Code trace | List endpoint -> repository relation query -> response with nested doctor/patient/queue/prediction data. |
| Database evidence | Prisma relations in schema. |
| Test evidence | Dashboard/appointment/queue tests. |
| Deployment evidence | Not deployment-specific. |
| Demonstration method | Open appointment list response and repository include/select. |
| Simple answer | Prisma reads related rows using schema relations, similar to SQL joins. |
| Deep answer | The UI needs joined context, so repositories select nested doctor/patient/prediction data instead of forcing the frontend to make many independent calls. |
| Likely follow-up | Is Prisma hiding SQL? |
| Common mistake | Do not confuse NoSQL references with SQL joins. |
| Limitation | No raw hand-written join tutorial query in docs. |
| Improvement | Prepare one equivalent SQL join example for viva explanation. |

### PS-038 LLM API Integration

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory in existing tracker; official provenance `NEEDS_REVIEW` |
| Simple definition | Calling a large-language-model API from the product. |
| Why it matters | Official AI-app concepts may require real LLM integration. |
| Evidence status | `NOT_APPLICABLE` for Pravaah; mandatory gap |
| Product status | Not in current product scope |
| Workflow | None. No-show assistance is deterministic rules. |
| Exact files | `apps/server/src/modules/predictions/prediction.service.ts` proves deterministic scoring, not LLM calls. |
| Exact symbols | `predictNoShowRisk`, `NO_SHOW_RULE_VERSION = 'starter-rule-v1'`. |
| Code trace | Appointment booking -> deterministic function -> stored prediction. No external LLM boundary. |
| Database evidence | `NoShowPrediction` stores score/reasons, not prompts/responses. |
| Test evidence | `prediction.service.test.ts`. |
| Deployment evidence | No LLM env vars or SDKs. |
| Demonstration method | Do not claim LLM. Explain responsible deterministic assistance. |
| Simple answer | Pravaah does not use an LLM. |
| Deep answer | The current system is AI-assisted only in the product sense of explainable risk assistance; technically it is a deterministic rule engine. |
| Likely follow-up | Is deterministic scoring machine learning? |
| Common mistake | Do not say an AI model predicts attendance. |
| Limitation | Cannot clear LLM integration here. |
| Improvement | Use a separate real LLM project if the rubric requires it. |

### PS-039 Prompt Engineering

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory in existing tracker; official provenance `NEEDS_REVIEW` |
| Simple definition | Designing prompts/instructions for LLM behavior. |
| Why it matters | Official AI-app concepts may require explaining prompt choices and risks. |
| Evidence status | `NOT_APPLICABLE` for Pravaah; mandatory gap |
| Product status | Not in current product scope |
| Workflow | None. Pravaah has no prompt surface. |
| Exact files | No prompt templates, LLM route, LLM SDK, or prompt tests found. |
| Exact symbols | None. |
| Code trace | Not implemented. |
| Database evidence | None. |
| Test evidence | None. |
| Deployment evidence | No prompt/LLM env vars. |
| Demonstration method | Do not claim prompt engineering through Pravaah. |
| Simple answer | Pravaah does not use prompts or LLMs. |
| Deep answer | The no-show module is rules-based code. Prompt engineering should be demonstrated with a real LLM project if the official rubric requires it. |
| Likely follow-up | Can risk-score reasons count as prompts? |
| Common mistake | Do not call deterministic reason messages prompts. |
| Limitation | Cannot clear prompt engineering through current Pravaah. |
| Improvement | Prepare a separate real LLM repository if required. |

### PS-040 Structured Outputs

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory in existing tracker; official provenance `NEEDS_REVIEW` |
| Simple definition | Having an LLM return data in a constrained structured schema. |
| Why it matters | Official AI-app rubrics may test schema-constrained AI output and validation. |
| Evidence status | `NOT_APPLICABLE` for Pravaah; mandatory gap |
| Product status | Not in current product scope |
| Workflow | None. Pravaah returns API JSON, not LLM structured output. |
| Exact files | `apps/server/src/middleware/errorHandler.ts` and controllers return structured API JSON, but no LLM output schema exists. |
| Exact symbols | No LLM structured-output symbols. |
| Code trace | Not implemented. |
| Database evidence | `NoShowPrediction.reasons` stores JSON reasons from deterministic code, not LLM output. |
| Test evidence | None for LLM structured output. |
| Deployment evidence | No LLM provider configuration. |
| Demonstration method | Do not claim through Pravaah. |
| Simple answer | Structured API responses are not the same as LLM structured outputs. |
| Deep answer | Pravaah validates request/response shapes in normal app code, but there is no model call that produces schema-constrained AI output. |
| Likely follow-up | Can JSON API envelopes count? |
| Common mistake | Do not equate any JSON with AI structured outputs. |
| Limitation | Cannot clear this through current Pravaah. |
| Improvement | Use another real LLM project if required. |

### PS-048 Git Workflow

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Work is organized through issues, branches, PRs, and review-ready changes. |
| Why it matters | Shows maintainable delivery discipline. |
| Evidence status | `PARTIAL_EVIDENCE` |
| Product status | Not product feature |
| Workflow | Documentation and development process. |
| Exact files | `.github/ISSUE_TEMPLATE/*`, `.github/pull_request_template.md`, `docs/guides/CONTRIBUTING.md`, repository metadata in `package.json`. |
| Exact symbols | Issue templates, PR checklist, root scripts. |
| Code trace | Not runtime code. |
| Database evidence | None. |
| Test evidence | Test scripts exist; current run not recorded. |
| Deployment evidence | Release docs exist; deployed SHAs missing. |
| Demonstration method | Show templates and explain branch/PR/check flow; optionally use git history if owner permits. |
| Simple answer | The repo has issue templates, a PR template, and contribution guidance. |
| Deep answer | It supports issue-driven development, but the current docs cannot prove every PR/review/check history without inspecting GitHub records. |
| Likely follow-up | Did you use PRs for this work? |
| Common mistake | Do not claim CI exists; no tracked GitHub Actions workflows were found. |
| Limitation | GitHub process evidence is incomplete from local files alone. |
| Improvement | Record PR links, review notes, and check outputs. |

### PS-049 Environment Variables And Secrets Management

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Secrets/config are read from environment variables and examples omit real secrets. |
| Why it matters | Protects Clerk/database credentials and keeps deployments configurable. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | `IMPLEMENTED_NOT_RELEASED` |
| Workflow | Backend boot, CORS, database, Clerk, frontend API. |
| Exact files | `.env.example`, `apps/server/.env.example`, `apps/web/.env.example`, `apps/server/src/config/env.ts`, deployment/setup guides. |
| Exact symbols | `requireEnv`, `DATABASE_URL`, `CLERK_SECRET_KEY`, `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`. |
| Code trace | Process env -> `env.ts` or Vite import -> app/client config. |
| Database evidence | `DATABASE_URL` required by backend/Prisma. |
| Test evidence | API client tests cover missing/invalid frontend base URL. |
| Deployment evidence | Deployment docs list variables; live values not in repo. |
| Demonstration method | Show `.env.example` and `env.ts` without exposing real `.env`. |
| Simple answer | Secrets stay out of source; examples document required names. |
| Deep answer | Backend requires database and Clerk secret variables at startup, while frontend uses public Vite variables for API base URL and Clerk publishable key. |
| Likely follow-up | Which env vars are safe to expose? |
| Common mistake | Do not paste real secrets in an interview or docs. |
| Limitation | No secret scanning workflow found. |
| Improvement | Add CI secret scanning if GitHub Actions are introduced. |

### PS-059 JavaScript Event Loop

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | JavaScript schedules async callbacks and promise continuations through the event loop. |
| Why it matters | Pravaah uses async UI/API flows. |
| Evidence status | `PARTIAL_EVIDENCE` |
| Product status | Not product feature |
| Workflow | API calls, effects, event handlers. |
| Exact files | `apiClient.ts`, `ProtectedAppShell.tsx`, `QueuePage.tsx`, backend async controllers/services. |
| Exact symbols | `async/await`, `fetch`, `useEffect`, `AbortController`, event handlers. |
| Code trace | User event -> async handler -> awaited API -> state update. |
| Database evidence | Backend awaits repository operations. |
| Test evidence | Tests use async RTL/Vitest patterns. |
| Deployment evidence | None. |
| Demonstration method | Use a small JS simulation from [Code Writing Simulations](simulations/code-writing.md). |
| Simple answer | Pravaah uses async code, but event loop knowledge needs a separate explanation. |
| Deep answer | The code shows promises and effects, but the concept itself is language-level, so prepare a call-stack/microtask/macrotask explanation. |
| Likely follow-up | What runs first: `setTimeout` or a resolved promise? |
| Common mistake | Do not overclaim that app code alone proves event-loop mastery. |
| Limitation | No dedicated event-loop demo in product code. |
| Improvement | Practise a standalone snippet. |

### PS-060 Promises Vs Callbacks

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Promise-based async code avoids callback nesting. |
| Why it matters | API helpers, services, tests, and repositories are promise-based. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | Not product feature |
| Workflow | All async frontend/backend calls. |
| Exact files | `apiClient.ts`, `appointment.service.ts`, `queue.service.ts`, tests. |
| Exact symbols | `Promise<TData>`, `async`, `await`, `mockResolvedValue`, `expect(...).rejects`. |
| Code trace | API helper returns promise -> page awaits -> error handled. |
| Database evidence | Prisma operations return promises. |
| Test evidence | Async tests across backend/frontend. |
| Deployment evidence | None. |
| Demonstration method | Convert a callback-style fetch example into a promise/async function. |
| Simple answer | Pravaah uses promises and `async/await`, not callback-heavy flow. |
| Deep answer | Promise APIs let errors propagate through `try/catch` or rejected promise tests, which matches fetch and Prisma. |
| Likely follow-up | How is a rejected promise handled? |
| Common mistake | Do not say promises make code synchronous. |
| Limitation | Must still understand callback basics. |
| Improvement | Practise one callback-to-promise conversion. |

### PS-061 JavaScript `async/await`

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | `async/await` writes promise workflows in readable sequence. |
| Why it matters | Pravaah has multi-step request and transaction flows. |
| Evidence status | `STRONG_EVIDENCE` |
| Product status | Not product feature |
| Workflow | API client, controllers, services, repositories, tests. |
| Exact files | `apiClient.ts`, `appointment.service.ts`, `queue.service.ts`, `auth.middleware.ts`, controller tests. |
| Exact symbols | `request`, `createAppointment`, `updateQueueStatus`, `authenticateRequest`. |
| Code trace | `await` token/API/db operations -> success return or caught error. |
| Database evidence | Prisma calls awaited in repositories/transactions. |
| Test evidence | Async tests exist. |
| Deployment evidence | None. |
| Demonstration method | Walk through appointment creation linearly. |
| Simple answer | Most Pravaah async workflows are written with `async/await`. |
| Deep answer | It makes the service code read like a business process while still running asynchronously and preserving promise rejection behavior. |
| Likely follow-up | What happens if an awaited call throws? |
| Common mistake | Do not forget to return/await promises in tests. |
| Limitation | Async readability does not remove race conditions. |
| Improvement | Practise explaining `try/catch` and `Promise.all`. |

### PS-062 Closures

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | Functions remember variables from their creation scope. |
| Why it matters | React handlers and API-client factory functions rely on closure behavior. |
| Evidence status | `PARTIAL_EVIDENCE` |
| Product status | Not product feature |
| Workflow | API client token provider, React handlers, test mocks. |
| Exact files | `apps/web/src/lib/apiClient.ts`, `ApiAuthProvider.tsx`, `QueuePage.tsx`, `AppointmentBookingForm.tsx`. |
| Exact symbols | `createApiClient`, `request`, `handleSubmit`, `handleQueueMove`, `useCallback`. |
| Code trace | Factory/handler closes over base URL, token provider, state, props, or clinic ID. |
| Database evidence | None. |
| Test evidence | Tests use hoisted mocks and callbacks. |
| Deployment evidence | None. |
| Demonstration method | Explain how `createApiClient` retains `clientOptions`. |
| Simple answer | Closures appear in API helpers and React event handlers. |
| Deep answer | The concept is real in the code, but should be practised with a tiny standalone snippet to make the language rule obvious. |
| Likely follow-up | What is a stale closure in React? |
| Common mistake | Do not confuse closure with class instance state. |
| Limitation | Product code is indirect evidence. |
| Improvement | Practise closure and stale dependency examples. |

### PS-063 Hoisting

| Field | Evidence |
| --- | --- |
| Requirement type | Mandatory, official provenance `NEEDS_REVIEW` |
| Simple definition | JavaScript declarations are processed before execution in different ways for `var`, `let`, `const`, and functions. |
| Why it matters | It is a language viva topic, not a Pravaah workflow feature. |
| Evidence status | `PARTIAL_EVIDENCE` |
| Product status | Not product feature |
| Workflow | TypeScript modules use declarations, but no product behavior depends on a hoisting trick. |
| Exact files | Many TypeScript modules; no dedicated hoisting exercise. |
| Exact symbols | Function declarations like `AppRoutes`, const helpers like `createApiClient`. |
| Code trace | Not a runtime workflow to demonstrate. |
| Database evidence | None. |
| Test evidence | None specific. |
| Deployment evidence | None. |
| Demonstration method | Use a standalone JS snippet in viva practice. |
| Simple answer | Pravaah is not designed around hoisting behavior; explain it as JavaScript fundamentals. |
| Deep answer | Function declarations can be called before their declaration; `let`/`const` are hoisted but unavailable in the temporal dead zone until initialized. |
| Likely follow-up | What happens if you access `let x` before declaration? |
| Common mistake | Do not claim TypeScript removes hoisting. |
| Limitation | Weak repository-specific evidence. |
| Improvement | Prepare a short reliable code example. |
