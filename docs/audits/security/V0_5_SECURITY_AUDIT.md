# Pravaah v0.5 Security Audit (SEC-01)

**Assessment type:** Repository-based security review and safe, mocked-test verification  
**Audit baseline:** `main` at `add66870635961386c29bb0eb3e3e286900c2eed`; root package reports `0.4.0`  
**Scope:** Source, configuration, schema, documentation, existing tests, and local non-production analysis. No production access or secrets were used.  
**Status:** Audit establishes a source-level posture; it is not a production security certification.

## Executive summary

The reviewed API consistently resolves Clerk identities to active internal users, enforces Admin/Staff role checks, and scopes clinic operations to the user's clinic. Object-ID routes were traced into services that check clinic ownership, including appointments, linked patients/doctors, queue entries, staff records, and prediction feedback. The invitation flow uses expiring, one-time hashed tokens and binds acceptance to the authenticated identity's email. No confirmed cross-clinic authorization bypass, SQL injection, stored/reflected XSS, or CSRF issue was found in the reviewed paths.

The clearest code-level security concern is that patient and appointment list APIs can return all records for a clinic without pagination. These endpoints return sensitive patient information and appointment prediction context. This creates avoidable bulk access and resource-consumption exposure for a compromised or malicious clinic account, but does not bypass clinic authorization. Treat **SEC-F-01 (Medium, P2)** as the first code remediation. Also prioritize deployment verification and prevention work for API rate limits, CORS origin configuration, browser security headers, production auth/MFA settings, database privilege boundaries, and export/log governance. Those are hardening or unverified operational controls, not confirmed vulnerabilities.

The audit reviewed all 59 mounted backend routes (including the public root), sensitive Prisma access patterns, onboarding/invitations, lifecycle/queue integrity, external integrations, export and background-refresh flows, seed safety, and selected security-relevant tests. It ran 16 server test files (158 tests) that passed. Tests use mocks and do not prove deployed tenant isolation.

## Scope, baseline, and method

The current branch and commit were checked with `git rev-parse HEAD` and `git status --short`. Four existing untracked UX audit documents were present before this work and were left untouched. Source review followed route mounts in `apps/server/src/app.ts` into each router and traced controller/service/repository ownership checks. Relevant schema, integrations, app configuration, frontend API client, export code, background worker, seed scripts, and tests were reviewed. Exact route-level inventory is in [V0_5_API_SECURITY_MATRIX.md](V0_5_API_SECURITY_MATRIX.md).

Evidence line references point to the audited commit and may shift as code changes. `README.md`, `docs/architecture/AUTH_AND_SECURITY.md`, and release documentation contain older release or invitation details; current source and `docs/workflows/staff-invitations-and-management.md` were treated as authoritative where they differ.

## Coverage summary

| Area | Status | Files/routes reviewed | Important finding |
|---|---|---|---|
| Authentication | Source traced; Clerk tenant settings unavailable | `app.ts`, auth middleware/service/routes, invitation flow; 59-route inventory | Active internal-user check on protected routes. MFA/session configuration needs deployment-side verification. |
| Authorization | Source traced | All routers, access service, object-level service paths | No confirmed bypass. 24 Admin-only routes; clinic staff access is server enforced. |
| Clinic isolation | Source traced; mock tests passed | Clinic-scoped CRUD, appointment, queue, dashboard, staff, feedback | Route-level owner checks found. No live two-clinic runtime test was possible. |
| Database | Static review | Prisma schema, repositories, SQL, migrations, seed/export code | Tagged/parameterized SQL observed. Database role privileges, RLS, backups, and encryption configuration unavailable. |
| API validation | Static review | Zod schemas on mounted routes | Strict schemas common; patient and appointment collection queries have no pagination limits (SEC-F-01). |
| Injection and browser security | Static review | SQL calls, React rendering, redirects, API client, CORS | No unsafe SQL or `dangerouslySetInnerHTML` path found. CORS local-origin default and absent app-level headers need deployment review (SEC-H-02). |
| Secrets | Repository metadata review only | `.gitignore`, tracked files, env references | Only example env files are tracked; actual env file contents were not read. Production secret storage/rotation unavailable. |
| External integrations | Source traced | Geoapify, Resend | Fixed HTTPS destinations, bounded timeouts and response handling; provider key restrictions/configuration unknown. |
| Logging and privacy | Source traced | error handler, email/provider errors, export workflows | No confirmed PHI log disclosure; raw unknown errors are logged and should be reviewed against production log access/retention. |
| Dependencies | Offline check | npm dependency tree and lockfiles | `npm audit --offline` reported zero advisories in its local cache; cache freshness and online advisory status are unverified. |
| Deployment | Not independently verified | Render/Vercel configs and deployment docs | Live environment variables, MFA, headers, source maps, DB network/access, backups, and log retention need manual verification. |

## Architecture and security controls

Browser requests use Clerk bearer tokens through `apps/web/src/lib/apiClient.ts`. `app.ts` registers Clerk middleware, CORS, JSON parsing, and API routers (`apps/server/src/app.ts:20-52`). `authenticateRequest` requires a bearer-shaped Authorization header, a Clerk-authenticated identity, and an active internal user lookup (`auth.middleware.ts:8-60`). Onboarding and invitation routes intentionally use `authenticateClerkIdentity` and then apply workflow-specific checks. `access.service.ts:6-79` enforces active status, role, exact `clinicId` equality, clinic existence/active state, and appointment-to-clinic ownership.

The reviewed route set comprises 59 endpoints: 2 public (health/root), 4 Clerk-identity-only (two onboarding, two invitation-token operations), and 53 protected by internal-user authentication. Among the latter, 24 are Admin-only, 28 allow Admin/Staff, and `/api/auth/me` requires an active internal user without a clinic role. The three clinic lifecycle routes omit the common clinic-access middleware, but their service methods enforce Admin and same-clinic ownership; this was not treated as a bypass.

Patient and appointment repositories select fields containing sensitive identifiers/contact/location data and in some cases attendance or prediction details. Access is clinic-scoped; the issue is the unbounded collection response, not cross-tenant access. Export tooling has separate operator-configured clinic authorization and de-identification controls; it is not an HTTP endpoint and its CLI flag is not a substitute for OS/operator access control.

## Findings summary

| ID | Type | Severity | Confidence | Summary |
|---|---|---:|---:|---|
| SEC-F-01 | Hardening with confirmed behavior | Medium (P2) | High | Patient and appointment lists can return unpaginated clinic-wide sensitive datasets. |
| SEC-H-01 | Preventative hardening | Low | High | No application-level HTTP rate limiting was found. |
| SEC-H-02 | Deployment verification/hardening | Low | Medium | CORS defaults include localhost; app-level security headers are not configured here. Production impact is unverified. |
| SEC-H-03 | Conditional data-model hardening | Low | Medium | Doctor/Patient profile rows are global while clinic links are many-to-many; update operations affect shared profile rows if multi-clinic links exist. |
| SEC-H-04 | Operational verification | Informational | High | MFA, provider restrictions, DB privileges/RLS, backups, log controls, source-map publication and production secrets cannot be verified from this repository. |

No confirmed Critical, High, or Medium-severity exploit was established. Severity for SEC-F-01 describes sensitive bulk exposure and availability potential within a clinic account; it is not a cross-clinic confidentiality break.

## Existing controls observed

- Clerk identity is separated from internal application user and role state.
- Protected API paths require active internal status; Admin and Staff permissions are checked on the server.
- Clinic ID and object ownership are checked in route middleware and/or services; object-ID routes resolve their owning clinic before access.
- Zod validation is used for route params, body, and queries, with strict object schemas in reviewed modules.
- Invitation tokens are generated from cryptographic random bytes, stored as hashes, expire, and are accepted only for the authenticated email; transaction locking protects one-time use/revocation races.
- Appointment and queue transition logic validates legal state changes and uses database transactions/consistency checks.
- Raw SQL use reviewed was tagged/parameter-bound; no unsafe raw-query API usage was found in the source search.
- Geoapify and Resend requests use fixed provider endpoints, HTTPS, bounded timeouts, and controlled error handling; user input does not select arbitrary network destinations.
- Dataset exports are clinic/date/cohort constrained, de-identify output, use private file modes, avoid overwrites, and are git-ignored; seed scripts have explicit environment/target safeguards.

## Prioritized action

1. **SEC-09 / SEC-F-01:** Add bounded pagination and a reviewed minimal response projection to patient and appointment list endpoints; add regression tests for default/max page size and tenant scoping.
2. **SEC-09:** Introduce rate limits with route-appropriate policies for sensitive reads, invitation lifecycle, onboarding, and provider-triggering actions; avoid locking out ordinary workflows.
3. **SEC-07 / SEC-04 / SEC-10 / SEC-15 / SEC-16 / SEC-17:** Verify live deployment configuration for CORS, headers, MFA/session policy, secret storage, database least privilege, backups/retention, logs, and source maps. Resolve gaps only after confirming actual hosting behavior.
4. **SEC-18 / SEC-19:** Keep lifecycle, invitation concurrency, and clinic isolation guarantees covered with fictional two-clinic integration fixtures.

Full proposed issue mapping, acceptance criteria, estimates, and test plans are in the backlog and test-plan deliverables.

## Verification performed

Safe, non-mutating source review and selected local server tests were performed. The following commands passed:

```text
npm test -w apps/server -- src/modules/auth/__tests__/auth.middleware.test.ts src/modules/auth/__tests__/access.service.test.ts src/modules/auth/__tests__/auth.routes.test.ts src/modules/staff/__tests__/staff.routes.test.ts src/modules/staff/__tests__/staff.validation.test.ts src/modules/predictions/__tests__/prediction-feedback.service.test.ts src/modules/predictions/dataset-export/__tests__/dataset-export.test.ts
  7 files, 77 tests passed

npm test -w apps/server -- src/modules/appointments/__tests__/appointment.service.test.ts src/modules/appointments/__tests__/appointment.lifecycle.test.ts src/modules/queues/__tests__/queue.service.test.ts src/modules/patients/__tests__/patient.service.test.ts src/modules/clinics/__tests__/clinic.service.test.ts src/modules/predictions/prediction.refresh.worker.test.ts src/services/email/__tests__/email.service.test.ts src/integrations/geoapify/geoapify.client.test.ts src/integrations/geoapify/geoapify.routing.client.test.ts
  9 files, 81 tests passed

npm audit --offline --json
  0 advisories reported from local cache; 576 dependencies; advisory freshness not established
```

No migration, seed, production API call, real export, or destructive check was performed. No live Clerk token, account, database, Vercel/Render environment, production logs, or provider console was available or accessed. No app tests beyond the selected set were executed. A local web preview was not used. The reports contain no secret values or patient data.

## Assessment and limitations

**Suitable for further controlled testing:** Yes, using an isolated environment and fictional records. **Production security sign-off:** Not supported by this repository audit alone. Before sign-off, verify actual Clerk MFA/session policies, production CORS and headers, secret management, database network and role privileges, backups/retention, log redaction/access, artifact/source-map publishing, provider-key restrictions, and execute a controlled two-clinic authorization suite against the deployed candidate. Implement and verify bounded collection reads before broad clinic rollout.

Confidence is high for the described source paths and selected mocked tests, medium for architecture-level conditional risks, and low for deployment controls that were not observable.
