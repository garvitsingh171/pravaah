# Issue #300: Object Authorization and Tenant Isolation Audit

**Assessment date:** 2026-10-31  
**Scope:** Current Express API routes, Clerk-to-user resolution, Prisma tenant relationships, and object-level mutations.  
**Result:** One confirmed cross-clinic integrity defect was fixed and covered by PostgreSQL-backed regressions. This is a repository and isolated-test assessment, not a production security certification.

## Summary

The current route inventory contains 59 endpoints, including public health/root endpoints, Clerk-identity onboarding/invitation routes, and protected clinic APIs. The full method/path/role/enforcement matrix is in [V0_5_API_SECURITY_MATRIX.md](../audits/security/V0_5_API_SECURITY_MATRIX.md). Authentication maps Clerk's verified user ID to an active internal `User`; role and clinic authorization come from that database record. Clinic routes check exact `User.clinicId` equality. Object-only appointment and prediction endpoints resolve the object's clinic in services.

The audit confirmed that Doctor and Patient rows are global profile records with clinic-scoped `DoctorClinic` and `PatientClinic` associations. Before this change, a caller with a valid clinic association could update the global profile, affecting another clinic linked to the same row. Patient geocoding also wrote global location fields. These were confirmed cross-clinic integrity defects, fixed in the clinic-scoped update paths, and covered in the isolated integration suite.

## Authentication and tenant boundary

- `app.ts` installs Clerk middleware; protected route handlers use `authenticateRequest`.
- `auth.middleware.ts` requires a bearer token, a Clerk identity, and an active internal user resolved by Clerk ID.
- `access.service.ts` enforces active status, ADMIN versus STAFF permissions, exact clinic ID equality, clinic existence/active state, and appointment-to-clinic ownership.
- Client-supplied `clinicId`, role, and resource IDs do not establish authority. Route schemas reject unsupported fields, and services/repositories validate object relationships.
- User membership is a nullable single `User.clinicId`; the current application has no multi-clinic membership or clinic-switching endpoint.

## Ownership invariants

| Record | Current ownership semantics | Enforcement / boundary |
|---|---|---|
| Clinic | Tenant root | Internal User has one `clinicId`; clinic middleware checks exact equality. Lifecycle service checks same-clinic ADMIN access. |
| User | One clinic membership | Staff-management services scope the target user by the authorized clinic; role mutation is Admin-only. |
| Doctor | Shared global profile; many-to-many clinic link | Reads and clinic lifecycle operations require a `DoctorClinic` link. Global profile updates are rejected if another clinic link exists. |
| DoctorClinic / availability | Clinic-owned association and availability periods | Keyed through the clinic's DoctorClinic row; archive/restore affects only that link. |
| Patient | Shared global profile; many-to-many clinic link | Patient reads require `PatientClinic`. Global profile writes and geocoding are rejected if another clinic link exists. |
| PatientClinic | Clinic-owned notes, visit counters, routing metrics, and active state | Queries and mutations include both `patientId` and authorized `clinicId`; notes remain editable for shared profiles. |
| Appointment | Explicit `clinicId`, with doctor and patient foreign keys | Lists filter by clinic; object-ID operations resolve appointment clinic; creation validates both linked doctor and patient. |
| QueueEntry | Explicit clinic and denormalized appointment/doctor/patient IDs | Status/reorder operations validate clinic, date, doctor, appointment, and submitted membership before writes. |
| NoShowPrediction / feedback | Prediction has clinic, appointment and patient IDs; feedback references prediction and staff user | Prediction operations resolve clinic through the prediction; dashboard and prediction reads filter by clinic. |
| Activity / outcome / refresh work | Explicit clinic plus related appointment or patient | Writes are performed by clinic-scoped workflows; queries and aggregate paths use clinic filters. |

Doctor and Patient identity fields remain shared and readable to any clinic with an association, consistent with the existing shared-profile model. The new rule prevents a clinic-scoped editor from changing those global fields when another clinic also has an association. There is no global profile administrator workflow today; shared profiles are read-only for global fields through these APIs.

## Confirmed finding and fix

**Finding SEC-300-01 — Shared-profile cross-clinic writes (Medium).** `PATCH /api/clinics/:clinicId/doctors/:doctorId` and `PATCH /api/clinics/:clinicId/patients/:patientId` checked the caller's clinic association but then wrote the shared global row. `POST /api/clinics/:clinicId/patients/:patientId/geocode` likewise wrote global Patient geocoding fields. Clinic B could therefore observe profile fields changed by an authorized Clinic A user when both clinics linked the same profile.

The Doctor repository now locks the profile row and rejects updates if another clinic association exists. The Patient repository uses a transaction and the same profile-row guard for global profile writes while allowing PatientClinic-only note edits. Geocoding checks for another clinic link before any provider call and repeats the guard in the write transaction. Denials return 403 and do not mutate captured business state.

No direct foreign-ID bypass was found in the audited paths. Existing regressions exercise both directions for foreign clinic/object IDs, nested appointment associations, queue reorder/status, prediction feedback, dashboard aggregates, staff and invitation operations, and same-clinic positive workflows.

## Verification evidence

- Endpoint inventory: 59 routes; details and enforcement locations are in the linked authorization matrix.
- Fictional fixture set: Sunrise and Riverside clinics, separate Admin/Staff users, clinic-local and shared doctor/patient records, appointments, queue entries, predictions, and invitations.
- Database: disposable PostgreSQL 16 container on localhost, database `pravaah_security_test`; 26 committed migrations applied. The guard in `tests/security/testDatabaseGuard.ts` validated this database before migration, fixture writes, and cleanup.
- Backend security suite: `npm run test:security -w apps/server` — **PASS, 2 test files, 61 tests**. The suite runs HTTP requests through Express, authorization, services, repositories, and Prisma. Clerk verification alone is replaced with synthetic test identities.
- Failing-before check: temporarily removed the shared-profile guards and ran the new PostgreSQL regression. **Expected FAIL reproduced:** the foreign-clinic Doctor PATCH returned 200 where the test required 403, and the business-state assertion was not reached because the update succeeded. The guards were restored and the complete security suite then passed.
- Targeted unit suite: patient service/repository and appointment service — **PASS, 3 files, 21 tests**.
- Full backend suite: `npm test -w apps/server` — **PASS, 59 files; 513 passed, 2 skipped**.
- Frontend security-related tests: `npm test -w apps/web -- src/features/patients/PatientsPage.test.tsx src/features/doctors/DoctorsPage.test.tsx src/features/appointments/AppointmentsPage.test.tsx src/components/ui/RiskExplanation.test.tsx` — **PASS, 4 files; 43 tests**.
- TypeScript: `npm run check -w apps/server` — **PASS**.
- Builds: `npm run build -w apps/server` and `npm run build -w apps/web` — **PASS**.
- Lint: `npm run lint -w apps/server` exits successfully but only prints `server lint not configured yet`; this is **not a lint analysis**.
- CI already provisions isolated PostgreSQL and runs this security suite; no workflow change was needed.

No production database, production credentials, or live clinic/patient data were used. Migrations affected only the disposable test database. Fixture cleanup ran in the security suite teardown; the disposable container was stopped and removed after verification.

## Limitations and remaining risks

- No public API currently links an existing Doctor or Patient profile to another clinic. The regression fixtures create those many-to-many links directly to exercise the supported schema. If a link-management or import path is added, it must preserve the profile-row locking rule and define who may link shared identities.
- No clinic-scoped endpoint can edit global fields for an already-shared profile. A future global profile administration flow needs an explicit authorization and audit design.
- The tests mock Clerk's external signature/session verification boundary. They do verify application mapping, status, role, and clinic authorization using synthetic identities.
- Deployment settings such as Clerk MFA, production database privileges, provider key controls, logging retention, and hosting headers were not available for review.
- Server lint remains a placeholder script. This audit did not treat it as a lint pass.

## Issue #300 acceptance status

| Acceptance criterion | Status | Evidence / limitation |
|---|---|---|
| Inventory and review all implemented clinic-scoped backend endpoints | Completed | 59-route matrix based on mounted routers and route definitions. |
| Verify authentication, roles, and clinic ownership | Completed | Middleware/service source trace plus HTTP identity/role/tenant regressions. |
| Use two fictional clinics | Completed | PostgreSQL fixtures create Sunrise and Riverside tenants and separate identities. |
| Reject foreign IDs on relevant reads and writes | Completed for audited routes | Security suite covers foreign routes, objects, nested IDs, queue and prediction operations. |
| Validate nested relationships | Completed for exercised workflows | Appointment creation, queue membership/reorder, and clinic-linked doctor/patient relationships tested. |
| Ensure denied requests do not mutate data | Completed for exercised mutations | Business-state snapshots compare before and after denials. |
| Isolate lists, search, predictions, dashboard aggregates | Completed for exercised endpoints | Two-clinic list/filter, prediction feedback, risk/dashboard/aggregate regressions. |
| Review shared Doctor/Patient semantics | Completed | Global profiles and association-owned data documented; shared profile writes denied. |
| Keep clinic-specific association data isolated | Completed | Separate PatientClinic notes tested on a shared patient. |
| Add failing-before/passing-after test for every confirmed defect | Completed | New shared-profile update/geocode regression fails against the former behavior and passes after the guards. |
| Preserve same-clinic Admin/Staff workflows | Completed for exercised workflows | Existing positive same-clinic integration tests and targeted unit suite pass. |
| Run security tests on isolated PostgreSQL | Completed | PostgreSQL 16 container, 26 committed migrations, 61 passing security tests. |
| TypeScript, lint, build, and relevant tests pass | Partially completed | Server typecheck and relevant tests pass. Full build/frontend workflow are recorded separately in the task report; server lint is not configured. |
| Document findings and residual risks | Completed | This audit and updated endpoint matrix. |
| No production data modified | Completed | Only disposable localhost database used; no production access. |

