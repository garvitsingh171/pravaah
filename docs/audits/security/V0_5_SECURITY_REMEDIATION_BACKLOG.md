# Pravaah v0.5 Security Remediation Backlog

This maps repository evidence to requested SEC-02 through SEC-19 workstreams. “No finding” means prevention or verification work only. Estimated effort is relative engineer-days: S ≤1, M 2–4, L 5+. Confirm priorities with product/operations before scheduling.

| Order | Issue | Finding / status | Severity / effort | Dependencies |
|---:|---|---|---|---|
| 1 | SEC-09 — Rate limiting | SEC-F-01; SEC-H-01: list response bounds and no general HTTP limiter | Medium/P2 + Low; M | Coordinate limits with routes/client behavior; shared store if multi-instance |
| 2 | SEC-19 — Regression tests | Tenant/object/lifecycle coverage gaps; no confirmed bypass | Medium preventative; M | Build fictional two-clinic fixture; tests accompany each code issue |
| 3 | SEC-07 — CSRF/CORS/security headers | SEC-H-02: production config verification; no confirmed CSRF vulnerability | Low; S/M | Verify deployment first; headers at correct hosting layer |
| 4 | SEC-04 — Clerk auth/MFA | SEC-H-04: Clerk production MFA/session policy unverified | Informational; S | Authorized Clerk dashboard evidence |
| 5 | SEC-16 — RLS/least privilege | DB permissions/RLS unverified; no tenant breach inferred | Informational; M/L | DBA review; verify app DB roles and migration requirements |
| 6 | SEC-13 — Data leakage/audit logging | SEC-F-01 and SEC-H-04; logging controls unverified | Medium/Informational; M | Define access/audit events and retention owner |
| 7 | SEC-10 — Secrets/credentials | SEC-H-04: actual runtime secret storage/rotation unknown; no secret exposed | Informational; S/M | Hosting/provider admin access; never paste secret values into issues |
| 8 | SEC-17 — Privacy/backups | Backup, retention, restore and export-recipient governance unverified | Informational; M | Operations/privacy owner |
| 9 | SEC-15 — Source maps/builds | Production source-map/artifact exposure unverified | Informational; S | Inspect built/released artifact and hosting configuration |
| 10 | SEC-18 — Workflow/concurrency | Invitation/appointment/queue code has controls; integration concurrency coverage should be extended | Preventative; M | Dedicated isolated test database |
| 11 | SEC-02 — Object-level authorization | No bypass found; full two-clinic regression needed | Preventative; M | SEC-19 fixture |
| 12 | SEC-03 — Role-based access | No bypass found; route/middleware checks observed | Preventative; S/M | SEC-19 fixture |
| 13 | SEC-08 — Input validation | Zod is broadly present; list query bounds should accompany SEC-09 | Low preventative; S/M | Pagination contract |
| 14 | SEC-14 — Dependencies/automation | Offline audit reports 0 advisories; freshness/CI automation unverified | Informational; S/M | Online authorized dependency audit and CI owner |
| 15 | SEC-05 — SQL injection | No vulnerable flow found; tagged SQL observed | No finding; S | Revisit on new raw SQL |
| 16 | SEC-06 — XSS | No unsafe rendering sink found | No finding; S | Revisit on rich HTML/markdown features |
| 17 | SEC-11 — SSRF | Fixed destinations observed; no arbitrary URL flow found | No finding; S | Revisit if user-controlled URL fetches are added |
| 18 | SEC-12 — Upload security | No upload route was found in mounted route inventory | Not applicable currently | Reassess before adding upload endpoints |

## Issue detail and implementation criteria

### SEC-02 — Object-level authorization

1. **Description:** Preserve and demonstrate object-to-clinic checks for all ID-based routes. No confirmed BOLA finding.
2. **Related findings:** None; SEC-H-03 is a conditional shared-profile model concern.
3. **Files:** auth/access service; appointment, patient, doctor, queue, staff, prediction-feedback services and repositories; their routes/tests.
4. **Approach:** Maintain clinic resolution from target object and relation validation before reads/writes. Avoid trusting URL clinic ID alone when route is object-ID based.
5. **Dependencies:** SEC-19 fixture.
6. **Risk/severity:** High consequence if regressed; current source trace has no confirmed defect.
7. **Estimate:** M.
8. **Acceptance:** Every object route rejects foreign-clinic object IDs without data or side effects; errors do not confirm sensitive data unnecessarily.
9. **Tests:** OPA-01 through OPA-08; pairwise Clinic A Staff/Admin against Clinic B objects.
10. **Verification:** Integration suite with isolated PostgreSQL and fictional records; inspect no mutation after denied calls.
11. **Order:** Include in first tenant-isolation regression increment; do not rewrite working checks absent evidence.

### SEC-03 — Role-based access

1. **Description:** Keep Admin-only backend enforcement distinct from Staff workflow permissions.
2. **Related findings:** None confirmed.
3. **Files:** auth middleware/access service; clinic, doctor, patient, staff routes and services.
4. **Approach:** Maintain centralized role middleware and service-side invariants for privileged lifecycle/invitation operations; prevent profile payloads from assigning role.
5. **Dependencies:** SEC-19.
6. **Risk/severity:** High consequence if bypassed; current implementation reviewed positively.
7. **Estimate:** S/M.
8. **Acceptance:** Staff cannot list/manage staff, invitations, clinic settings or Admin lifecycle operations; Admin can perform permitted same-clinic actions only.
9. **Tests:** ROLE-01 through ROLE-04.
10. **Verification:** Route integration tests using Staff/Admin identities and no UI-only assumptions.
11. **Order:** Pair with SEC-02 test fixture.

### SEC-04 — Clerk authentication/MFA

1. **Description:** Verify provider-owned production settings; no Clerk replacement or custom password/JWT system is indicated.
2. **Related findings:** SEC-H-04, informational.
3. **Files:** apps/server/src/app.ts; auth middleware/service; deployment configuration maintained outside repository.
4. **Approach:** Authorized operator records MFA requirements for Admins, session/token expiry and revocation behavior, production/development key separation and sign-in restrictions.
5. **Dependencies:** Access to Clerk configuration by authorized operator.
6. **Risk/severity:** Account compromise could expose a clinic's records; current provider settings unverified.
7. **Estimate:** S.
8. **Acceptance:** Approved auth policy is documented and deployed; production keys/config are separate; suspended/removed internal users are denied on next request.
9. **Tests:** AUTH-01 through AUTH-07 plus provider-console review.
10. **Verification:** Non-production Clerk test identities; do not share tokens or production credentials.
11. **Order:** Before production sign-off; parallel with SEC-07 deployment review.

### SEC-05 — SQL injection

1. **Description:** Prevent unsafe SQL construction; no exploitable query identified.
2. **Related findings:** None.
3. **Files:** Reviewed Prisma repositories and raw query sites if modified.
4. **Approach:** Continue Prisma query API or tagged parameterized raw SQL; prohibit string concatenation of user-controlled SQL.
5. **Dependencies:** None.
6. **Risk/severity:** High potential impact, no current confirmed vulnerability.
7. **Estimate:** S preventative.
8. **Acceptance:** New raw SQL calls have safe parameter binding and tests.
9. **Tests:** INJ-01 and static review for any new raw query.
10. **Verification:** Code review/static search; do not run destructive injection against production.
11. **Order:** No standalone remediation unless new evidence appears.

### SEC-06 — XSS

1. **Description:** Preserve safe React text rendering and same-origin redirects; no unsafe sink found.
2. **Related findings:** None.
3. **Files:** Frontend components handling patient/staff/provider text; safeRedirect helper.
4. **Approach:** Avoid unsafe HTML injection; sanitize only if a justified rich-text feature is introduced.
5. **Dependencies:** None.
6. **Risk/severity:** High potential impact in authenticated app, no current evidence.
7. **Estimate:** S preventative.
8. **Acceptance:** User-controlled values remain text; redirect targets remain same-origin relative paths.
9. **Tests:** WEB-01 and redirect unit test.
10. **Verification:** Component tests and source sink review.
11. **Order:** No standalone fix indicated.

### SEC-07 — CSRF/CORS/security headers

1. **Description:** Verify deployed CORS origins and browser headers; current explicit bearer API flow is not shown CSRF-vulnerable.
2. **Related findings:** SEC-H-02.
3. **Files:** apps/server/src/app.ts, apps/server/src/config/env.ts, apps/web/vercel.json and actual hosting config.
4. **Approach:** Remove localhost from production allowed origins; configure suitable CSP/HSTS/frame/MIME/referrer policy at serving layer; retain non-credentialed CORS unless architecture changes.
5. **Dependencies:** Hosting access; Clerk CSP requirements.
6. **Risk/severity:** Low hardening; production behavior unknown.
7. **Estimate:** S/M.
8. **Acceptance:** Production allowlist contains only approved origins; expected headers verified on live non-sensitive endpoint; no credentialed cross-origin access unintentionally enabled.
9. **Tests:** WEB-02; CORS allow/deny/preflight and header assertions.
10. **Verification:** Inspect deployment config and HTTP response headers using authorized environment.
11. **Order:** Early config audit, before production sign-off.

### SEC-08 — Input validation

1. **Description:** Maintain strict Zod schemas and add bounds to collection controls.
2. **Related findings:** SEC-F-01; no general validation bypass found.
3. **Files:** appointment.validation.ts, patient.validation.ts and pagination schemas across route modules.
4. **Approach:** Validate cursor, page size and sort/filter fields; enforce server-side max; reject unknown keys and malformed IDs.
5. **Dependencies:** SEC-09 list API contract.
6. **Risk/severity:** Medium for unbounded lists, otherwise preventative.
7. **Estimate:** S/M.
8. **Acceptance:** Invalid, unknown, oversized and malformed inputs return controlled 4xx with no mutation; valid pagination is deterministic.
9. **Tests:** VAL-01 through VAL-05 and PAG-01 through PAG-06.
10. **Verification:** Zod unit and route tests; inspect DB call limit.
11. **Order:** Implement alongside SEC-09.

### SEC-09 — Rate limiting and bounded collection responses

1. **Description:** Address SEC-F-01 and absence of general HTTP rate limits.
2. **Related findings:** SEC-F-01, SEC-H-01.
3. **Files:** patient.validation/service/repository/routes; appointment.validation/service/repository/routes; app middleware or suitable shared limiter; operational metrics.
4. **Approach:** Add default/max cursor pagination and minimal list projections; add route-class rate limits for sensitive reads, onboarding, invitations and provider-triggering actions. Use shared counters when horizontally scaled.
5. **Dependencies:** UX/API client pagination needs; selection of shared counter/storage if multiple instances.
6. **Risk/severity:** Medium (P2) bulk exposure and availability potential; no cross-clinic bypass.
7. **Estimate:** M.
8. **Acceptance:** Both collections have a strict page maximum and stable order; list responses omit unnecessary sensitive details; every query retains clinic scope; rate limits return controlled 429; authorized ordinary clinic workflows remain usable.
9. **Tests:** PAG-01 through PAG-06, RATE-01 through RATE-04.
10. **Verification:** Unit/route tests plus isolated load smoke test with fictional data; assert DB query count/limit and tenant boundary.
11. **Order:** First implementation priority.

### SEC-10 — Secrets/credentials

1. **Description:** Verify runtime secret storage and key restrictions; no tracked secret detected in reviewed tracked files.
2. **Related findings:** SEC-H-04.
3. **Files:** env examples, deployment manifests/config, provider console configuration, CI secret references.
4. **Approach:** Confirm secret manager usage, separate environments, minimum provider scopes and rotation procedures. Do not expose values in logs/reports.
5. **Dependencies:** Authorized Render/Vercel/Clerk/provider access.
6. **Risk/severity:** High impact if misconfigured, evidence gap only.
7. **Estimate:** S/M.
8. **Acceptance:** Config names/owners/environments documented without values; production secrets absent from repo/artifacts/logs; rotation runbook exists.
9. **Tests:** OPS-01 to scan tracked source/artifacts safely; secret-store permission review.
10. **Verification:** Authorized configuration review and non-mutating secret scan if installed.
11. **Order:** Before production sign-off; no credential rotation absent evidence/authorization.

### SEC-11 — SSRF

1. **Description:** No arbitrary destination request path found.
2. **Related findings:** None.
3. **Files:** Geoapify and Resend clients; future outbound fetch features.
4. **Approach:** Keep destinations fixed/allowlisted, validate outbound payloads, bound timeouts; if arbitrary URLs are added, add DNS/IP/private-network controls.
5. **Dependencies:** None.
6. **Risk/severity:** No current finding.
7. **Estimate:** S preventative.
8. **Acceptance:** User inputs cannot select host, scheme or redirect target for server-side HTTP.
9. **Tests:** EXT-01 through EXT-03.
10. **Verification:** Mock HTTP clients and inspect URL construction.
11. **Order:** Reassess only when adding URL fetch functionality.

### SEC-12 — Upload security

1. **Description:** No upload route was found in the mounted inventory.
2. **Related findings:** Not applicable currently.
3. **Files:** None currently; future upload routes/services/storage.
4. **Approach:** Before adding uploads, define type/size limits, malware scanning, safe object storage, access control and retention.
5. **Dependencies:** A product upload requirement.
6. **Risk/severity:** Not applicable today.
7. **Estimate:** S for design when triggered.
8. **Acceptance:** No upload endpoint ships without documented threat controls and tests.
9. **Tests:** Future upload-specific size/type/content/access tests.
10. **Verification:** Review new route inventory and storage policy.
11. **Order:** Gate future upload feature; no work now.

### SEC-13 — Data leakage and audit logging

1. **Description:** Reduce list exposure and establish production logging evidence.
2. **Related findings:** SEC-F-01, SEC-H-04.
3. **Files:** Patient/appointment projections; error handler; activity/audit event services; deployed logging configuration.
4. **Approach:** SEC-09 projection minimization; define audit events for staff/role changes, invitation actions, exports and sensitive access; redact PHI/tokens in logs; restrict access and retention.
5. **Dependencies:** Privacy/operations ownership and hosting logs access.
6. **Risk/severity:** Medium for broad API output; other log-control concerns unverified.
7. **Estimate:** M.
8. **Acceptance:** List projections are documented; audit events capture actor, clinic, action and object reference without PHI/token; retention/access policy is approved.
9. **Tests:** DATA-01 to DATA-04; log redaction tests with synthetic markers.
10. **Verification:** Integration tests and authorized log configuration review.
11. **Order:** Pair with SEC-09; operational review before release.

### SEC-14 — Dependencies and automation

1. **Description:** Offline advisory result cannot establish current dependency status.
2. **Related findings:** SEC-H-04 evidence limitation.
3. **Files:** package manifests/lockfiles and CI workflow.
4. **Approach:** Run authorized current advisory scan in CI; define update/triage policy and pin lockfile changes through review.
5. **Dependencies:** Network-enabled CI/tooling and owner.
6. **Risk/severity:** Unknown; no verified exploitable dependency issue.
7. **Estimate:** S/M.
8. **Acceptance:** Current scan output reviewed; pipeline produces actionable results without auto-mutating production dependencies.
9. **Tests:** CI policy check and reviewed report artifact.
10. **Verification:** Run current scanner in CI or controlled environment; distinguish reachability and exploitability.
11. **Order:** Before release sign-off, parallel with deployment checks.

### SEC-15 — Source maps and builds

1. **Description:** Production source-map publication is not observable from checked-in config alone.
2. **Related findings:** SEC-H-04.
3. **Files:** Vite/build config, server tsconfig/build output, Vercel/Render artifact rules.
4. **Approach:** Decide whether maps are uploaded privately for error monitoring or omitted from public artifacts; inspect output and hosting paths.
5. **Dependencies:** Release pipeline access.
6. **Risk/severity:** Informational until artifact exposure verified.
7. **Estimate:** S.
8. **Acceptance:** Public artifact contains only approved files; private maps have restricted access if retained.
9. **Tests:** Build artifact listing and HTTP check in staging.
10. **Verification:** Build candidate without deployment, then inspect authorized staging output.
11. **Order:** Pre-release deployment review.

### SEC-16 — RLS and database least privilege

1. **Description:** Verify database principal privileges; absence of RLS alone is not a tenant-isolation finding.
2. **Related findings:** SEC-H-03, SEC-H-04.
3. **Files:** Prisma schema/migrations and external DB role/network configuration.
4. **Approach:** Document runtime vs migration roles, restrict privileges/network access, and assess RLS as defense-in-depth with connection context design.
5. **Dependencies:** DBA and database configuration access; migration review.
6. **Risk/severity:** High impact if runtime credentials are overprivileged; no evidence either way.
7. **Estimate:** M/L.
8. **Acceptance:** Runtime role has only required privileges; administrative/migration access separated; any RLS policy is tested against pooled connections and background jobs.
9. **Tests:** DB role permission tests, negative cross-clinic query tests, migration role tests.
10. **Verification:** Authorized staging DB role review; no production privilege changes during audit.
11. **Order:** Before production sign-off; after data-access architecture review.

### SEC-17 — Privacy, backups and exports

1. **Description:** Verify operational retention, restore and export destination controls.
2. **Related findings:** SEC-H-04.
3. **Files:** Dataset export CLI/services, gitignore, backup/retention configuration and recipient procedures.
4. **Approach:** Approve destination, encryption, access, retention/deletion and recipient process; test restore without using live patient records.
5. **Dependencies:** Privacy/data owner and operations.
6. **Risk/severity:** High impact if sensitive artifacts are mishandled; no current leak observed.
7. **Estimate:** M.
8. **Acceptance:** Export recipient and retention policy documented; fictional restore test succeeds; backups access is restricted and restore is practiced.
9. **Tests:** EXPORT-01 through EXPORT-05; backup restoration with synthetic data.
10. **Verification:** Inspect permissions and authorized storage configuration; do not generate a real export for this audit.
11. **Order:** Before production sign-off.

### SEC-18 — Workflow and concurrency

1. **Description:** Existing lifecycle protections look sound; extend race/integration tests.
2. **Related findings:** No confirmed defect.
3. **Files:** appointment lifecycle/repositories, queue services, invitation transaction, prediction worker and corresponding tests.
4. **Approach:** Test simultaneous slot bookings, queue reorder/status races, invite accept/revoke and worker reclaim using isolated DB.
5. **Dependencies:** Dedicated test database/fixtures.
6. **Risk/severity:** Medium operational/integrity risk if regression.
7. **Estimate:** M.
8. **Acceptance:** Concurrent execution leaves unique/valid state, no duplicate acceptance, no cross-clinic mutation and worker leases recover deterministically.
9. **Tests:** FLOW-01 through FLOW-05.
10. **Verification:** Repeatable integration tests; no load or destructive production test.
11. **Order:** Parallel with SEC-19 after fixture setup.

### SEC-19 — Security regression tests

1. **Description:** Consolidate reusable fictional two-clinic fixtures and route-level negative coverage.
2. **Related findings:** SEC-F-01 and all preventative auth/workflow items.
3. **Files:** apps/server module test directories; shared test factories/setup where appropriate.
4. **Approach:** Create Clinic A/B with Admin/Staff identities and linked patients, doctors, appointments, queue rows, predictions, invitations and users. Assert denied reads/writes produce no side effect.
5. **Dependencies:** Test database and existing auth stubs; coordinate with SEC-02/03/08/09.
6. **Risk/severity:** Confidence gap, not proof of a bug.
7. **Estimate:** M.
8. **Acceptance:** Each high-risk object route has positive same-clinic and negative foreign-clinic test; no real PII or credentials; tests run in CI.
9. **Tests:** All IDs in V0_5_SECURITY_TEST_PLAN.md.
10. **Verification:** Run in isolated CI/test DB; confirm setup cannot point to production.
11. **Order:** Start early; tests should ship alongside each remediation.

## Suggested implementation sequence

1. Build fictional tenant fixture (SEC-19) and add collection API contract tests.
2. Implement SEC-09 pagination/projection bounds plus validation (SEC-08) and sensitive rate policies.
3. Add object and role regression coverage (SEC-02/03), keeping currently passing service checks unchanged unless tests show a defect.
4. Review data/log treatment (SEC-13), concurrency (SEC-18), and conditional shared-profile invariant (SEC-H-03).
5. Complete authorized deployment verification: SEC-04, SEC-07, SEC-10, SEC-14, SEC-15, SEC-16 and SEC-17.
6. Keep SEC-05/06/11 as review gates for future code changes; SEC-12 activates if uploads are introduced.
