# Pravaah Reviewer Package

Pravaah means "flow". In this project it refers to clinic flow: the path from clinic setup to doctor and patient records, appointment booking, arrival, queue handling, consultation completion, and daily operational review.

Pravaah is a clinic-side operations app for small and medium clinics. It is built for authenticated Admin and Staff users who manage clinic records, appointments, today's queue, and explainable rule-based no-show assistance. Patients and doctors are currently records in the system, not login roles.

## Current Status

| Question                     | Answer                                                                                                             |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Current product stage        | `v0.3.0` release candidate / production verification pending.                                                      |
| Current implementation state | Core clinic-side workflows are implemented in source.                                                              |
| Current deployment state     | Live production URLs, deployed SHAs, and screenshot evidence are not recorded in this repository.                  |
| Release identity             | Root `package.json` is `0.3.0`; workspace packages are still `0.1.0`; production release evidence remains pending. |
| Auth model                   | Clerk authenticates identity; Pravaah backend resolves internal `User`, role, status, and clinic access.           |
| Risk model                   | Deterministic, explainable no-show risk assistance. It is not trained machine learning.                            |

Use [Project Status](project-status.md) as the canonical feature/release dashboard. Other reviewer-facing documents should link to it instead of inventing their own status table.

## What Is Implemented

Implemented in source, but not release-verified in this repository:

- public landing, sign-in, and sign-up entry points
- onboarding-aware routing and self-service clinic provisioning
- Admin clinic settings and optional fictional sample data
- doctor and patient create/list/edit workflows
- appointment creation, listing, filtering, status updates, queue entry creation, and stored no-show risk output
- queue listing, status updates, and manual reorder within one doctor/date queue
- dashboard summary, high-risk appointments, activity feed, and first-run setup checklist
- backend validation, internal authorization, selected transactions, and selected advisory locks
- frontend and backend automated tests where files exist

Not implemented or not proven:

- patient login, doctor login, patient portal, doctor portal
- trained ML no-show prediction
- automatic reminders, WhatsApp/SMS/email automation
- billing, prescriptions, inventory, full medical records
- full multi-clinic membership/context switching
- browser E2E test suite
- verified public deployment URLs in this repository

## Review Paths

Start with [Review Paths](review-paths.md), which gives three routes:

- five-minute review: product, status, architecture, main workflow, limitations
- fifteen-minute review: auth, appointment, queue, database, deployment, trade-offs
- deep technical review: PRD, HLD, LLD, Workflow Atlas, Project Score pack, Prisma, tests, and release docs

## Primary Evidence

| Need                         | Go To                                                                                                             |
| ---------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Canonical status dashboard   | [Project Status](project-status.md)                                                                               |
| Exact product-to-code traces | [Workflow Atlas](../workflows/README.md)                                                                          |
| Product requirements         | [PRD](../PRD.md)                                                                                                  |
| System design                | [HLD](../HLD.md)                                                                                                  |
| Implementation design        | [LLD](../LLD.md)                                                                                                  |
| Project Score evidence       | [Project Score Pack](../project-score/README.md)                                                                  |
| Deep source map              | [Technical Evidence Map](technical-evidence-map.md)                                                               |
| Database design              | [Database Design](../architecture/DATABASE_DESIGN.md) and [Prisma schema](../../apps/server/prisma/schema.prisma) |
| API reference                | [API Reference](../architecture/API_REFERENCE.md)                                                                 |
| Auth/security                | [Auth And Security](../architecture/AUTH_AND_SECURITY.md)                                                         |
| Release candidate notes      | [v0.3 Release Notes](../releases/V0_3_0_RELEASE_NOTES.md)                                                         |
| Release identity             | [Release Identity](../releases/RELEASE_IDENTITY.md)                                                               |
| Release checklist            | [Release Checklist](../releases/RELEASE_CHECKLIST.md)                                                             |
| Case study                   | [Full Case Study](../case-study/README.md)                                                                        |
| Known limitations            | [Known Limitations](known-limitations.md)                                                                         |
| Demo script                  | [Reviewer Demo Guide](demo-guide.md)                                                                              |
| Safe sample data             | [Safe Sample Data Guide](sample-data-guide.md)                                                                    |
| Diagrams                     | [Reviewer Diagrams](../diagrams/REVIEWER_DIAGRAMS.md)                                                             |

## How To Run

Use [Setup](../guides/SETUP.md) for full local instructions. The short path is:

```bash
npm install
cd apps/server
npx prisma generate
npx prisma migrate dev
cd ../..
npm run seed:demo
npm run dev:server
npm run dev:web
```

Local defaults:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
Health:   http://localhost:5000/api/health
```

The demo seed requires safe local Clerk mapping before a seeded user can sign in. Placeholder Clerk IDs do not bypass authentication.

## Demo Safely

Use [Reviewer Demo Guide](demo-guide.md) with a development, preview, or demo environment. Use only fictional sample data, never real patient information or real account credentials. If a live deployment is not verified, demo locally and say that release verification is still pending.
