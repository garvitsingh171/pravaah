# Pravaah Documentation

This folder is the source-of-truth documentation set for Project Pravaah. The docs describe the implemented repository and the remaining release gates, not an ideal future version.

## Release State

| Version  | State                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0.1.0` | Frozen historical MVP baseline.                                                                                                                                 |
| `v0.2.0` | Release candidate for Public Demo and Self-Service Clinic Onboarding. Documentation is ready; test, build, deployment, and screenshot verification are pending. |

When docs and code conflict, treat code as the immediate implementation truth and update docs in the same PR.

## Recommended Reading Order

For contributors:

1. [Root README](../README.md)
2. [v0.2 Scope](scope/V0_2_SCOPE.md)
3. [Setup](guides/SETUP.md)
4. [Architecture](architecture/ARCHITECTURE.md)
5. [Backend Structure](architecture/BACKEND_STRUCTURE.md)
6. [Frontend Structure](architecture/FRONTEND_STRUCTURE.md)
7. [API Reference](architecture/API_REFERENCE.md)
8. [Testing](guides/TESTING.md)
9. [Contributing](guides/CONTRIBUTING.md)

For interview preparation:

1. [Interview Pack](interview/README.md)
2. [Project Overview](interview/PROJECT_OVERVIEW.md)
3. [Architecture And Decisions](interview/ARCHITECTURE_AND_DECISIONS.md)
4. [Authorization And Security](interview/AUTHORIZATION_AND_SECURITY.md)
5. [Database And Transactions](interview/DATABASE_AND_TRANSACTIONS.md)
6. [Testing And Deployment](interview/TESTING_AND_DEPLOYMENT.md)
7. [Questions And Simulations](interview/QUESTIONS_AND_SIMULATIONS.md)
8. [Screen Share Guide](interview/SCREEN_SHARE_GUIDE.md)

## Source-Of-Truth Hierarchy

| Question                                | Primary source                                                                                                |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| What was in the frozen MVP?             | [Product MVP](product/MVP.md), then [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md).                             |
| What is in v0.2?                        | [v0.2 Scope](scope/V0_2_SCOPE.md), [v0.2 Release Notes](releases/V0_2_0_RELEASE_NOTES.md), then current code. |
| How is the system shaped?               | [Architecture](architecture/ARCHITECTURE.md).                                                                 |
| What tables/enums/relations exist?      | `apps/server/prisma/schema.prisma`, summarized in [Database Design](architecture/DATABASE_DESIGN.md).         |
| What endpoints exist?                   | `apps/server/src/modules/**/**.routes.ts`, summarized in [API Reference](architecture/API_REFERENCE.md).      |
| What auth rules are enforced?           | `apps/server/src/modules/auth`, summarized in [Auth And Security](architecture/AUTH_AND_SECURITY.md).         |
| How does the frontend work?             | `apps/web/src`, summarized in [Frontend Structure](architecture/FRONTEND_STRUCTURE.md).                       |
| How should future AI assistants behave? | [AI Context](ai/AI_CONTEXT.md).                                                                               |

## Documentation Index

### Product

| Doc                                 | Purpose                                                                           |
| ----------------------------------- | --------------------------------------------------------------------------------- |
| [MVP](product/MVP.md)               | Frozen v0.1 MVP product boundary and historical limitations.                      |
| [User Roles](product/USER_ROLES.md) | Admin, Staff, onboarding state, patient records, doctor records, and permissions. |
| [Workflows](product/WORKFLOWS.md)   | End-to-end product flows across frontend, API, backend, and database.             |
| [Decisions](product/DECISIONS.md)   | Important product and technical decisions.                                        |

### Architecture

| Doc                                                      | Purpose                                                                            |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Architecture](architecture/ARCHITECTURE.md)             | System-level architecture and layer responsibilities.                              |
| [Frontend Structure](architecture/FRONTEND_STRUCTURE.md) | Frontend routes, providers, feature layout, API helpers, and test layout.          |
| [Backend Structure](architecture/BACKEND_STRUCTURE.md)   | Backend modules, middleware, transactions, tests, and build structure.             |
| [Database Design](architecture/DATABASE_DESIGN.md)       | Prisma models, relations, constraints, and transactional flows.                    |
| [Auth And Security](architecture/AUTH_AND_SECURITY.md)   | Clerk identity, internal authorization, onboarding state, and security boundaries. |
| [API Structure](architecture/API_STRUCTURE.md)           | API conventions, validation, controllers, services, and repository rules.          |
| [API Reference](architecture/API_REFERENCE.md)           | Endpoint reference based on route files.                                           |

### Guides

| Doc                                          | Purpose                                                                         |
| -------------------------------------------- | ------------------------------------------------------------------------------- |
| [Setup](guides/SETUP.md)                     | Local development, env vars, Prisma, seeds, Clerk, and E2E setup.               |
| [Deployment](guides/DEPLOYMENT.md)           | Vercel, Render, Neon, Clerk, release gates, and deployment placeholders.        |
| [Testing](guides/TESTING.md)                 | Test commands, coverage map, release verification, and gaps.                    |
| [Troubleshooting](guides/TROUBLESHOOTING.md) | Common auth, onboarding, database, API, frontend, E2E, and deployment failures. |
| [Contributing](guides/CONTRIBUTING.md)       | Issue, branch, PR, docs, checks, and definition-of-done rules.                  |
| [Demo Guide](guides/DEMO_GUIDE.md)           | Scripted v0.2 walkthrough and capture checklist.                                |

### Scope And Releases

| Doc                                                                     | Purpose                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| [v0.2 Scope](scope/V0_2_SCOPE.md)                                       | Release scope, issue map, acceptance criteria, and non-goals.   |
| [Roadmap](scope/ROADMAP.md)                                             | Frozen baseline, v0.2 candidate state, and post-v0.2 direction. |
| [Scope And Transition Plan](scope/PRAVAAH_V0_2_SCOPE_AND_TRANSITION.md) | Historical planning record for v0.2.                            |
| [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md)                            | Historical release snapshot.                                    |
| [v0.2 Release Notes](releases/V0_2_0_RELEASE_NOTES.md)                  | Candidate release notes and owner verification gates.           |
| [Pravaah v0.3 Release Charter](releases/V0.3_RELEASE_CHARTER.md)        | Planned v0.3 release boundary, definition of done, and gates.   |

### Interview, Engineering, AI, Assets

| Doc                                                                     | Purpose                                                      |
| ----------------------------------------------------------------------- | ------------------------------------------------------------ |
| [Interview Pack](interview/README.md)                                   | Navigation for interview prep docs.                          |
| [Code Organization](engineering/CODE_ORGANIZATION.md)                   | Folder, test, import, fixture, and ownership rules.          |
| [Codebase Consistency Audit](engineering/CODEBASE_CONSISTENCY_AUDIT.md) | Current structural audit, fixes, exceptions, and follow-ups. |
| [AI Context](ai/AI_CONTEXT.md)                                          | Guardrails for future AI coding assistants.                  |
| [v0.2 Assets](assets/v0.2/README.md)                                    | Demo asset and screenshot manifest.                          |

## What Not To Let Drift

- Do not claim patient login or doctor login exists.
- Do not claim full multi-clinic SaaS support exists.
- Do not call starter no-show scoring trained ML.
- Do not mark `v0.2.0` released until tests, builds, deployment checks, and screenshots are verified.
- Do not add fake screenshots, fake deployment URLs, real patient data, or secrets.
- Do not copy the same long explanation into every doc; link to the source doc instead.
