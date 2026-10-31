# Pravaah v0.5 Security Findings Register

## Summary

| Finding ID | Severity | Confidence | Category | Affected Module | Impact | Evidence | Proposed Fix | Related Issue |
|---|---|---|---|---|---|---|---|---|
| SEC-F-01 | Medium (P2), resolved | High | Sensitive data exposure / resource exhaustion | Patient and appointment list APIs | Formerly unbounded clinic-local responses; current source enforces pagination and a 100-row maximum. No cross-clinic bypass was identified. | `patient.repository.ts`, `appointment.repository.ts`; Issue #300 PostgreSQL security suite | Resolved before Issue #300; retain list scoping and page-boundary regressions. | SEC-09, SEC-13, SEC-19, #292 |
| SEC-300-01 | Medium (P1), mitigated | High | Cross-tenant shared-profile integrity | Doctor and patient profile update/geocoding APIs | A linked clinic user could mutate global fields on a Doctor/Patient shared with another clinic, changing data observed and relied upon by that clinic. | Issue #300 PostgreSQL security regression: two clinics, shared profiles, both directions, unchanged state after denied writes | Reject global profile writes whenever another clinic link exists; preserve clinic-local PatientClinic notes. | #300 |

## Resolved finding: SEC-F-01 — Unbounded sensitive clinic list responses

The implementation now validates page and limit inputs, uses clinic-scoped deterministic queries, caps pages at 100 records, and returns minimal patient list fields. Issue #300's PostgreSQL suite exercises tenant scoping, default and maximum page boundaries, search, and stable appointment ordering. This supersedes the historical source observations below in earlier audit artifacts.

## Confirmed finding mitigated by Issue #300: SEC-300-01 — Shared profile mutation

- **Severity:** Medium; this is a cross-tenant integrity issue through an intentionally shared identity row.
- **Affected endpoints:** `PATCH /api/clinics/:clinicId/doctors/:doctorId`, `PATCH /api/clinics/:clinicId/patients/:patientId`, and `POST /api/clinics/:clinicId/patients/:patientId/geocode`.
- **Root cause:** Route/service checks established that the DoctorClinic or PatientClinic link belonged to the caller's clinic, but the repository then updated the global `Doctor` or `Patient` row. Geocoding also writes global Patient location fields. A second clinic's appointment and list/detail views use that same row.
- **Reproduction evidence:** The isolated PostgreSQL fixture creates one Doctor and one Patient linked to both fictional clinics. The new HTTP regression sends profile updates as Staff A and Staff B in both directions, plus shared-patient geocoding. Every request is rejected and the business-state snapshot remains unchanged. Clinic A can still change its own PatientClinic notes without changing Clinic B's notes.
- **Fix:** Doctor profile update runs in a transaction, locks the profile row, and rejects an update when another clinic link exists. Patient profile update uses the same guarded transaction; clinic-local notes remain available. Patient geocoding checks for another clinic link before preparing or calling the provider, and the repository repeats the guard at mutation time.
- **Regression result:** Passed in the 61-test Issue #300 security suite against isolated PostgreSQL 16. Same-clinic operations are covered by existing positive integration cases.
- **Residual limitation:** No API currently provides a global shared-profile editing authority. When a Doctor or Patient is shared, neither clinic can change its global profile fields through clinic-scoped endpoints. A future explicit global profile workflow would need separate authorization and audit policy.

## Preventative hardening and unverified risks

These are not confirmed exploitable vulnerabilities and must not be reported as such.

### SEC-H-01 — No general API rate limiting observed

- **Severity:** Low hardening priority; confidence high for source-level absence.
- **Evidence:** apps/server/src/app.ts:20-52 configures Clerk middleware, CORS, JSON parsing, routers and error handling, with no rate-limit middleware. Route review found no general limiter. Invitation creation has workflow-specific safeguards, not a general HTTP policy.
- **Risk:** Automated or compromised clients can repeat list, onboarding, invite, geocoding, routing or dashboard requests. Provider timeouts limit request duration but not aggregate volume.
- **Recommendation:** Set route-class limits after observing legitimate traffic. Use shared counters if multiple instances; consider identity/clinic keys, separate invitation/provider-triggering policies, safe 429 responses and monitoring. Do not rely only on IP limits where clients may share NAT.
- **Verification:** Controlled test in isolated environment; ensure counters behave across instances if applicable, normal workflows remain possible, and 429 responses disclose no sensitive details.
- **Related:** SEC-09, SEC-19.

### SEC-H-02 — CORS defaults and browser security headers need deployment review

- **Severity:** Low; confidence medium because production config was not available.
- **Evidence:** apps/server/src/config/env.ts defaults both client origins to localhost and builds allowedClientOrigins; app.ts:24-35 uses that allowlist and does not enable credentialed CORS. No explicit app-level CSP, HSTS, frame, MIME-sniffing or referrer policy middleware was found in app.ts. Hosting-layer headers may exist outside source.
- **Risk:** If localhost remains in a production API allowlist, it is unnecessary origin access. Since API auth uses explicit bearer Authorization and CORS is not credentialed, this alone is not a demonstrated cross-site data theft vulnerability. Browser protections may depend on hosting defaults.
- **Recommendation:** Verify deployed origins; include localhost only in development. Define appropriate API and frontend headers at the correct hosting layer, with a CSP compatible with Clerk and app resources. Confirm preflight behavior and do not treat CORS as authorization.
- **Related:** SEC-07, SEC-19.

### SEC-H-04 — Production controls cannot be verified from this repository

- **Severity:** Informational.
- **Confidence:** High that the listed facts were unavailable; no claim is made that controls are absent.
- **Items requiring operator verification:** Clerk production MFA/session policy and key separation; provider API key restrictions/rotation; DB role least privilege, network restrictions and backups; encryption/retention; log access/redaction/retention; source map publication and deployment artifact exposure; export destination permissions/recipient approval; production CORS/header behavior.
- **Recommendation:** Record evidence from authorized configuration views and deployment checks in the release security record. Do not place secret values in audit docs.
- **Related:** SEC-04, SEC-07, SEC-10, SEC-13, SEC-15, SEC-16, SEC-17.

## Reviewed hypotheses not elevated to findings

| Hypothesis | Disposition and evidence |
|---|---|
| Cross-clinic object access / BOLA | No direct foreign-object read/write bypass was confirmed. `access.service.ts` enforces exact clinic equality and appointment ownership; service paths check patient/doctor clinic links, queue membership, staff target scope, and prediction clinic ownership. The shared-profile cross-clinic write defect is recorded above and rejected by the passing two-clinic PostgreSQL regression. |
| Missing Admin enforcement | Not confirmed. Staff management and lifecycle routes use Admin middleware; service checks reinforce sensitive flows. |
| SQL injection | Not confirmed. Reviewed raw SQL uses Prisma tagged template parameters; no unsafe raw-query call found. |
| XSS | Not confirmed. Source search found no dangerouslySetInnerHTML path; React renders structured values. Redirect handling uses same-origin path constraints. |
| CSRF | Not confirmed for current API model. Frontend sends explicit bearer Authorization and CORS does not enable credentials; no ambient cross-origin session cookie flow was identified. Reassess if cookie-authenticated mutations are introduced. |
| SSRF | Not confirmed. Geoapify and Resend destinations are fixed HTTPS endpoints; user values populate validated request fields, not arbitrary destination URLs. |
| Invitation token weakness | No vulnerability identified: random raw token, hash stored, expiry/status checks, email identity binding, one-time acceptance transaction and revocation race handling. Verify deployed log redaction. |
| Error messages/logs disclose PHI | No confirmed leak. Unknown errors are logged, but no patient-data flow to that logger was demonstrated. Review production log access/redaction. |
| Missing RLS proves tenant breach | False positive. Lack of RLS does not prove tenant bypass; app-level authorization exists. DB role/RLS remain defense-in-depth and operational verification. |
| Source maps/dependency vulnerabilities | Not established. Offline npm audit cache had zero advisories but freshness is unknown; production artifact map exposure not verified. |

## Severity rationale

No Critical or High confirmed issue was established in the historical review. SEC-F-01 was resolved by bounded pagination. SEC-300-01 was a confirmed Medium cross-clinic integrity issue and is mitigated with regression evidence. SEC-H-01/02 remain hardening or deployment-verification items; SEC-H-04 is informational. See the Issue #300 audit for current status.
