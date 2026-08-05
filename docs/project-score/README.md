# Pravaah Project Score Documentation

| Field          | Value                                                                              |
| -------------- | ---------------------------------------------------------------------------------- |
| Issue          | #211                                                                               |
| Status         | Documentation foundation                                                           |
| Last reviewed  | 2026-08-02                                                                         |
| Repository     | Pravaah monorepo                                                                   |
| Evidence rule  | A concept is not demonstrated merely because a Markdown file describes it.         |
| Readiness rule | Do not mark `Interview ready` without verified explanation or simulation evidence. |

Current product status and architecture authority live in [Product Requirements](../PRD.md) and [High-Level Design](../HLD.md). Project Score labels in this folder are viva-preparation labels, not product release statuses.

## Purpose

This folder prepares Pravaah for Project Score assessment by mapping official concepts to real repository evidence, workflow traces, simulation readiness, and interview question categories.

It does not replace product documentation. It points to PRD/HLD/LLD architecture/product docs, implementation files, tests, deployment config, and release audits.

## Official Project Score Rules

| Rule                          | Value                                                    |
| ----------------------------- | -------------------------------------------------------- |
| Threshold to clear            | 6.0                                                      |
| Total concepts                | 63                                                       |
| Buckets                       | 8                                                        |
| Mandatory concepts            | 25                                                       |
| Mandatory score               | 4.6                                                      |
| Minimum optional score needed | 1.4                                                      |
| Attempts                      | One attempt every 24 hours                               |
| Assessment                    | Concept-wise remote viva                                 |
| Required repository docs      | PRD, HLD, and LLD                                        |
| Repository use                | One repository per viva session                          |
| AI assistance                 | Allowed, but the project must be original and understood |

Do not assume scores automatically accumulate across repositories unless official documentation explicitly confirms that behavior.

## Scoring Summary

```txt
63 total concepts
8 buckets
25 mandatory concepts
4.6 mandatory score
At least 1.4 optional score needed
6.0 total threshold
```

Preparation targets:

| Target                               | Value   | Meaning                                                          |
| ------------------------------------ | ------- | ---------------------------------------------------------------- |
| Bare minimum target                  | 6.0     | Official clearing threshold.                                     |
| Recommended evidence target          | 6.6-7.0 | Preparation buffer, not an official requirement.                 |
| Recommended optional evidence buffer | 2.0-2.4 | Practical goal to avoid relying on borderline optional concepts. |

## Current Pravaah-Only Strategy

Pravaah is the primary repository for frontend concepts, backend and system-design concepts, PostgreSQL concepts, authentication and authorization, engineering practices, JavaScript concepts, appointment and queue workflows, transactions and concurrency, testing and deployment.

Pravaah cannot honestly demonstrate every mandatory concept. Unless future repository inspection proves otherwise, MongoDB and LLM mandatory concepts require another repository:

- Schema modeling (Mongo)
- CRUD operations (Mongo)
- LLM API integration
- Prompt engineering
- Structured outputs

Do not add MongoDB or LLM code to Pravaah merely to make this tracker look complete.

## Document Navigation

| Document                                                  | Purpose                                                                 |
| --------------------------------------------------------- | ----------------------------------------------------------------------- |
| [Concept Tracker](CONCEPT_TRACKER.md)                     | Official 63 concepts with Pravaah evidence classification.              |
| [Workflow Evidence](WORKFLOW_EVIDENCE.md)                 | Product workflow traces mapped to concepts and implementation files.    |
| [Simulation Checklist](SIMULATION_CHECKLIST.md)           | Practical demonstration and debugging readiness tracker.                |
| [Question Architecture](INTERVIEW_QUESTIONS.md)           | Representative viva question categories and prompts.                    |
| [Concept Evidence Template](concepts/README.md)           | Format for future detailed concept files.                               |
| [Visual System](../design/VISUAL_SYSTEM.md)               | v0.3 visual standards and current implementation note.                  |
| [Content Guidelines](../design/CONTENT_GUIDELINES.md)     | Product wording, role language, risk language, and release-claim rules. |
| [v0.3 Route Audit](../audits/V0.3_ROUTE_RELEASE_AUDIT.md) | Route-by-route release-readiness evidence and gaps.                     |

## Source-Of-Truth Flow

```txt
PRD
    -> What the product must do

HLD
    -> What major systems make it work

LLD
    -> How those systems are implemented

Workflow Evidence
    -> How requests and state move through the real code

Concept Tracker
    -> Which official Project Score concepts are demonstrated

Interview and Simulation Preparation
    -> How to explain, defend, debug and extend the implementation
```

Current repository equivalents:

| Required source | Current Pravaah source                                                                                                                                                                                        | Status                                       |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------- |
| PRD             | [Product Requirements](../PRD.md), plus product docs such as [MVP](../product/MVP.md), [Workflows](../product/WORKFLOWS.md), release charter, and route audit.                                                | Formal current PRD exists at `docs/PRD.md`.  |
| HLD             | [High-Level Design](../HLD.md), plus [Architecture](../architecture/ARCHITECTURE.md), [Frontend Structure](../architecture/FRONTEND_STRUCTURE.md), [Backend Structure](../architecture/BACKEND_STRUCTURE.md). | Formal current HLD exists at `docs/HLD.md`.  |
| LLD             | [Low-Level Design](../LLD.md), [Frontend LLD section](../LLD.md#frontend-routing-state-and-interface-architecture), [Backend/database LLD section](../LLD.md#backend-database-and-workflow-implementation), plus [API Reference](../architecture/API_REFERENCE.md).              | Formal current LLD exists at `docs/LLD.md`.  |

Missing formal PRD/HLD/LLD files should be recorded honestly. Do not rename existing docs or claim missing files exist.

## Evidence Rules

Valid evidence may include active frontend components, active routes, hooks, API clients, backend routes, middleware, controllers, services, repositories, Zod schemas, Prisma models, migrations, database constraints, transactions, tests, deployment configuration, production verification, pull requests, issues, and screenshots using safe demo data.

Documentation can explain evidence but cannot replace it.

Evidence classification values:

| Classification                | Meaning                                                                            |
| ----------------------------- | ---------------------------------------------------------------------------------- |
| `DEMONSTRATED`                | Pravaah contains concrete evidence strong enough to explain and show.              |
| `PARTIALLY_DEMONSTRATED`      | Some evidence exists, but important parts remain absent or unverified.             |
| `NOT_DEMONSTRATED_IN_PRAVAAH` | No legitimate Pravaah evidence exists.                                             |
| `REQUIRES_ANOTHER_REPOSITORY` | The concept is mandatory or strategically needed but conflicts with Pravaah scope. |

Implementation status values:

- Implemented
- Partially implemented
- Documented only
- Planned
- Not applicable
- Needs verification

## Preparation-Status Rules

Use these explanation/simulation statuses:

- Not started
- Learning
- Can explain
- Can explain with example
- Can simulate with guidance
- Can simulate independently
- Interview ready

Do not infer the student's personal confidence from source code. This foundation initializes conservatively.

## Mandatory-Concept Summary

| Group                             | Mandatory concepts                                                                                                                                                                                                                                                                                                                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Demonstrated in Pravaah           | React component composition; State management with useState; Side effects with useEffect; Async data fetching from API; Client-side routing; Problem modeling; System design basics; RESTful endpoint design; HTTP status codes used correctly; Server-side error handling; Middleware; Relational schema design with PK/FK; SQL JOINs; Environment variables and secrets management; JavaScript async/await. |
| Partially demonstrated in Pravaah | JWT issuance and verification is optional but only partially demonstrated through Clerk verification integration; OAuth/3rd-party login is optional and delegated to Clerk; JavaScript event loop/promises/closures/hoisting have code-adjacent evidence but require personal simulation practice.                                                                                                            |
| Requires stronger verification    | Git workflow; production deployment evidence; automated tests; queue lifecycle enforcement; appointment lifecycle enforcement.                                                                                                                                                                                                                                                                                |
| Requires another repository       | Schema modeling (Mongo); CRUD operations (Mongo); LLM API integration; Prompt engineering; Structured outputs.                                                                                                                                                                                                                                                                                                |

This summary does not mean the user has cleared any concept.

## Optional-Evidence Strategy

Required optional score: 1.4. Recommended preparation target: 2.0-2.4. Recommended total target: 6.6-7.0.

| Category                     | Candidate concepts                                                                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Primary optional targets     | Loading & error UI states; Form handling; Form validation; Request body validation; ORM usage; Transactions; Role-based authorization; Input sanitization; Writing unit tests.           |
| Secondary optional targets   | Responsive layout; Frontend deployment; Backend deployment; SQL indexing; Filtering/ordering/grouping; Normalization basics; Automated API/integration tests; 3rd-party API integration. |
| Needs stronger evidence      | Containerization if introduced later; production deployment smoke evidence; appointment/queue lifecycle enforcement tests.                                                               |
| Not targeted through Pravaah | Mongo optional concepts, Redis, WebSockets, scheduled jobs, SSR, payments, LLM/RAG/agent concepts.                                                                                       |

## Preparation Order

1. Confirm the repository runs
2. Understand the product problem
3. Understand PRD, HLD and LLD
4. Map concepts to real code
5. Trace complete workflows
6. Study failure cases
7. Study security and transaction boundaries
8. Study tests and deployment
9. Practise code navigation
10. Practise concise explanations
11. Record missing concepts honestly
12. Attempt the assessment and use feedback

## Recommended Pravaah Study Order

1. Project Score master map
2. React architecture and frontend concepts
3. Problem modeling and PRD
4. HLD and system architecture
5. Backend architecture, REST APIs and error handling
6. PostgreSQL schema, relationships and Prisma
7. Authentication, authorization and security
8. Transactions, concurrency and advisory locks
9. Git, testing, deployment and engineering practices
10. JavaScript concepts through Pravaah code
11. Onboarding and clinic setup workflow
12. Appointment workflow
13. Queue workflow
14. No-show assistance, dashboard and supporting workflows
15. Final evidence and readiness audit

This is preparation guidance, not an official Kalvium order.

## Maintenance Process

Update this folder when a route is added or removed, a workflow changes, a component standard changes, visual tokens change, product terminology changes, a status changes, a role changes, an issue is completed, a pull request is merged, a deployment occurs, a test is added, a transaction boundary changes, a concept receives new evidence, a simulation is completed, assessor feedback is received, or release status changes.

For every tracker update:

- update `Last reviewed`
- link concrete evidence
- distinguish code inspection from runtime verification
- update the gap
- update the next action
- avoid raising confidence without real preparation evidence

When implementation changes:

```txt
Code changes
    -> Relevant source documentation changes
    -> Workflow evidence changes
    -> Concept evidence changes
    -> Interview and simulation preparation changes
```

When a feature changes from planned to implemented, link implementation, pull request, relevant tests, and deployment status separately. Do not mark production-verified without production evidence.

When a concept is not cleared, record assessor feedback, identify the missing evidence or explanation, update the gap, create a focused next action, keep failure history, and reattempt only after preparation improves. Do not store private proctoring information or sensitive assessment data.
