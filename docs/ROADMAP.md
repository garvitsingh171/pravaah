<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah Roadmap

## 1. Purpose

This roadmap keeps Pravaah focused on a deadline-oriented MVP path.

It prevents the project from expanding into a hospital ERP, patient app, notification platform, or advanced AI product before the core workflow is working.

## 2. Roadmap principle

Build in this order:

```txt
Foundation → Database → Backend workflow → Frontend workflow → Auth polish → Deploy → Improve
```

Do not start with fancy UI, advanced AI, or integrations.

## 3. MVP target

Target MVP window:

```txt
June 1, 2026 to July 12, 2026
```

The roadmap is divided into seven stages:

1. Sprint 0 - Repo setup, docs, planning
2. Sprint 1 - Project foundation, workspace setup, tooling
3. Sprint 2 - Database + Prisma + backend base
4. Sprint 3 - Core backend APIs + starter prediction
5. Sprint 4 - Frontend clinic/staff flows
6. Sprint 5 - Auth integration + polish
7. Sprint 6 - Deployment + docs + final release

## 4. Sprint 0 - Repo Setup, Docs, Planning

### Goal

Lock the final product direction and remove conflicting planning notes.

### Key tasks

- clean repository documentation
- define locked stack
- define MVP scope
- define user roles
- define database model
- include starter no-show risk prediction in MVP
- create AI context document for AI assistants
- document setup and contribution workflow

### Expected output

- consistent core docs
- clear source-of-truth architecture
- clear MVP boundary
- future-ready database plan
- AI_CONTEXT.md to prevent AI tool deviation

### Acceptance criteria

- no active docs contradict the final stack
- no docs incorrectly push all AI out of MVP
- database docs include DoctorClinic, PatientClinic, and NoShowPrediction
- MVP docs include starter no-show risk scoring
- roadmap matches implementation order

## 5. Sprint 1 - Project Foundation, Workspace Setup, Tooling

### Goal

Prepare the repository for implementation without building full product features yet.

### Key tasks

- finalize root `package.json`
- set up npm workspaces
- create `apps/web`
- create `apps/server`
- reserve `packages/*`
- add formatter setup
- add lint/check scripts
- add `.env.example`
- add baseline README updates
- confirm local install workflow

### Expected output

- working monorepo skeleton
- root commands run or fail for clear known reasons
- placeholder app workspaces exist
- consistent formatting workflow

### Acceptance criteria

- `npm install` works
- workspace folders are recognized
- `npm run format` works
- `npm run check` has a defined expectation
- repo structure matches architecture docs

## 6. Sprint 2 - Database + Prisma + Backend Base

### Goal

Create the schema-first foundation for the backend.

### Key tasks

- initialize Express + TypeScript backend
- initialize Prisma
- connect Prisma to Neon PostgreSQL
- create initial Prisma schema
- model final MVP entities:
    - User
    - Clinic
    - Doctor
    - DoctorClinic
    - Patient
    - PatientClinic
    - Appointment
    - QueueEntry
    - NoShowPrediction
- add enums
- add indexes and constraints
- add environment loading and validation
- create backend module folders
- create health check route

### Expected output

- backend starts locally
- Prisma schema exists
- first migration can be generated
- database model matches docs
- backend module structure is ready

### Acceptance criteria

- Prisma schema covers all MVP entities
- Doctor and Patient use join tables for clinic relation
- migrations are committed
- database connection is documented
- backend folder structure matches architecture

## 7. Sprint 3 - Core Backend APIs + Starter Prediction

### Goal

Implement the server-side clinic workflow that powers the product.

### Key tasks

- add auth middleware skeleton
- add clinic APIs
- add doctor APIs
- add doctor-clinic linking APIs
- add patient APIs
- add patient-clinic linking APIs
- add appointment APIs
- add queue APIs
- add starter no-show prediction service
- store prediction results in NoShowPrediction
- implement role-aware backend checks
- add basic validation and error handling

### Expected output

- usable backend endpoints for core records
- appointment booking works through API
- queue entries can be managed
- prediction service produces low/medium/high risk

### Acceptance criteria

- staff can create/manage clinic records through backend
- appointment creation validates doctor-clinic and patient-clinic links
- no-show prediction is generated and stored
- queue state changes are consistent
- role checks happen server-side

## 8. Sprint 4 - Frontend Clinic/Staff Flows

### Goal

Give clinic staff a usable web interface.

### Key tasks

- set up React + TypeScript frontend
- create app shell/layout
- create sign-in handling with Clerk frontend SDK
- create dashboard screen
- create clinic settings screen
- create doctor management screen
- create patient management screen
- create appointment booking/list screen
- create queue screen
- show no-show risk badge in appointment and queue UI
- connect frontend to backend APIs
- add loading, empty, and error states

### Expected output

- staff can complete core workflow from browser
- UI reflects backend data
- risk score is visible and explainable
- forms are understandable

### Acceptance criteria

- staff can create doctor/patient from UI
- staff can book appointment from UI
- staff can view today's queue
- staff can update queue/appointment status
- risk level is visible where useful
- frontend remains aligned with monorepo structure

## 9. Sprint 5 - Auth Integration + Polish

### Goal

Make authentication, authorization, and core flows stable.

### Key tasks

- finalize Clerk sign-in/session handling
- protect private frontend routes
- verify backend token handling
- map Clerk users to internal users
- finalize Admin/Staff backend checks
- polish validation messages
- improve loading and error states
- fix core UX friction
- add basic API tests if time allows

### Expected output

- authenticated app flow works end to end
- protected data cannot be accessed without backend verification
- core flows feel stable enough for demo

### Acceptance criteria

- unauthenticated users cannot access protected backend routes
- Admin/Staff role behavior is enforced
- common errors show useful messages
- main product demo works repeatedly

## 10. Sprint 6 - Deployment + Docs + Final Release

### Goal

Ship the MVP and document it well enough for review, revision, and interviews.

### Key tasks

- prepare frontend deployment
- prepare backend deployment
- configure production environment variables
- test Neon connection in deployed environment
- test Clerk keys in deployed environment
- update README
- update setup docs
- add known limitations
- add screenshots/demo notes
- prepare final release checklist
- create post-MVP issue list

### Expected output

- deployable MVP build
- clear documentation
- launch-ready repository state
- interviewer-friendly explanation

### Acceptance criteria

- MVP can run locally
- MVP can be deployed or deployment path is documented
- docs match implementation
- known limitations are clearly listed
- post-MVP work is tracked separately

## 11. Suggested issue breakdown

Use small issues. Do not create giant vague tasks.

Good issue examples:

```txt
[Docs] Align MVP AI scope and database model
[Setup] Add npm workspace skeleton
[Backend] Initialize Express TypeScript server
[Database] Add Prisma schema for core MVP entities
[Backend] Add clinic module APIs
[Backend] Add doctor and DoctorClinic APIs
[Backend] Add patient and PatientClinic APIs
[Backend] Add appointment booking API
[Backend] Add queue management API
[AI] Add starter no-show risk scoring service
[Frontend] Add dashboard shell
[Frontend] Add appointment booking form
[Frontend] Add live queue screen
[Auth] Integrate Clerk backend verification
[Deploy] Prepare production environment configuration
```

## 12. Post-MVP roadmap

### Phase 1 - Smarter operations

- advanced no-show prediction
- better risk history
- appointment analytics
- doctor availability windows
- reminder logs

### Phase 2 - Communication

- SMS reminders
- email reminders
- WhatsApp reminders
- patient confirmation links
- cancellation/reschedule flow

### Phase 3 - Portals

- patient portal
- doctor portal
- staff permission customization
- multi-clinic admin access

### Phase 4 - Intelligence

- ML-based prediction
- weather and traffic risk adjustment
- location-aware arrival estimation
- AI assistant for staff suggestions
- smart queue recommendations

### Phase 5 - SaaS maturity

- organization accounts
- subscription/billing
- audit logs
- analytics dashboards
- multi-branch clinic management
- support tools

## 13. Roadmap discipline

If a new feature does not support this flow, postpone it:

```txt
Clinic staff signs in → creates records → books appointment → manages queue → sees no-show risk
```

That is the MVP path.
