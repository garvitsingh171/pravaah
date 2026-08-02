# Pravaah Project Score Question Architecture

| Field         | Value                                                                                                                  |
| ------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Issue         | #211                                                                                                                   |
| Status        | Documentation foundation                                                                                               |
| Last reviewed | 2026-08-02                                                                                                             |
| Purpose       | Provide a structured foundation for viva preparation without inventing perfect answers or overclaiming implementation. |

## Question Types

Use these patterns across categories:

- Explain
- Why
- Where in code
- Trace the workflow
- What happens if it fails
- What happens under concurrency
- What happens with more users
- Compare alternatives
- Debug the issue
- Change the requirement
- Design an extension
- Live-code a small change
- Identify a security issue
- Identify a missing test

## Product

Evidence links:

- [MVP](../product/MVP.md)
- [Workflows](../product/WORKFLOWS.md)
- [Content Guidelines](../design/CONTENT_GUIDELINES.md)

Representative questions:

- What problem does Pravaah solve for a clinic?
- Why are Admin and Staff the only authenticated roles?
- Why are doctors and patients records instead of logged-in users?
- What is outside Pravaah's current scope?
- How should you describe the no-show feature without overstating it?

## Frontend

Evidence links:

- [Frontend Structure](../architecture/FRONTEND_STRUCTURE.md)
- `apps/web/src/App.tsx`
- `apps/web/src/features`

Representative questions:

- How do React components compose the public, onboarding, and protected application routes?
- Where is client-side routing defined?
- How does the app decide whether to show public, onboarding, or protected content?
- How are loading, empty, error, and success states shown?
- How would you refactor repeated button or form styles without adding a component library?

## JavaScript

Evidence links:

- `apps/web/src/lib/apiClient.ts`
- frontend event handlers and tests
- [Simulation Checklist](SIMULATION_CHECKLIST.md)

Representative questions:

- What is the JavaScript event loop and how does it relate to async API calls?
- What is the difference between promises and callbacks?
- How does `async/await` behave when a request fails?
- What is a closure? Where can you show one in Pravaah?
- What is hoisting? Can you write a small standalone example?

## Backend

Evidence links:

- [Backend Structure](../architecture/BACKEND_STRUCTURE.md)
- `apps/server/src/app.ts`
- `apps/server/src/modules`

Representative questions:

- Why does the backend use route/controller/service/repository layers?
- What should a controller do and not do?
- Where are business rules enforced?
- Where are database operations isolated?
- How would you debug a failing backend route?

## System Design

Evidence links:

- [Architecture](../architecture/ARCHITECTURE.md)
- [Workflow Evidence](WORKFLOW_EVIDENCE.md)

Representative questions:

- How do the frontend and backend communicate?
- Why is PostgreSQL suitable for Pravaah?
- What systems are involved in a protected API request?
- How would the architecture change for multi-clinic user membership?
- What could break if traffic increased significantly?

## REST APIs

Evidence links:

- [API Structure](../architecture/API_STRUCTURE.md)
- [API Reference](../architecture/API_REFERENCE.md)
- `apps/server/src/modules/**/*.routes.ts`

Representative questions:

- Where are API routes registered?
- Why are clinic-scoped APIs under `/api/clinics/:clinicId`?
- Why does appointment status use `/api/appointments/:appointmentId/status`?
- What makes an endpoint REST-like in this codebase?
- Which endpoints are public, onboarding-aware, and protected?

## Validation

Evidence links:

- `apps/server/src/utils/validateRequest.ts`
- `apps/server/src/modules/**/*.validation.ts`
- frontend form validation code

Representative questions:

- How does request validation work?
- What is the difference between client-side and server-side validation?
- What happens when Zod rejects a request body?
- Why must the backend reject role or clinic ownership fields from the frontend?
- Which validation rule would you add for a new field?

## Error Handling

Evidence links:

- `apps/server/src/middleware/errorHandler.ts`
- `apps/server/src/utils/AppError.ts`
- `apps/web/src/lib/apiClient.ts`
- `apps/web/src/components/feedback/ErrorMessage.tsx`

Representative questions:

- How are expected backend errors represented?
- What is the error response shape?
- How does the frontend convert failed responses into user-facing errors?
- What should not be exposed in an error message?
- How would malformed JSON be handled?

## Authentication

Evidence links:

- [Auth And Security](../architecture/AUTH_AND_SECURITY.md)
- `apps/server/src/modules/auth/auth.middleware.ts`
- Clerk frontend components

Representative questions:

- What does Clerk own and what does Pravaah own?
- What happens when Clerk authenticates a user who has no internal Pravaah user?
- Why does onboarding use identity-only authentication?
- How are environment variables separated between frontend and backend?
- Why should you not claim Pravaah implements password hashing?

## Authorization

Evidence links:

- [User Roles](../product/USER_ROLES.md)
- `apps/server/src/modules/auth/access.service.ts`
- `auth.middleware.ts`

Representative questions:

- Where is role-based authorization enforced?
- What prevents Clinic A from accessing Clinic B?
- Why is frontend navigation hiding insufficient authorization?
- How is Staff denied from Admin-only clinic settings?
- What limitation exists in the current single-clinic `User.clinicId` model?

## PostgreSQL

Evidence links:

- [Database Design](../architecture/DATABASE_DESIGN.md)
- `apps/server/prisma/schema.prisma`
- migrations

Representative questions:

- Why do `DoctorClinic` and `PatientClinic` exist?
- Which tables have primary keys and foreign keys?
- Which indexes support appointment and queue queries?
- How does normalization help Pravaah?
- What deletion behavior exists for appointments and queue entries?

## Prisma

Evidence links:

- `apps/server/prisma/schema.prisma`
- `apps/server/src/config/prisma.ts`
- repositories

Representative questions:

- How does Prisma connect the TypeScript code to PostgreSQL?
- What is the difference between a Prisma model and a database table?
- Where are Prisma transactions used?
- How are includes/selects used to shape responses?
- How would you add a new optional field safely?

## Transactions

Evidence links:

- Appointment repository/service
- Auth repository/service
- Queue repository/service
- [Database And Transactions](../interview/DATABASE_AND_TRANSACTIONS.md)

Representative questions:

- What happens when appointment creation partially fails?
- Why must clinic and first Admin provisioning be transactional?
- Why is an application-level conflict check insufficient?
- What is an advisory lock and where is it used?
- How does queue reordering attempt to avoid position conflicts?

## Concurrency

Evidence links:

- Appointment creation conflict code
- Queue reorder code
- [v0.3 Route Audit](../audits/V0.3_ROUTE_RELEASE_AUDIT.md)

Representative questions:

- What happens if two staff users book the same doctor/time slot?
- What happens if the queue changes while a reorder request is in flight?
- Why is queue reorder currently a multi-doctor scope concern?
- What would you test for concurrent queue updates?
- How would you design stronger lifecycle transition enforcement?

## Queue

Evidence links:

- `QueuePage.tsx`
- queue backend module
- [Queue Workflow](../interview/workflows/QUEUE_WORKFLOW.md)
- [Workflow Evidence](WORKFLOW_EVIDENCE.md)

Representative questions:

- When is a queue entry created?
- Why should arrival not create a duplicate queue entry?
- How does queue status synchronize with appointment status?
- How does queue reordering remain consistent?
- What are the current queue gaps recorded in F-005 and F-006?

## No-Show Assistance

Evidence links:

- `apps/server/src/modules/predictions/prediction.service.ts`
- `NoShowPrediction` model
- appointment, queue, and dashboard UI
- [Content Guidelines](../design/CONTENT_GUIDELINES.md)

Representative questions:

- Why is the no-show feature rule-based instead of an LLM?
- What inputs influence the risk score?
- Why must risk reasons be visible?
- What must Pravaah never do automatically based on risk?
- How would trained ML change the data and explanation requirements?

## Testing

Evidence links:

- [Testing](../guides/TESTING.md)
- backend and frontend test files
- manual release verification checklists

Representative questions:

- What test frameworks does Pravaah use?
- Which flows have tests?
- Which tests were not run for the latest docs-only audit?
- What missing test would you add for queue status transitions?
- Why is browser-based E2E testing deferred in the current repository?
- What manual workflow checks carry more importance while browser E2E is deferred?

## Deployment

Evidence links:

- [Deployment](../guides/DEPLOYMENT.md)
- `apps/web/vercel.json`
- package scripts
- `apps/server/src/config/env.ts`

Representative questions:

- How is the frontend deployed?
- How is the backend deployed?
- What environment variables are required?
- What evidence is needed before saying production is verified?
- Why is Vite SPA routing not server-side rendering?

## Git

Evidence links:

- [Contributing](../guides/CONTRIBUTING.md)
- `.github/ISSUE_TEMPLATE`
- `.github/pull_request_template.md`

Representative questions:

- What is the expected issue-to-PR workflow?
- What should a PR include?
- Why should docs change with behavior changes?
- What checks should be run before review?
- How should AI-assisted changes be reviewed?

## Security

Evidence links:

- [Auth And Security](../architecture/AUTH_AND_SECURITY.md)
- auth middleware, access service, validation, error handling

Representative questions:

- Identify a security boundary in Pravaah.
- What prevents client-controlled role injection?
- What secrets must never appear in frontend code?
- Where is rate limiting missing?
- How does Prisma reduce SQL injection risk, and what still needs care?

## Performance

Evidence links:

- Prisma indexes
- dashboard/appointment/queue repositories
- [Database Design](../architecture/DATABASE_DESIGN.md)

Representative questions:

- Which queries could become slow as data grows?
- Why are appointment and queue indexes useful?
- What list endpoints may need pagination?
- How could dashboard summary performance be improved?
- When would caching be useful, and why is Redis not currently implemented?

## Accessibility

Evidence links:

- [Visual System](../design/VISUAL_SYSTEM.md)
- UI components and route audit

Representative questions:

- How are form errors communicated?
- Why must status and risk not rely on colour alone?
- What keyboard checks should be run?
- What accessibility work remains unverified?
- How should an icon-only action be labelled?

## Scalability

Evidence links:

- [Roadmap](../scope/ROADMAP.md)
- architecture docs
- route audit

Representative questions:

- What is the biggest limitation of `User.clinicId`?
- How would multi-clinic membership change the database?
- What would need to change for patient login?
- What would need to change for real-time queue updates?
- What operational monitoring is missing?

## Trade-Offs

Evidence links:

- [Tradeoffs And Improvements](../interview/TRADEOFFS_AND_IMPROVEMENTS.md)
- product decisions and roadmap docs

Representative questions:

- Why use Clerk instead of building auth from scratch?
- Why use PostgreSQL instead of MongoDB for Pravaah?
- Why use deterministic rules instead of trained ML?
- Why keep doctors and patients as records?
- Why avoid adding Redis/WebSockets/payments in v0.3?

## Debugging

Evidence links:

- tests
- workflow evidence
- API client and error handler

Representative questions:

- A protected route loops back to login. Where do you look first?
- Appointment booking returns conflict unexpectedly. What files do you inspect?
- Queue reorder corrupts multi-doctor positions. What code explains it?
- The frontend says API base URL is invalid. Where is that checked?
- A validation error is not shown under a field. What do you inspect?

## AI-Assisted Development

Evidence links:

- [AI Context](../ai/AI_CONTEXT.md)
- project docs and PR templates

Representative questions:

- Which parts were created with AI assistance, and how were they verified?
- How do you prevent AI from overstating no-show risk?
- What rules should an AI assistant follow before editing this repo?
- How do you verify generated docs against code?
- Why should missing concepts not be faked?

## Maintenance

Add more questions only when they link to real evidence or known gaps. Do not add fake answers that imply production verification, patient login, trained ML, MongoDB, LLM, Redis, WebSockets, payments, or Docker evidence that does not exist.
