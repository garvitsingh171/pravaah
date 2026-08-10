# Pravaah Documentation

This folder is the source-of-truth documentation set for Project Pravaah. The docs describe the implemented repository and the remaining release gates, not an ideal future version.

Start here for current truth:

1. [Reviewer Package](reviewer/README.md)
2. [Project Status Dashboard](reviewer/project-status.md)
3. [Product Requirements](PRD.md)
4. [High-Level Design](HLD.md)
5. [Low-Level Design](LLD.md)
6. [Workflow Atlas](workflows/README.md)
7. [Project Score Pack](project-score/README.md)
8. [Interview Guide](interview/INTERVIEW_GUIDE.md)

## Release State

| Version  | State                                                                                                                               |
| -------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `v0.1.0` | Frozen historical MVP baseline.                                                                                                     |
| `v0.2.0` | Historical release-candidate documentation for Public Demo and Self-Service Clinic Onboarding.                                      |
| `v0.3.0` | Released after owner production verification and GO decision. Actual calendar release date and GitHub Release URL are not provided. |

When docs and code conflict, treat code as the immediate implementation truth and update docs in the same PR.

Implementation status and deployment/release status must stay separate. The canonical reviewer-facing status table is [Project Status Dashboard](reviewer/project-status.md).

## Recommended Reading Order

For contributors:

1. [Root README](../README.md)
2. [Reviewer Package](reviewer/README.md)
3. [Project Status Dashboard](reviewer/project-status.md)
4. [Product Requirements](PRD.md)
5. [High-Level Design](HLD.md)
6. [Low-Level Design](LLD.md)
7. [Frontend LLD section](LLD.md#frontend-routing-state-and-interface-architecture)
8. [Backend/database LLD section](LLD.md#backend-database-and-workflow-implementation)
9. [Workflow Atlas](workflows/README.md)
10. [v0.3 Release Notes](releases/V0_3_0_RELEASE_NOTES.md)
11. [Setup](guides/SETUP.md)
12. [Architecture](architecture/ARCHITECTURE.md)
13. [Backend Structure](architecture/BACKEND_STRUCTURE.md)
14. [Frontend Structure](architecture/FRONTEND_STRUCTURE.md)
15. [API Reference](architecture/API_REFERENCE.md)
16. [Testing](guides/TESTING.md)
17. [Contributing](guides/CONTRIBUTING.md)

For interview preparation:

1. [Interview Guide](interview/INTERVIEW_GUIDE.md)
2. [Interview Pack](interview/README.md)
3. [Project Overview](interview/PROJECT_OVERVIEW.md)
4. [Architecture And Decisions](interview/ARCHITECTURE_AND_DECISIONS.md)
5. [Authorization And Security](interview/AUTHORIZATION_AND_SECURITY.md)
6. [Database And Transactions](interview/DATABASE_AND_TRANSACTIONS.md)
7. [Testing And Deployment](interview/TESTING_AND_DEPLOYMENT.md)
8. [Questions And Simulations](interview/QUESTIONS_AND_SIMULATIONS.md)
9. [Screen Share Guide](interview/SCREEN_SHARE_GUIDE.md)

## Source-Of-Truth Hierarchy

| Question                                            | Primary source                                                                                                                                                                                             |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What was in the frozen MVP?                         | [Product MVP](product/MVP.md), then [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md).                                                                                                                          |
| What is current product scope/status?               | [Project Status Dashboard](reviewer/project-status.md), then [v0.3 Release Notes](releases/V0_3_0_RELEASE_NOTES.md), [Product Requirements](PRD.md), then current code.                                    |
| How is the system shaped?                           | [High-Level Design](HLD.md), then [Architecture](architecture/ARCHITECTURE.md).                                                                                                                            |
| How is the implementation put together?             | [Low-Level Design](LLD.md), then [frontend LLD section](LLD.md#frontend-routing-state-and-interface-architecture) and [backend/database LLD section](LLD.md#backend-database-and-workflow-implementation). |
| How does a product action trace through exact code? | [Workflow Atlas](workflows/README.md), then the relevant workflow file and [Implementation Audit](workflows/implementation-audit.md).                                                                      |
| What tables/enums/relations exist?                  | `apps/server/prisma/schema.prisma`, summarized in [Database Design](architecture/DATABASE_DESIGN.md).                                                                                                      |
| What endpoints exist?                               | `apps/server/src/modules/**/**.routes.ts`, summarized in [API Reference](architecture/API_REFERENCE.md).                                                                                                   |
| What auth rules are enforced?                       | `apps/server/src/modules/auth`, summarized in [Auth And Security](architecture/AUTH_AND_SECURITY.md).                                                                                                      |
| How does the frontend work?                         | `apps/web/src`, summarized in [Frontend Structure](architecture/FRONTEND_STRUCTURE.md).                                                                                                                    |
| How should future AI assistants behave?             | [AI Context](ai/AI_CONTEXT.md).                                                                                                                                                                            |

## Reviewer Package And Case Study

| Doc                                                          | Purpose                                                                                     |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| [Reviewer Package](reviewer/README.md)                       | Main evaluator entry point with product summary, status, evidence links, and demo guidance. |
| [Review Paths](reviewer/review-paths.md)                     | Five-minute, fifteen-minute, and deep technical review paths.                               |
| [Project Status Dashboard](reviewer/project-status.md)       | Canonical implementation/deployment status table.                                           |
| [Technical Evidence Map](reviewer/technical-evidence-map.md) | Exact frontend/backend/database/test paths for reviewers.                                   |
| [Reviewer Demo Guide](reviewer/demo-guide.md)                | Step-by-step demo with speaking points, evidence, and fallbacks.                            |
| [Known Limitations](reviewer/known-limitations.md)           | Verified product, technical, testing, deployment, AI, and UX limitations.                   |
| [Safe Sample Data Guide](reviewer/sample-data-guide.md)      | Fictional data rules and seed guidance.                                                     |
| [Screenshot And Asset Audit](reviewer/screenshots.md)        | Current asset classification and screenshot capture policy.                                 |
| [Product Case Study](case-study/README.md)                   | Full technical case study.                                                                  |
| [Portfolio Case Study](case-study/portfolio.md)              | Compact standalone portfolio version.                                                       |
| [Resume Summary](case-study/resume-summary.md)               | Factual resume-ready summary and bullets.                                                   |
| [Interview Narrative](case-study/interview-narrative.md)     | Spoken-style project narrative.                                                             |
| [Reviewer Diagrams](diagrams/REVIEWER_DIAGRAMS.md)           | System, lifecycle, ER, deployment, and documentation diagrams.                              |

## Documentation Index

### Product

| Doc                                   | Purpose                                                                                                     |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| [Product Requirements](PRD.md)        | Current product requirements, capability status, business rules, and traceability.                          |
| [Low-Level Design](LLD.md)            | Current LLD index, implementation baseline, reading order, and status labels.                               |
| [Workflow Atlas](workflows/README.md) | Exact implementation traces from product action to frontend, API, backend, Prisma, database, and UI result. |
| [MVP](product/MVP.md)                 | Frozen v0.1 MVP product boundary and historical limitations.                                                |
| [User Roles](product/USER_ROLES.md)   | Admin, Staff, onboarding state, patient records, doctor records, and permissions.                           |
| [Workflows](product/WORKFLOWS.md)     | Full product flows across frontend, API, backend, and database.                                             |
| [Decisions](product/DECISIONS.md)     | Important product and technical decisions.                                                                  |

### Architecture

| Doc                                                                                 | Purpose                                                                                                  |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| [High-Level Design](HLD.md)                                                         | Current system design, workflows, transactions, deployment boundaries, and traceability.                 |
| [Frontend LLD section](LLD.md#frontend-routing-state-and-interface-architecture)    | Frontend startup, routes, providers, state, UI, SEO, responsive, and performance implementation details. |
| [Backend/database LLD section](LLD.md#backend-database-and-workflow-implementation) | Backend, API, database, transactions, concurrency, and workflow implementation details.                  |
| [Architecture](architecture/ARCHITECTURE.md)                                        | System-level architecture and layer responsibilities.                                                    |
| [Frontend Structure](architecture/FRONTEND_STRUCTURE.md)                            | Frontend routes, providers, feature layout, API helpers, and test layout.                                |
| [Backend Structure](architecture/BACKEND_STRUCTURE.md)                              | Backend modules, middleware, transactions, tests, and build structure.                                   |
| [Database Design](architecture/DATABASE_DESIGN.md)                                  | Prisma models, relations, constraints, and transactional flows.                                          |
| [Auth And Security](architecture/AUTH_AND_SECURITY.md)                              | Clerk identity, internal authorization, onboarding state, and security boundaries.                       |
| [API Structure](architecture/API_STRUCTURE.md)                                      | API conventions, validation, controllers, services, and repository rules.                                |
| [API Reference](architecture/API_REFERENCE.md)                                      | Endpoint reference based on route files.                                                                 |
| [Route SEO Inventory](architecture/ROUTE_SEO_INVENTORY.md)                          | Route indexing decisions, metadata ownership, sitemap scope, and SPA SEO limitation.                     |

### Guides

| Doc                                          | Purpose                                                                    |
| -------------------------------------------- | -------------------------------------------------------------------------- |
| [Setup](guides/SETUP.md)                     | Local development, env vars, Prisma, seeds, and Clerk setup.               |
| [Deployment](guides/DEPLOYMENT.md)           | Vercel, Render, Neon, Clerk, release gates, and deployment placeholders.   |
| [Testing](guides/TESTING.md)                 | Test commands, coverage map, release verification, and gaps.               |
| [Troubleshooting](guides/TROUBLESHOOTING.md) | Common auth, onboarding, database, API, frontend, and deployment failures. |
| [Contributing](guides/CONTRIBUTING.md)       | Issue, branch, PR, docs, checks, and definition-of-done rules.             |
| [Demo Guide](guides/DEMO_GUIDE.md)           | Scripted walkthrough and capture checklist.                                |

### Scope And Releases

| Doc                                                                     | Purpose                                                                                     |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| [v0.2 Scope](scope/V0_2_SCOPE.md)                                       | Release scope, issue map, acceptance criteria, and non-goals.                               |
| [Roadmap](scope/ROADMAP.md)                                             | Frozen baseline, historical v0.2 candidate state, v0.3 release state, and future direction. |
| [Scope And Transition Plan](scope/PRAVAAH_V0_2_SCOPE_AND_TRANSITION.md) | Historical planning record for v0.2.                                                        |
| [v0.1 Freeze](releases/V0_1_0_MVP_FREEZE.md)                            | Historical release snapshot.                                                                |
| [v0.3 Release Notes](releases/V0_3_0_RELEASE_NOTES.md)                  | Current release notes and production verification evidence.                                 |
| [v0.2 Release Notes](releases/V0_2_0_RELEASE_NOTES.md)                  | Historical candidate release notes.                                                         |
| [Release Identity](releases/RELEASE_IDENTITY.md)                        | Verified version, release, deployment, and URL evidence state.                              |
| [Release Checklist](releases/RELEASE_CHECKLIST.md)                      | Code, database, auth, deployment, workflow, and docs gates.                                 |
| [Pravaah v0.3 Release Charter](releases/V0.3_RELEASE_CHARTER.md)        | Planned v0.3 release boundary, definition of done, and gates.                               |

### Design And Content

| Doc                                                | Purpose                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------- |
| [Visual System](design/VISUAL_SYSTEM.md)           | v0.3 visual principles, approved tokens, component standards, and gaps. |
| [Content Guidelines](design/CONTENT_GUIDELINES.md) | Product wording, role language, risk language, and release-claim rules. |

### Project Score

| Doc                                                                       | Purpose                                                                                                    |
| ------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| [Project Score Index](project-score/README.md)                            | Issue #234 preparation pack, evidence rules, status vocabulary, and navigation.                            |
| [Evidence Index](project-score/evidence-index.md)                         | Central repository evidence map and official-rubric provenance note.                                       |
| [Mandatory Concept Evidence](project-score/mandatory-concept-evidence.md) | Mandatory concept evidence, answers, follow-ups, limitations, and improvements.                            |
| [Mandatory Gap Register](project-score/mandatory-gap-register.md)         | Mandatory gaps separated by knowledge, implementation, documentation, demo, testing, and release risk.     |
| [Optional Concept Evidence](project-score/optional-concept-evidence.md)   | Conservative optional shortlist and do-not-claim areas.                                                    |
| [Optional Scoring Strategy](project-score/optional-scoring-strategy.md)   | Internal preparation prioritization only; not an official scoring formula.                                 |
| [Preparation Priority Board](project-score/preparation-priority-board.md) | Priority 0-5 action board for study, demo, implementation, and release evidence.                           |
| [Viva Question Bank](project-score/viva-question-bank.md)                 | Foundation through deep technical questions with repository-backed answers.                                |
| [Workflow Interview Packs](project-score/workflow-interview-packs.md)     | Workflow-specific interview prompts for auth, onboarding, appointments, queue, risk, database, deployment. |
| [Screen-Share Runbooks](project-score/screen-share/appointment.md)        | Appointment, queue, auth, and database/ER demonstration runbooks.                                          |
| [Simulations](project-score/simulations/code-writing.md)                  | Code-writing, debugging, TypeScript recovery, and demo fallback practice.                                  |
| [Revision Sheets](project-score/revision/project-one-page.md)             | One-page and last-hour preparation material.                                                               |
| [AI Assistance Revision](project-score/revision/ai-assistance.md)         | Honest AI-assisted development answers and claim boundaries.                                               |
| [Legacy Concept Tracker](project-score/CONCEPT_TRACKER.md)                | Existing 63-concept tracker retained as repository-available mapping pending official rubric review.       |
| [Legacy Workflow Evidence](project-score/WORKFLOW_EVIDENCE.md)            | Earlier product workflow-to-concept evidence map.                                                          |

### Interview, Engineering, AI, Assets

| Doc                                                                                          | Purpose                                                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| [Interview Guide](interview/INTERVIEW_GUIDE.md)                                              | Authoritative interview explanation, demo script, file map, and truthful claim guardrails.              |
| [Interview Pack](interview/README.md)                                                        | Navigation for interview prep docs.                                                                     |
| [Code Organization](engineering/CODE_ORGANIZATION.md)                                        | Folder, test, import, fixture, and ownership rules.                                                     |
| [Codebase Consistency Audit](engineering/CODEBASE_CONSISTENCY_AUDIT.md)                      | Current structural audit, fixes, exceptions, and follow-ups.                                            |
| [v0.3 Route Release Audit](audits/V0.3_ROUTE_RELEASE_AUDIT.md)                               | Route-by-route product, UI, API, and release-readiness audit.                                           |
| [Frontend Responsive And Performance Audit](audits/FRONTEND_RESPONSIVE_PERFORMANCE_AUDIT.md) | Issue #228 route inventory, mobile/responsive checks, asset inventory, and owner performance procedure. |
| [Documentation Discrepancy Register](audits/DOCUMENTATION_DISCREPANCY_REGISTER.md)           | Current code-document mismatches, superseded findings, and follow-up documentation risks.               |
| [AI Context](ai/AI_CONTEXT.md)                                                               | Guardrails for future AI coding assistants.                                                             |
| [v0.2 Assets](assets/v0.2/README.md)                                                         | Demo asset and screenshot manifest.                                                                     |

## What Not To Let Drift

- Do not claim patient login or doctor login exists.
- Do not claim full multi-clinic SaaS support exists.
- Do not call starter no-show scoring trained ML.
- Do not invent missing release metadata. The actual calendar release date and GitHub Release URL are not provided.
- Do not add fake screenshots, fake deployment URLs, real patient data, or secrets.
- Do not copy the same long explanation into every doc; link to the source doc instead.
