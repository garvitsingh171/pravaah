# Pravaah Product Case Study

## 1. Project Summary

Pravaah means "flow". Pravaah is a clinic flow management app for small and medium clinics where Admin and Staff users manage clinic setup, doctors, patients, appointments, daily queue state, dashboard visibility, and explainable rule-based no-show assistance.

Current status: `v0.2.0` release candidate. The source tree implements the main v0.2 workflows, but this repository does not record verified production URLs, deployed commit SHAs, or real product screenshots. See the canonical [Project Status Dashboard](../reviewer/project-status.md).

Existing interview preparation includes an [AI assistance revision note](../project-score/revision/ai-assistance.md). This case study is written as a product and engineering explanation of the verified repository, not as a claim that every line was authored without AI assistance.

## 2. Problem

Small and medium clinics often coordinate daily work through notebooks, phone calls, WhatsApp messages, disconnected records, manual appointment tracking, and ad hoc queue decisions. That can create missed appointments, delayed arrivals, underused doctor time, queue confusion, and weak day-level visibility.

Pravaah does not claim measured operational impact yet. It is currently evaluated through implementation completeness, technical correctness, demo readiness, and reviewer evidence.

## 3. Users

| User    | Current behavior                                                                                                           |
| ------- | -------------------------------------------------------------------------------------------------------------------------- |
| Admin   | Authenticated clinic operator. Can complete onboarding, manage clinic settings/sample data, and use operational workflows. |
| Staff   | Authenticated clinic operator. Can use doctor, patient, appointment, queue, and dashboard workflows.                       |
| Patient | Record only. No login or portal.                                                                                           |
| Doctor  | Record only. No login or portal.                                                                                           |

Clerk authenticates identity. Pravaah authorizes operational access through internal `User` records, role, status, and clinic context.

## 4. Product Goal

Pravaah is a clinic flow/operations product, not only an appointment CRUD system.

```txt
Clinic setup
-> Doctor and patient records
-> Appointment
-> Arrival
-> Queue
-> Call
-> Consultation completion / cancellation / no-show
-> Dashboard review
```

## 5. Product Scope

Implemented source scope includes public entry, onboarding, clinic settings, sample data, doctor and patient management, appointment creation/status, queue management/reorder, dashboard, and deterministic no-show assistance.

Out of scope today: patient/doctor login, trained ML, automatic reminders, billing, prescriptions, inventory, full medical records, native mobile apps, and full multi-clinic SaaS membership management.

## 6. Core Workflows

Detailed traces live in the [Workflow Atlas](../workflows/README.md). The case-study summary is:

- Authentication: Clerk session is required; the backend resolves internal user state before operational access.
- Onboarding: a signed-in Clerk identity without an internal user can create a clinic and first Admin.
- First-run setup: the dashboard checklist reflects whether clinic settings, doctors, patients, and appointments exist.
- Doctor/patient management: records are scoped through `DoctorClinic` and `PatientClinic`.
- Appointment booking: validates clinic/doctor/patient membership, checks exact same-time doctor conflict, creates appointment, queue entry, and no-show prediction in a transaction.
- Queue operations: list by clinic/date, update status, sync appointment status, and reorder active entries for one doctor/date.
- Dashboard operations: summarize the day, high-risk appointments, activity, and setup state.

## 7. Architecture

Pravaah uses React, TypeScript, Vite, Tailwind CSS, Clerk, Express, Zod, Prisma, and PostgreSQL in an npm workspace monorepo.

The primary backend flow is:

```txt
Route
-> validation/auth middleware
-> controller
-> service
-> repository
-> Prisma
-> PostgreSQL
```

Routes own HTTP shape and middleware ordering. Validation uses Zod schemas. Controllers translate request/response boundaries. Services hold business decisions. Repositories isolate Prisma queries, transactions, and raw SQL/advisory locks.

## 8. Database Design

The schema uses relational ownership and join tables:

- `User` maps Clerk identities to Pravaah role, status, and one active `clinicId`.
- `Clinic` owns operational context.
- `DoctorClinic` links doctors to clinics.
- `PatientClinic` links patients to clinics and stores clinic-specific attendance/risk context.
- `Appointment` references clinic, doctor, patient, and creator.
- `QueueEntry` is one-to-one with appointment.
- `NoShowPrediction` is one-to-one with appointment.

Join tables preserve a future path toward multi-clinic relationships, but current UI/API creates new records with one clinic link rather than a mature multi-clinic sharing workflow.

## 9. Authentication And Authorization

This is a central engineering decision:

```txt
Clerk
-> authenticates external identity
Pravaah backend
-> resolves internal User
-> checks UserStatus
-> checks role
-> checks clinic context
-> authorizes resource access
```

Onboarding is the main exception: `GET /api/auth/onboarding-status` and `POST /api/auth/onboarding/clinic` need a Clerk identity but may run before an internal Pravaah `User` exists.

## 10. Appointment Engineering

Appointment creation does meaningful multi-record work:

- validates clinic exists and is active
- verifies doctor exists and is linked to the clinic
- verifies patient exists and is linked to the clinic
- counts patient history used by risk scoring
- takes an advisory lock for clinic/doctor/scheduled time
- rejects exact same-time conflicts for active appointment statuses
- calculates the next queue position for that doctor/date
- creates appointment, queue entry, and no-show prediction in a transaction

Current limitation: opening hours, slot duration, and buffer settings exist, but booking does not enforce those rules yet.

## 11. Queue Engineering

Queue workflows synchronize operational state with appointments:

- queue entries are created with appointments
- status updates map queue state back to appointment state
- terminal queue states cannot be changed
- reorder requires one clinic, one doctor, one date, all active entries, and no terminal entries
- reorder uses a transaction, advisory lock, temporary high positions, then final 1-based positions

Current limitation: no audit log records who performed each queue/status decision.

## 12. Explainable No-Show Assistance

Pravaah currently uses deterministic, explainable no-show risk assistance rather than a trained machine-learning model.

Factors include previous no-shows, late-arrival history, distance from clinic, short-notice booking, long-advance booking, new-patient status, and strong attendance history. The output is a risk level, score, reason list, suggested actions, and rule version.

Humans remain responsible for decisions. The system does not automatically cancel appointments, reorder queues, or message patients.

## 13. Important Engineering Decisions

| Decision                                    | Benefit                                                                                         | Trade-off                                                           |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Clerk for identity                          | Avoids custom password/session infrastructure.                                                  | Authorization must still be implemented and tested internally.      |
| PostgreSQL with Prisma                      | Relational constraints fit clinic workflows and Prisma keeps TypeScript models close to schema. | Some concurrency needs raw SQL/advisory locks.                      |
| Monorepo                                    | Keeps frontend/backend/docs changes coordinated.                                                | Workspace versioning must be handled carefully.                     |
| Join tables for doctor/patient clinic links | Supports clinic-specific relationship data and future expansion.                                | Current app must be honest that multi-clinic UX is not implemented. |
| Deterministic risk scoring                  | Explainable and demo-friendly.                                                                  | No learned accuracy or personalization from historical datasets.    |
| Human-controlled queue                      | Keeps staff responsible for clinical operations.                                                | No automatic optimization or notification loop.                     |

## 14. Challenges

| Challenge                                  | Approach                                                                         | Remaining limitation                                      |
| ------------------------------------------ | -------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Clerk identity before internal user exists | Separate identity-only onboarding middleware from full app authentication.       | Recovery state still requires admin/project-owner repair. |
| Avoiding orphan clinic provisioning        | Create clinic plus first Admin in one transaction with replay/conflict handling. | Staff invitation/administration remains future work.      |
| Clinic isolation                           | Backend route middleware verifies clinic access before handlers.                 | Single active `clinicId`, no membership switcher.         |
| Appointment-to-queue consistency           | Create appointment, queue entry, and risk in one transaction.                    | Hours/buffer rules are not enforced.                      |
| Queue reorder consistency                  | Lock one doctor/date queue scope and require complete active entry list.         | No audit trail and no universal race-condition claim.     |
| Documentation drift                        | Add Workflow Atlas, Project Score pack, and reviewer status dashboard.           | Docs must be maintained when source changes.              |

## 15. Testing And Validation

Backend Vitest tests cover auth, onboarding, access service, clinic behavior, appointments, queues, dashboard, predictions, and validation where test files exist. Frontend Vitest/React Testing Library tests cover app routing, protected shell, onboarding, dashboard, doctors, patients, queue, API client, metadata, and selected UI helpers.

Current gaps: no browser E2E suite, no committed screenshot verification, and some page/service areas have no dedicated tests.

## 16. Deployment

The frontend is a Vite app with a Vercel SPA rewrite config. The backend is an Express app documented for a Node host such as Render. The database is PostgreSQL; Neon is acceptable as a hosted provider, but the code only requires a PostgreSQL `DATABASE_URL`. Clerk provides authentication.

Verified production frontend/backend URLs and deployed SHAs are not committed. See [Release Identity](../releases/RELEASE_IDENTITY.md).

## 17. Results And Current Status

Evidence-backed results:

- core clinic-side Admin/Staff workflows are implemented in source
- self-service onboarding and first Admin provisioning are implemented
- appointment booking creates queue and risk records in a transactional flow
- queue status/reorder workflows are implemented with selected conflict checks
- deterministic no-show assistance is persisted and shown in UI paths
- reviewer, workflow, Project Score, and release-readiness docs now point to canonical evidence

No real user counts, clinic counts, revenue, throughput, uptime, medical outcomes, no-show accuracy, or performance gains are claimed.

## 18. Lessons

- Authentication is not authorization.
- Frontend route guards are useful, but backend authorization is the real boundary.
- Multi-record workflows need transactions, and transactions still need correct scope and conflict handling.
- Relational modeling choices shape future product flexibility.
- Explainability matters for decision-support features.
- Release status must stay separate from implementation status.
- AI-assisted development still requires source verification, limitation tracking, and owner understanding.

## 19. Limitations

See [Known Limitations](../reviewer/known-limitations.md). The most important are: no verified live deployment evidence, no trained ML, no patient/doctor portals, partial lifecycle/concurrency coverage, no E2E suite, and no committed real screenshots.

## 20. Future Improvements

Near term:

- complete release verification and screenshot capture
- add tests for documented coverage gaps
- strengthen backend appointment transition rules
- enforce clinic operating hours, slot duration, and buffer rules
- add attendance counter maintenance

Product evolution:

- reminders and communication integrations
- doctor availability
- audit logs
- richer analytics
- better dashboard drill-downs

User expansion:

- patient portal
- doctor portal
- advanced Staff/Admin permissions

Multi-clinic evolution:

- clinic membership model
- multi-clinic context switching
- safer shared doctor/patient update semantics

AI evolution:

- historical prediction dataset
- evaluation and fairness review
- trained model only after data governance exists
- monitoring and human override review
