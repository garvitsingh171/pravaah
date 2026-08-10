# Preparation Priority Board

## Priority 0 - Mandatory Gaps

| Concept/workflow                                | Current status              | Current evidence                | Required action                                                  | Study work                            | Demonstration work     | Implementation work | Completion condition                          |
| ----------------------------------------------- | --------------------------- | ------------------------------- | ---------------------------------------------------------------- | ------------------------------------- | ---------------------- | ------------------- | --------------------------------------------- |
| Mongo mandatory concepts                        | `NOT_APPLICABLE` in Pravaah | No Mongo code                   | Verify official rubric and prepare another real repo if required | Understand why Pravaah chose Postgres | Do not demo in Pravaah | None in Pravaah     | Owner has verified plan for Mongo requirement |
| LLM/prompt/structured-output mandatory concepts | `NOT_APPLICABLE` in Pravaah | Deterministic risk service only | Verify rubric and prepare separate LLM evidence if required      | Explain deterministic vs LLM clearly  | Do not demo as LLM     | None in Pravaah     | Owner can answer without overclaiming         |

## Priority 1 - Mandatory Explanation Practice

| Concept/workflow | Current status     | Current evidence            | Required action                        | Study work                       | Demonstration work                         | Implementation work | Completion condition                       |
| ---------------- | ------------------ | --------------------------- | -------------------------------------- | -------------------------------- | ------------------------------------------ | ------------------- | ------------------------------------------ |
| Event loop       | `PARTIAL_EVIDENCE` | Async Pravaah code          | Practise JS event loop snippet         | Microtasks/macrotasks/call stack | Whiteboard snippet                         | None                | Owner explains in 60 seconds               |
| Closures         | `PARTIAL_EVIDENCE` | `createApiClient`, handlers | Practise closure and stale closure     | Scope, retained variables        | Show `createApiClient`                     | None                | Owner gives Pravaah example and JS snippet |
| Hoisting         | `PARTIAL_EVIDENCE` | General TS modules          | Practise `var`/`let`/function examples | TDZ and declarations             | Whiteboard snippet                         | None                | Owner answers without guessing             |
| Git workflow     | `PARTIAL_EVIDENCE` | Templates/docs              | Record actual PR/check evidence        | Branch/PR/review story           | Show PR template and real PRs if available | None                | Owner has verifiable examples              |

## Priority 2 - Strong Optional Concepts

| Concept/workflow          | Current status                              | Current evidence                     | Required action                | Study work                            | Demonstration work    | Implementation work | Completion condition                   |
| ------------------------- | ------------------------------------------- | ------------------------------------ | ------------------------------ | ------------------------------------- | --------------------- | ------------------- | -------------------------------------- |
| Appointment transaction   | `STRONG_EVIDENCE`                           | service/repository/tests             | Practise full code trace       | Transaction, lock, conflict, rollback | Appointment runbook   | None                | Live trace completed once              |
| Queue reorder concurrency | `STRONG_EVIDENCE` with verification pending | queue service/repository/tests       | Practise exact scope           | Doctor/date scope, conflict recovery  | Queue runbook         | None                | Owner can explain limits               |
| Auth/authorization        | `STRONG_EVIDENCE`                           | auth middleware/access service/tests | Practise 401/403/404 cases     | Auth vs authz                         | Auth runbook          | None                | Owner can trace Clerk to internal User |
| No-show assistance        | `STRONG_EVIDENCE`                           | prediction service/tests/UI          | Practise responsible AI answer | Deterministic rules, human decision   | Show risk explanation | None                | Owner never calls it trained ML        |

## Priority 3 - Screen-Share Reliability

| Workflow            | Current status                    | Required action                                                            | Completion condition                                      |
| ------------------- | --------------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------- |
| Appointment booking | `REQUIRES_SETUP`                  | Seed/create active doctor and patient; sign in with linked Admin/Staff     | Appointment creates queue entry and risk response         |
| Queue operations    | `REQUIRES_SETUP`                  | Use same-day appointments with at least two active entries for one doctor  | Status update and reorder work or fallback evidence ready |
| Auth errors         | `PARTIAL`                         | Use API client/curl/Postman with missing token and valid signed-in browser | 401/403 distinctions shown honestly                       |
| Database ER         | `RELIABLE` for schema explanation | Open `schema.prisma` and draw model relationships                          | Owner explains cardinalities without line numbers         |

## Priority 4 - Nice-To-Have Evidence

| Item                   | Action                                                                                     |
| ---------------------- | ------------------------------------------------------------------------------------------ |
| Current test output    | Run `npm run test:web` and `npm run test:server`; record output in release notes or audit. |
| Build output           | Run frontend/backend builds and record commit/date.                                        |
| Responsive screenshots | Capture mobile/tablet/desktop views for public, appointment, queue.                        |
| Deployment proof       | Record frontend/backend URLs, deployed SHAs, health check, smoke steps.                    |

## Priority 5 - Post-Assessment Improvements

| Item                                          | Reason                                   |
| --------------------------------------------- | ---------------------------------------- |
| Strict appointment and queue transition graph | Strengthens lifecycle claims.            |
| Browser E2E suite                             | Improves workflow regression confidence. |
| Backend lint and CI                           | Improves delivery evidence.              |
| Observability                                 | Improves production maturity.            |
| User-clinic membership model                  | Enables true multi-clinic users.         |
