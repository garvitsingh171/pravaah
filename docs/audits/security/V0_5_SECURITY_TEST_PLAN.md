# Pravaah v0.5 Security Verification and Regression Test Plan

**Purpose:** Safely validate identified behavior and protect authorization, privacy and workflow invariants. All proposed tests use fictional records in a local/isolated test environment. Never use real patient data or production credentials.

## Reusable fictional fixture

| Entity | Clinic A | Clinic B |
|---|---|---|
| Clinic | CLINIC-A (UUID fixture) | CLINIC-B (UUID fixture) |
| Admin | ADMIN-A, active, linked only to Clinic A | ADMIN-B, active, linked only to Clinic B |
| Staff | STAFF-A, active, linked only to Clinic A | STAFF-B, active, linked only to Clinic B |
| Patient | PATIENT-A, fictional name/phone/address, PatientClinic A link | PATIENT-B, different fictional values, PatientClinic B link |
| Doctor | DOCTOR-A, Clinic A DoctorClinic link | DOCTOR-B, Clinic B DoctorClinic link |
| Appointment | APPT-A links Patient A + Doctor A | APPT-B links Patient B + Doctor B |
| Queue | QUEUE-A for APPT-A and clinic/date A | QUEUE-B for APPT-B and clinic/date B |
| Prediction | PRED-A attached to APPT-A | PRED-B attached to APPT-B |
| Invitations | Active, expired, revoked and accepted A invitations | Equivalent B invitation fixtures |
| User status | Add suspended and removed A identities | Add inactive-clinic scenario as separate fixture |

IDs must be generated in test setup, not copied from deployed systems. Use obviously synthetic values (for example, Fictional Patient Alpha, 555-0101, reserved example email domains and non-routable addresses). Tests must assert denied requests do not mutate rows. For endpoints using Clerk, stub verified identities in unit tests or use dedicated non-production Clerk test identities only when available.

**Authorized environment:** Existing unit tests with mocks are safe. Integration cases requiring PostgreSQL must run against a disposable/local test database with an explicit test-only connection target. Do not run migrations, seeds, resets or destructive tests against a shared or production database. No such live DB or Clerk test identity was accessed for this audit.

## Test cases

| Test ID | Threat / finding | Setup and fictional data | Steps | Expected result | Existing coverage / executed? | Future automated location |
|---|---|---|---|---|---|---|
| AUTH-01 | Missing bearer identity | No Authorization header | Call protected /api/auth/me and one clinic API | 401 generic auth error; no DB mutation | auth.middleware tests; executed as part of 77 selected tests | modules/auth/__tests__/auth.middleware.test.ts |
| AUTH-02 | Malformed/invalid token | malformed header and Clerk unauthenticated mock | Call protected route | 401; no internal user data | auth middleware tests; executed | same |
| AUTH-03 | Expired/revoked token | Clerk reports unauthenticated/expired test identity | Call protected route | 401; no resource access | Middleware behavior covered by mocks; provider expiry not executed | auth provider integration tests |
| AUTH-04 | Valid Clerk identity without internal user | Valid identity; no internal User | Call /api/auth/me and clinic route | Controlled denial per service contract; no implicit provisioning | auth service/routes selected; executed | auth route integration tests |
| AUTH-05 | Suspended or removed user | Internal status non-active | Call protected read and write | Denied; no mutation | access/auth tests; executed | auth/access integration tests |
| AUTH-06 | Staff invokes Admin actions | STAFF-A active | Call staff management, clinic settings, patient/doctor lifecycle endpoints | 403; no mutation | staff/auth/clinic tests partially; selected modules executed | modules/staff/__tests__, clinic/doctor/patient route tests |
| AUTH-07 | Inactive clinic account | User linked to deactivated clinic | Call clinic-scoped API | Denied according to inactive clinic contract | Clinic service/access tests; selected clinic tests executed | access service integration |
| ROLE-01 | Admin/Staff boundary | ADMIN-A and STAFF-A | Exercise each Admin-only route with both; exercise Staff workflow route | Admin succeeds only in A; Staff gets 403 on Admin-only; both denied in B | Route/service coverage partial; selected staff tests executed | route authorization matrix tests |
| OPA-01 | Cross-clinic patient read | PATIENT-B and Clinic A identity | GET Clinic A path with B patient ID, then Clinic B path using A identity | Denied/404 with no patient fields | patient service tests; selected service tests executed, not full route pair | patient route integration |
| OPA-02 | Cross-clinic patient write | Same fixture | PATCH, geocode, route, archive/restore Clinic A endpoint with PATIENT-B | Denied; patient/link/provider calls unchanged | Patient service tests; executed selected | patient route integration |
| OPA-03 | Cross-clinic doctor read/write | DOCTOR-B | GET/PATCH/availability/archive/restore via Clinic A | Denied; availability/profile unchanged | doctor service tests not in selected executed list | doctor route integration |
| OPA-04 | Appointment ID ownership | APPT-B with STAFF-A | GET activities/reschedule slots; PATCH status/reschedule | Denied before details or mutation | Appointment service tests selected; not exhaustive route negatives | appointment route integration |
| OPA-05 | Nested appointment ownership | Body references PATIENT-B or DOCTOR-B under Clinic A | Create/reschedule with foreign relation ID | 4xx/denial; no appointment or queue rows | Appointment service tests selected | appointment route integration |
| OPA-06 | Queue ownership and membership | QUEUE-B; mixed A/B list | Reorder Clinic A queue with foreign/missing/duplicate IDs; update foreign status | Rejected; order/status unchanged | Queue service tests executed | queue integration tests |
| OPA-07 | Staff target ownership | STAFF-B and B invitation ID | ADMIN-A requests B user/invitation path | Denied; no B profile/invitation data | Staff route tests executed | staff route integration |
| OPA-08 | Prediction feedback ownership | PRED-B with STAFF-A | GET/PUT feedback for B prediction | Denied; feedback unchanged | Prediction feedback tests executed | prediction feedback route tests |
| PAG-01 | Current patient list behavior safely | Local fictional clinic with 3+ PatientClinic rows | GET list without filters as STAFF-A | Current code returns all matching A rows; no B rows. Record synthetic count only. | Source trace confirms; no live DB execution | patient repository integration test |
| PAG-02 | Current appointment list behavior | Fictional appointments across dates | GET list without filters as STAFF-A | Current code returns all matching A rows; no B rows | Source trace confirms; no live DB execution | appointment repository integration test |
| PAG-03 | Pagination after SEC-09 | Seed more rows than max page | Request default, max and over-max page size; follow cursor | Default/max bounded, over-max clamped or rejected, stable order and next cursor | Not executed; remediation not implemented | patient/appointment route tests |
| PAG-04 | Pagination tenant scope | Both clinics have ordered records | Page through A while B records interleave timestamps | Every page contains A only; no skipped/duplicated A IDs | Not executed | repository integration |
| PAG-05 | Minimal list projection | Synthetic unique markers in detail-only fields | Request list and detail endpoint | List omits fields not required by UI; detail shows permitted fields | Not executed; current source list projections broad | patient/appointment response tests |
| PAG-06 | Filter/cursor validation | Invalid UUID/date/status/cursor and unknown field | Send invalid query combinations | Controlled 400; no broad fallback query or data response | Zod schemas reviewed; not direct route-executed | validation and route tests |
| FLOW-01 | Invalid appointment transitions | APPT-A at known status | Attempt every forbidden transition | Controlled conflict/validation; appointment/queue consistent | appointment lifecycle tests executed | lifecycle tests |
| FLOW-02 | Concurrent bookings | Same doctor/slot, two simultaneous requests | Submit both with test DB transactions | At most one booking succeeds if availability invariant requires exclusivity; no duplicate queue/prediction | Existing lifecycle unit tests; concurrency not executed | appointment DB integration |
| FLOW-03 | Invalid queue transitions | QUEUE-A in each status | Attempt illegal status transition | Denied; queue and appointment remain consistent | queue service tests executed | queue integration tests |
| FLOW-04 | Invitation misuse | Expired/revoked/accepted/wrong-email token | Preview/accept using wrong or stale identity/token | No activation; generic safe response; token remains unusable | Staff route/validation tests executed; invitation service trace | staff invitation integration |
| FLOW-05 | Concurrent invite acceptance/revocation | Active fictional invitation | Race accept vs accept and accept vs revoke | At most one accept; revoked invite cannot provision; final state consistent | Transaction logic reviewed; concurrency not executed | staff invitation DB integration |
| SENS-01 | Sensitive response minimization | Synthetic unique DOB/address/emergency marker | Call list, detail, dashboard and appointment endpoints | Only role-authorized documented fields returned; no internal credential/token fields | Response projections reviewed; not full route execution | response contract tests |
| VAL-01 | Strict schema/mass assignment | Attempt role, clinicId, status, internal IDs in disallowed body fields | POST/PATCH relevant routes with unknown fields | 400; role/clinic ownership cannot be assigned by payload | Zod schemas reviewed; staff validation tests executed | route validation tests |
| INJ-01 | SQL injection defense | SQL-like strings in search/name fields | Use quoted/operator-like text as ordinary input in isolated test | Treated as data; query structure unchanged | Tagged SQL source reviewed; no dedicated exploit test run | repository tests with parameterized input |
| WEB-01 | XSS rendering | Synthetic script/event-attribute strings in names/notes | Render values in React screens | Escaped as text; no script execution or unsafe sink | Static search; no browser test run | frontend component tests |
| WEB-02 | CORS, CSRF assumptions, headers | Staging origin allowlist; bearer-only API | Send preflight from allowed/denied origins; inspect headers; cross-origin mutation without Authorization | Approved origin gets expected CORS; denied origin cannot read response; mutation returns 401; expected headers present | Source config reviewed; deployment unavailable | API/hosting smoke test |
| RATE-01 | Anonymous request rate behavior | Isolated server and client | Repeat auth/onboarding requests under configured test limit | After SEC-09, 429 with retry guidance; no data leakage | No general limiter found; not executed | limiter middleware tests |
| RATE-02 | Authenticated read abuse | STAFF-A; fixture list | Repeat list/dashboard calls over limit | Rate policy limits excess traffic; clinic remains usable after window | Not executed; no general limiter | API integration/limiter tests |
| RATE-03 | Provider-triggering abuse | STAFF-A, mocked Geoapify/Resend | Repeat geocode/routing/invitation operations | Bounded requests, controlled 429; no excessive provider calls | Provider client tests executed; rate behavior not tested | route + provider mock tests |
| EXT-01 | SSRF boundary | Mock HTTP transport | Supply URL-looking strings in patient/address fields | Client still requests only fixed Geoapify host/path | Geoapify tests executed; hostile URL case not run | integration client tests |
| EXT-02 | Provider timeout/error leakage | Mock timeout and malformed response | Invoke geocoding/routing/email failures | Request terminates; controlled error; no key/stack/PHI leakage | Email/Geoapify client tests executed | integration service tests |
| DATA-01 | Error/log redaction | Synthetic token and PHI markers; mock unknown error | Trigger validation/provider/internal errors; capture logs | Responses/logs omit bearer/invite tokens and unnecessary PHI | Error flow source reviewed; no log-capture test | errorHandler tests |
| DATA-02 | Staff/security auditability | ADMIN-A changes STAFF-A status/invitation | Inspect audit event/log record | Actor, clinic, object reference and action recorded without patient content/token | Full audit-log policy not verified | audit event tests |
| WORK-01 | Refresh worker tenant scope | Fictional pending work in A and B | Run worker on A work; inspect both predictions/jobs | Only matching scoped rows updated; lease/retry consistent | prediction refresh worker tests executed | worker integration test |
| EXPORT-01 | Export clinic guard | Fictional A/B data; authorized clinic config set to A | Request CLI export for B and mismatched clinic | Refused; no output file with B data | Dataset export tests executed | dataset-export suite |
| EXPORT-02 | Export privacy/cohort | Fictional cohort sizes below/at minimum; synthetic IDs | Export eligible/ineligible cohort | Below threshold suppressed; output de-identified; no direct identifiers | Dataset export tests executed | dataset-export tests |
| EXPORT-03 | Export file safety | Existing output path and interrupted write | Attempt export to existing path; simulate failure | No overwrite; partial output cleaned up; restrictive permissions | Dataset export tests executed | dataset-export tests |
| EXPORT-04 | Export recipient/destination governance | Approved isolated destination | Review permissions/retention and manifest | Authorized recipients only; retention/deletion documented | Operational review unavailable; not executed | ops checklist and synthetic export |
| OPS-01 | Secrets and artifact scan | Tracked files/build artifacts only | Run non-mutating scanner; inspect names/artifact list without reading env values | No secret values in tracked files/public artifacts; findings triaged | Tracked-file check and offline npm audit done; no dedicated scanner used | CI secret scan and release artifact check |
| OPS-02 | DB least privilege and backup | Disposable DB role and synthetic records | Verify runtime grants and restore synthetic backup | Runtime grants minimal; restore process works without production records | Not executed; DB config inaccessible | deployment integration/runbook |

## Execution summary for this audit

**Executed and passed (mocked/local server tests):**

- Authentication middleware, access service and auth routes.
- Staff routes and validation; prediction feedback service.
- Dataset export tests.
- Appointment service and lifecycle; queue service; patient and clinic services.
- Prediction refresh worker; email service; Geoapify geocoding and routing clients.

Commands and totals are recorded in V0_5_SECURITY_AUDIT.md: 7 files/77 tests and 9 files/81 tests, 158 total passed. They use unit mocks and are not the same as the integration cases above.

**Not executed:** Live two-clinic route tests; production API checks; Clerk provider expiry/MFA verification; database integration/concurrency tests; rate-limit tests; browser XSS/CORS/header checks; log-redaction capture; real export generation; hosted source-map inspection; deployment DB privilege/backup review. No production data, credentials or patient records were used.

## Release regression gate

Before security sign-off for a release candidate:

1. Run automated tests in an isolated environment and attach results.
2. Complete OPA-01 through OPA-08 with the two-clinic fixture for every object route.
3. Implement SEC-09 and pass PAG-03 through PAG-06 plus RATE cases.
4. Verify invitation/workflow race tests (FLOW-02 and FLOW-05) against a dedicated test DB.
5. Verify deployment configuration for Clerk MFA/session, CORS/headers, secrets, DB least privilege, backups, logs, provider restrictions and source maps.
6. Confirm every denied request left records unchanged and no response/log contains another clinic's synthetic marker.

Do not interpret passing unit mocks or repository inspection as production security sign-off.
