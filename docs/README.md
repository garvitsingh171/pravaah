# Pravaah Documentation

This folder is the source-of-truth documentation set for Project Pravaah. The docs describe the implemented repository and the remaining release gates, not an ideal future version.

Start here for current truth:

1. [Product Requirements](PRODUCT_REQUIREMENTS.md)
2. [High-Level Design](HIGH_LEVEL_DESIGN.md)
3. [Interview Guide](INTERVIEW_GUIDE.md)

## Release State

| Version  | State                                                                                                                                                           |
| -------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `v0.1.0` | Frozen historical MVP baseline.                                                                                                                                 |
| `v0.2.0` | Release candidate for Public Demo and Self-Service Clinic Onboarding. Documentation is ready; test, build, deployment, and screenshot verification are pending. |

When docs and code conflict, treat code as the immediate implementation truth and update docs in the same PR.

## Recommended Reading Order

For contributors:

1. [Root README](../README.md)
2. [Product Requirements](PRODUCT_REQUIREMENTS.md)
3. [High-Level Design](HIGH_LEVEL_DESIGN.md)
4. [v0.2 Scope](scope/V0_2_SCOPE.md)
5. [Setup](guides/SETUP.md)
6. [Architecture](architecture/ARCHITECTURE.md)
7. [Backend Structure](architecture/BACKEND_STRUCTURE.md)
8. [Frontend Structure](architecture/FRONTEND_STRUCTURE.md)
9. [API Reference](architecture/API_REFERENCE.md)
10. [Testing](guides/TESTING.md)
11. [Contributing](guides/CONTRIBUTING.md)

For interview preparation:

1. [Interview Guide](INTERVIEW_GUIDE.md)
2. [Interview Pack](interview/README.md)
3. [Project Overview](interview/PROJECT_OVERVIEW.md)
4. [Architecture And Decisions](interview/ARCHITECTURE_AND_DECISIONS.md)
5. [Authorization And Security](interview/AUTHORIZATION_AND_SECURITY.md)
6. [Database And Transactions](interview/DATABASE_AND_TRANSACTIONS.md)
7. [Testing And Deployment](interview/TESTING_AND_DEPLOYMENT.md)
8. [Questions And Simulations](interview/QUESTIONS_AND_SIMULATIONS.md)
9. [Screen Share Guide](interview/SCREEN_SHARE_GUIDE.md)

## Source-Of-Truth Hierarchy

| Question                                | Primary source                                                                                              |
| --------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| What was in the frozen MVP?             | [Product MVP](product/MVP.md), then [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md).                           |
| What is current product scope/status?   | [Product Requirements](PRODUCT_REQUIREMENTS.md), then [v0.2 Scope](scope/V0_2_SCOPE.md), then current code. |
| How is the system shaped?               | [High-Level Design](HIGH_LEVEL_DESIGN.md), then [Architecture](architecture/ARCHITECTURE.md).               |
| What tables/enums/relations exist?      | `apps/server/prisma/schema.prisma`, summarized in [Database Design](architecture/DATABASE_DESIGN.md).       |
| What endpoints exist?                   | `apps/server/src/modules/**/**.routes.ts`, summarized in [API Reference](architecture/API_REFERENCE.md).    |
| What auth rules are enforced?           | `apps/server/src/modules/auth`, summarized in [Auth And Security](architecture/AUTH_AND_SECURITY.md).       |
| How does the frontend work?             | `apps/web/src`, summarized in [Frontend Structure](architecture/FRONTEND_STRUCTURE.md).                     |
| How should future AI assistants behave? | [AI Context](ai/AI_CONTEXT.md).                                                                             |

## Documentation Index

### Product

| Doc                                             | Purpose                                                                            |
| ----------------------------------------------- | ---------------------------------------------------------------------------------- |
| [Product Requirements](PRODUCT_REQUIREMENTS.md) | Current product requirements, capability status, business rules, and traceability. |
| [MVP](product/MVP.md)                           | Frozen v0.1 MVP product boundary and historical limitations.                       |
| [User Roles](product/USER_ROLES.md)             | Admin, Staff, onboarding state, patient records, doctor records, and permissions.  |
| [Workflows](product/WORKFLOWS.md)               | Full product flows across frontend, API, backend, and database.                    |
| [Decisions](product/DECISIONS.md)               | Important product and technical decisions.                                         |

### Architecture

| Doc                                                      | Purpose                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| [High-Level Design](HIGH_LEVEL_DESIGN.md)                | Current system design, workflows, transactions, deployment boundaries, and traceability. |
| [Architecture](architecture/ARCHITECTURE.md)             | System-level architecture and layer responsibilities.                                    |
| [Frontend Structure](architecture/FRONTEND_STRUCTURE.md) | Frontend routes, providers, feature layout, API helpers, and test layout.                |
| [Backend Structure](architecture/BACKEND_STRUCTURE.md)   | Backend modules, middleware, transactions, tests, and build structure.                   |
| [Database Design](architecture/DATABASE_DESIGN.md)       | Prisma models, relations, constraints, and transactional flows.                          |
| [Auth And Security](architecture/AUTH_AND_SECURITY.md)   | Clerk identity, internal authorization, onboarding state, and security boundaries.       |
| [API Structure](architecture/API_STRUCTURE.md)           | API conventions, validation, controllers, services, and repository rules.                |
| [API Reference](architecture/API_REFERENCE.md)           | Endpoint reference based on route files.                                                 |

### Guides

| Doc                                          | Purpose                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| [Setup](guides/SETUP.md)                     | Local development, env vars, Prisma, seeds, and Clerk setup.               |
| [Deployment](guides/DEPLOYMENT.md)           | Vercel, Render, Neon, Clerk, release gates, and deployment placeholders.   |
| [Testing](guides/TESTING.md)                 | Test commands, coverage map, release verification, and gaps.               |
| [Troubleshooting](guides/TROUBLESHOOTING.md) | Common auth, onboarding, database, API, frontend, and deployment failures. |
| [Contributing](guides/CONTRIBUTING.md)       | Issue, branch, PR, docs, checks, and definition-of-done rules.             |
| [Demo Guide](guides/DEMO_GUIDE.md)           | Scripted v0.2 walkthrough and capture checklist.                           |

### Scope And Releases

| Doc                                                                     | Purpose                                                         |
| ----------------------------------------------------------------------- | --------------------------------------------------------------- |
| [v0.2 Scope](scope/V0_2_SCOPE.md)                                       | Release scope, issue map, acceptance criteria, and non-goals.   |
| [Roadmap](scope/ROADMAP.md)                                             | Frozen baseline, v0.2 candidate state, and post-v0.2 direction. |
| [Scope And Transition Plan](scope/PRAVAAH_V0_2_SCOPE_AND_TRANSITION.md) | Historical planning record for v0.2.                            |
| [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md)                            | Historical release snapshot.                                    |
| [v0.2 Release Notes](releases/V0_2_0_RELEASE_NOTES.md)                  | Candidate release notes and owner verification gates.           |
| [Pravaah v0.3 Release Charter](releases/V0.3_RELEASE_CHARTER.md)        | Planned v0.3 release boundary, definition of done, and gates.   |

### Design And Content

| Doc                                                | Purpose                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| [Visual System](design/VISUAL_SYSTEM.md)           | v0.3 visual principles, approved tokens, component standards, and gaps. |
| [Content Guidelines](design/CONTENT_GUIDELINES.md) | Product wording, role language, risk language, and release-claim rules. |

### Project Score

| Doc                                                           | Purpose                                                               |
| ------------------------------------------------------------- | --------------------------------------------------------------------- |
| [Project Score Index](project-score/README.md)                | Project Score rules, preparation strategy, evidence rules, and order. |
| [Concept Tracker](project-score/CONCEPT_TRACKER.md)           | Exact 63-concept tracker mapped to Pravaah implementation evidence.   |
| [Workflow Evidence](project-score/WORKFLOW_EVIDENCE.md)       | Product workflow traces mapped to code and Project Score concepts.    |
| [Simulation Checklist](project-score/SIMULATION_CHECKLIST.md) | Practical readiness tracker for demos, debugging, and explanations.   |
| [Question Architecture](project-score/INTERVIEW_QUESTIONS.md) | Representative viva question categories and prompts.                  |
| [Concept Evidence Template](project-score/concepts/README.md) | Template and rules for future detailed concept evidence files.        |

### Interview, Engineering, AI, Assets

| Doc                                                                     | Purpose                                                                                    |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| [Interview Guide](INTERVIEW_GUIDE.md)                                   | Authoritative interview explanation, demo script, file map, and truthful claim guardrails. |
| [Interview Pack](interview/README.md)                                   | Navigation for interview prep docs.                                                        |
| [Code Organization](engineering/CODE_ORGANIZATION.md)                   | Folder, test, import, fixture, and ownership rules.                                        |
| [Codebase Consistency Audit](engineering/CODEBASE_CONSISTENCY_AUDIT.md) | Current structural audit, fixes, exceptions, and follow-ups.                               |
| [v0.3 Route Release Audit](audits/V0.3_ROUTE_RELEASE_AUDIT.md)          | Route-by-route product, UI, API, and release-readiness audit.                              |
| [AI Context](ai/AI_CONTEXT.md)                                          | Guardrails for future AI coding assistants.                                                |
| [v0.2 Assets](assets/v0.2/README.md)                                    | Demo asset and screenshot manifest.                                                        |

## What Not To Let Drift

- Do not claim patient login or doctor login exists.
- Do not claim full multi-clinic SaaS support exists.
- Do not call starter no-show scoring trained ML.
- Do not mark `v0.2.0` released until tests, builds, deployment checks, and screenshots are verified.
- Do not add fake screenshots, fake deployment URLs, real patient data, or secrets.
- Do not copy the same long explanation into every doc; link to the source doc instead.
