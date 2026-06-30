# Pravaah Documentation

This folder is the source-of-truth documentation set for Project Pravaah. The docs describe the current codebase, not an ideal future version.

## Recommended Reading Order

For new contributors:

1. `README.md` at the repo root
2. `docs/MVP.md`
3. `docs/SETUP.md`
4. `docs/ARCHITECTURE.md`
5. `docs/BACKEND_STRUCTURE.md`
6. `docs/FRONTEND_STRUCTURE.md`
7. `docs/API_REFERENCE.md`
8. `docs/DATABASE_DESIGN.md`
9. `docs/CONTRIBUTING.md`

For interview preparation:

1. `docs/INTERVIEW_GUIDE.md`
2. `docs/MVP.md`
3. `docs/ARCHITECTURE.md`
4. `docs/DATABASE_DESIGN.md`
5. `docs/AUTH_AND_SECURITY.md`
6. `docs/WORKFLOWS.md`
7. `docs/DECISIONS.md`

## Source-Of-Truth Hierarchy

| Question                                | Primary source                                                                   |
| --------------------------------------- | -------------------------------------------------------------------------------- |
| What is in the MVP?                     | `docs/MVP.md`, then current product code                                         |
| How is the system shaped?               | `docs/ARCHITECTURE.md`                                                           |
| What tables/enums/relations exist?      | `apps/server/prisma/schema.prisma`                                               |
| What endpoints exist?                   | `apps/server/src/modules/**/**.routes.ts`, summarized in `docs/API_REFERENCE.md` |
| What auth rules are enforced?           | `apps/server/src/modules/auth`, summarized in `docs/AUTH_AND_SECURITY.md`        |
| How does the frontend work?             | `apps/web/src`, summarized in `docs/FRONTEND_STRUCTURE.md`                       |
| How should future AI assistants behave? | `docs/AI_CONTEXT.md`                                                             |

When docs and code conflict, treat code as the immediate implementation truth and update docs in the same PR.

## Documentation Index

| Doc                                         | Purpose                                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [MVP](MVP.md)                               | Product scope, implemented features, limitations, non-goals, demo scenario.                |
| [Architecture](ARCHITECTURE.md)             | System-level technical source of truth and layer responsibilities.                         |
| [Roadmap](ROADMAP.md)                       | Completed work, current release-readiness stage, remaining MVP tasks, post-MVP direction.  |
| [User Roles](USER_ROLES.md)                 | Admin, Staff, patient record, doctor record, permissions, backend authorization rules.     |
| [Database Design](DATABASE_DESIGN.md)       | Prisma schema explanation, enums, models, constraints, relationships, lifecycle notes.     |
| [Backend Structure](BACKEND_STRUCTURE.md)   | Backend package, entry flow, middleware, modules, transactions, debugging, adding modules. |
| [Frontend Structure](FRONTEND_STRUCTURE.md) | Frontend package, providers, routes, pages, API client, states, limitations.               |
| [API Structure](API_STRUCTURE.md)           | API conventions, response shapes, validation/controller/service/repository rules.          |
| [API Reference](API_REFERENCE.md)           | Endpoint reference generated from the actual route files.                                  |
| [Auth And Security](AUTH_AND_SECURITY.md)   | Clerk flow, internal user mapping, role/status/clinic checks, security limitations.        |
| [Workflows](WORKFLOWS.md)                   | End-to-end product workflows with frontend, API, backend, database, and manual checks.     |
| [Setup](SETUP.md)                           | Local development setup, env vars, scripts, Prisma, seed, common setup errors.             |
| [Deployment](DEPLOYMENT.md)                 | Deployment options and checklist without claiming production deployment exists.            |
| [Testing](TESTING.md)                       | Current tools, existing tests, commands, gaps, future test priorities.                     |
| [Troubleshooting](TROUBLESHOOTING.md)       | Common backend/frontend/auth/database failures and fixes.                                  |
| [Contributing](CONTRIBUTING.md)             | Issue/branch/commit/PR workflow and definition of done.                                    |
| [AI Context](AI_CONTEXT.md)                 | Guardrails for future AI coding assistants.                                                |
| [Interview Guide](INTERVIEW_GUIDE.md)       | Project explanation, architecture answers, trade-offs, likely questions.                   |
| [Decisions](DECISIONS.md)                   | Important technical/product decisions and rationale.                                       |

## Docs Not Added Separately

There is no separate `CODEBASE_TOUR.md` because `ARCHITECTURE.md`, `BACKEND_STRUCTURE.md`, `FRONTEND_STRUCTURE.md`, and `WORKFLOWS.md` cover the same practical tour with less duplication.

## What Not To Let Drift

- Do not claim patient login or doctor login exists.
- Do not claim full multi-clinic SaaS support exists.
- Do not call starter no-show scoring trained ML.
- Do not claim production deployment is complete until the repo proves it.
- Do not copy the same long explanation into every doc; link to the source doc instead.
