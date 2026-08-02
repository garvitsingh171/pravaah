# Pravaah Project Score Simulation Checklist

| Field         | Value                                                                                                              |
| ------------- | ------------------------------------------------------------------------------------------------------------------ |
| Issue         | #211                                                                                                               |
| Status        | Documentation foundation                                                                                           |
| Last reviewed | 2026-08-02                                                                                                         |
| Purpose       | Track practical demonstration readiness for supported Pravaah concepts and workflows.                              |
| Rule          | Do not assign personal readiness from repository inspection. Initial statuses are conservative preparation states. |

## Simulation Statuses

| Status                    | Meaning                                                |
| ------------------------- | ------------------------------------------------------ |
| Not attempted             | No simulation evidence recorded.                       |
| Needs preparation         | Evidence exists but the explanation/demo is not ready. |
| Can locate                | Student can find key files.                            |
| Can explain with notes    | Student can explain while using notes.                 |
| Can explain without notes | Student can explain concisely without notes.           |
| Can modify with guidance  | Student can make a small change with help.             |
| Can modify independently  | Student can make a small change alone.                 |
| Can debug with guidance   | Student can debug a small failure with help.           |
| Can debug independently   | Student can debug a small failure alone.               |
| Assessment ready          | Demonstration, explanation, and debugging are ready.   |

## Simulation Dimensions

For each supported concept or workflow, prepare to:

- locate the implementation
- explain the concept
- explain the product reason
- trace the request flow
- identify important files
- explain state changes
- explain database effects
- explain authentication
- explain authorization
- explain validation
- explain errors
- explain failure behavior
- explain transaction behavior
- explain concurrency risk
- explain security boundaries
- explain one trade-off
- explain one alternative
- explain one scaling limitation
- identify a relevant test
- manually test the workflow
- modify a small part
- debug a broken part
- write a simplified version
- answer without reading documentation

## JavaScript Versus TypeScript Rule

For language-independent engineering concepts, simplified JavaScript simulations are allowed:

- Promises
- async/await
- event loop
- closures
- callback conversion
- API request flow
- middleware concept
- simple transaction reasoning

Track TypeScript-specific readiness separately where relevant:

- typed props
- request types
- Zod-inferred types
- Prisma-generated types
- union types
- enums
- narrowing
- async function return types

Do not mark a concept failed merely because a simplified simulation uses JavaScript when the concept is not TypeScript-specific. Do not hide TypeScript gaps.

## Workflow Simulation Tracker

| ID      | Simulation target                    | Core files to locate                                                                 | Current status    | Must demonstrate                                                                              | Next action                                                     |
| ------- | ------------------------------------ | ------------------------------------------------------------------------------------ | ----------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| SIM-001 | Onboarding                           | `ClinicOnboardingPage.tsx`, `onboardingApi.ts`, auth backend module                  | Needs preparation | Clerk identity-only access, clinic/Admin transaction, replay behavior, validation and errors. | Trace happy path and duplicate request.                         |
| SIM-002 | Clinic provisioning                  | `auth.service.ts`, `auth.repository.ts`, `auth.validation.ts`                        | Needs preparation | Trusted identity, server-owned Admin role, transaction rollback, slug conflict.               | Explain why standalone clinic creation is disabled.             |
| SIM-003 | Doctor creation                      | `DoctorCreatePage.tsx`, `DoctorForm.tsx`, doctor routes/service/repository           | Needs preparation | Controlled form, validation, clinic access, `DoctorClinic` link.                              | Locate frontend submit and backend create flow.                 |
| SIM-004 | Patient creation                     | `PatientCreatePage.tsx`, `PatientForm.tsx`, patient routes/service/repository        | Needs preparation | Controlled form, validation, `PatientClinic` history fields.                                  | Explain why patient history is clinic-scoped.                   |
| SIM-005 | Appointment booking                  | `AppointmentsPage.tsx`, `AppointmentBookingForm.tsx`, appointment service/repository | Needs preparation | Relationship checks, conflict protection, transaction, queue and prediction creation.         | Trace request to response.                                      |
| SIM-006 | Appointment conflict                 | Appointment service/repository, active slot unique index migration                   | Needs preparation | Advisory lock, active-status conflict, 409-style error handling.                              | Explain why app-level conflict check is insufficient.           |
| SIM-007 | Appointment status update            | Appointment status UI/API/service/repository                                         | Needs preparation | Status sync and final-state protection, plus F-001 transition gap.                            | Explain current gap honestly.                                   |
| SIM-008 | Queue creation                       | Appointment service and queue repository                                             | Needs preparation | Booking-time queue entry, `appointmentId` uniqueness, doctor/day position scope.              | Explain why arrival does not create a second entry.             |
| SIM-009 | Queue status update                  | `QueuePage.tsx`, queue service/repository                                            | Needs preparation | Status sync, final-state protection, F-006 non-final reversal gap.                            | Explain current gap honestly.                                   |
| SIM-010 | Queue reorder                        | `QueuePage.tsx`, queue service/repository                                            | Needs preparation | Manual reorder, two-phase update, final-state exclusion, F-005 doctor-scope gap.              | Prepare multi-doctor example.                                   |
| SIM-011 | Authentication failure               | `auth.middleware.ts`, `errorHandler.ts`, frontend guards                             | Needs preparation | Missing Bearer header, invalid token, expired token.                                          | Map failure to 401 error envelope.                              |
| SIM-012 | Authorization failure                | `access.service.ts`, role middleware, clinic settings route                          | Needs preparation | Staff denied Admin settings, frontend hiding is not enough.                                   | Trace direct API denial.                                        |
| SIM-013 | Cross-clinic access attempt          | `requireClinicAccess`, `accessService.verifyClinicAccess`, route services            | Needs preparation | `User.clinicId` boundary and resource ownership checks.                                       | Explain current single-clinic limitation.                       |
| SIM-014 | Validation failure                   | `validateRequest.ts`, feature validation schemas, `FieldError.tsx`                   | Needs preparation | Zod parse, details array, frontend field mapping.                                             | Demonstrate one bad payload.                                    |
| SIM-015 | Transaction failure                  | Auth/appointment/queue repositories                                                  | Needs preparation | Rollback behavior and safe error mapping.                                                     | Explain clinic/Admin or appointment transaction.                |
| SIM-016 | No-show scoring                      | `prediction.service.ts`, appointment service, risk UI                                | Needs preparation | Rule-based deterministic score, reasons, suggested actions, no automatic decisions.           | Explain why it is not an LLM or trained ML.                     |
| SIM-017 | Dashboard aggregation                | Dashboard frontend/API/backend module                                                | Needs preparation | Summary, high-risk list, activity feed, missing-prediction backfill.                          | Trace one dashboard endpoint.                                   |
| SIM-018 | Frontend API failure                 | `apiClient.ts`, `ErrorMessage.tsx`, feature error states                             | Needs preparation | Network error, structured backend error, invalid base URL.                                    | Explain `ApiClientError`.                                       |
| SIM-019 | Deployment configuration explanation | `apps/web/vercel.json`, package scripts, `env.ts`, deployment docs                   | Needs preparation | Vercel SPA rewrite, Render/Node start, env separation, pending production evidence.           | Explain why deployment is not verified without URL/smoke proof. |
| SIM-020 | JavaScript event loop                | Any async UI/API flow plus simplified JS example                                     | Needs preparation | Call stack, microtasks, macrotasks, async state updates.                                      | Practise a short standalone example.                            |
| SIM-021 | JavaScript promises/callbacks        | `apiClient.ts`, tests                                                                | Needs preparation | Promise states, rejection handling, callback conversion.                                      | Build a simple promise example.                                 |
| SIM-022 | JavaScript async/await               | `apiClient.ts`, backend services                                                     | Needs preparation | Await flow, try/catch, returned promise.                                                      | Explain one request handler.                                    |
| SIM-023 | JavaScript closures                  | `createApiClient`, React handlers/effects                                            | Needs preparation | Closed-over token provider or component state.                                                | Explain `apiClientAuthTokenProvider`.                           |
| SIM-024 | JavaScript hoisting                  | Simplified JS example                                                                | Needs preparation | Function declaration vs const/let temporal dead zone.                                         | Practise standalone code.                                       |

## Maintenance

When a simulation is completed, update current status, record evidence, note what was demonstrated, and link any feedback. Do not delete failed or weak simulation history; use it to focus the next preparation action.
