# Pravaah v0.5 Security Findings Register

## Summary

| Finding ID | Severity | Confidence | Category | Affected Module | Impact | Evidence | Proposed Fix | Related Issue |
|---|---|---|---|---|---|---|---|---|
| SEC-F-01 | Medium (P2) | High | Sensitive data exposure / resource exhaustion | Patient and appointment list APIs | Authorized clinic account can obtain an unbounded response containing patient identity/contact/location and appointment/prediction context; large result sets can increase DB, memory, and response costs. No cross-clinic bypass found. | patient.repository.ts:380-425; appointment.validation.ts:93-111; appointment.repository.ts:139-179; patient.routes.ts:80-90; appointment.routes.ts:55-65 | Add server-enforced pagination and maximum page size; minimize list projections; test clinic scope and limits. | SEC-09, SEC-13, SEC-19 |

## Confirmed behavior requiring remediation

### SEC-F-01 — Unbounded sensitive clinic list responses

**Implementation in progress (#292, P1; local working tree; finding remains open pending full review):** The two primary collection routes now validate bounded page/limit inputs and use clinic-scoped, sorted Prisma projections with lookahead. Their React consumers request pages and booking patient search runs on the server. Dashboard appointment previews and high-risk/activity detail lists have response bounds; analytics and the operational daily queue retain deliberate scoped processing. Security regression cases were added to the isolated PostgreSQL suite. See `docs/architecture/API_STRUCTURE.md` for the current contract. The P2 label below reflects the earlier audit; issue #292 assigns P1 priority.

- **Severity:** Medium (P2), as a data-minimization and availability risk within a clinic account. It is not evidence of unauthorized cross-clinic access.
- **Confidence:** High; source trace confirms no pagination parameters or database result bound on these collection paths.
- **Affected components:** GET /api/clinics/:clinicId/patients and GET /api/clinics/:clinicId/appointments.
- **Prerequisites:** Attacker has a valid active Staff or Admin account in the clinic, or has compromised such a session. The account is authorized to see clinic records, but current endpoint behavior makes bulk extraction easy and boundedness dependent on database size.
- **Evidence:**
  - apps/server/src/modules/patients/patient.validation.ts:94-103 accepts only optional search and active filters.
  - apps/server/src/modules/patients/patient.repository.ts:380-425 queries clinic-linked rows and has no take/cursor/offset. Its response projection includes name, phone, email, gender, DOB/age, full address, coordinates, emergency contacts, notes and visit counters (:32-83, :415-420).
  - apps/server/src/modules/appointments/appointment.validation.ts:93-111 accepts optional date, doctor, patient and status only.
  - apps/server/src/modules/appointments/appointment.repository.ts:139-179 filters by clinic and optional filters, then calls findMany without a result bound. appointmentDetailsInclude (:74-128) includes patient identity/contact/address, doctor/creator data, queue timing and latest prediction feature snapshot.
  - Both routes require authenticateRequest, clinic access and Staff/Admin role (patient.routes.ts:80-90; appointment.routes.ts:55-65). This materially reduces exposure: a caller cannot use these paths to enumerate another clinic based on traced checks.
- **Observed result:** Static source trace establishes that a request with omitted filters can return the entire matching clinic collection. No production or database dataset was queried; no volume or performance measurement was attempted.
- **Impact:** Bulk disclosure by a compromised/insider clinic account, excess exposure beyond the immediate screen need, and avoidable database/memory/network load. No evidence of public access or cross-tenant data.
- **Root cause:** Collection read contracts do not require page bounds and repositories do not cap result count; list responses reuse detailed record projections.
- **Recommended fix:** Add stable cursor pagination and a conservative server-enforced maximum page size including a default. Select only fields needed by list screens; fetch full details through object routes. Preserve clinic scope in every page query and use deterministic ordering with a tie-break key. Add request-level rate limits as a separate abuse control.
- **Safe verification:** In a local/test database with fictional Clinic A and Clinic B rows, request both collections as Clinic A Staff without pagination and confirm current responses include all Clinic A rows and no Clinic B rows. After remediation, test default/max page sizes, cursor stability under inserts, invalid cursor behavior, filters and tenant scope. Do not enumerate production records.
- **Regression tests:** Patient and appointment repository/service/route tests; see SEC-01 test cases PAG-01 through PAG-06.
- **References:** SEC-09 (rate limit), SEC-13 (data exposure/logging controls), SEC-19 (regressions).

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

### SEC-H-03 — Shared Doctor/Patient profile model can cross clinic contexts conditionally

- **Severity:** Low architecture/data-integrity hardening; confidence medium.
- **Evidence:** Prisma schema models global Doctor and Patient entities linked through DoctorClinic and PatientClinic. Current create flows make one clinic link; update services check the link but update the shared Doctor/Patient profile record. No ordinary endpoint to link an existing record to a second clinic was found.
- **Risk:** If records acquire multiple clinic links through future functionality, imports, or privileged direct DB operations, changing a global profile through one clinic may affect another clinic's view. This is conditional, not a demonstrated cross-clinic authorization bypass.
- **Recommendation:** Decide whether profile fields are intentionally global or clinic-scoped. Document the invariant; if multi-clinic sharing is supported, explicitly authorize and test shared-profile updates. If not, enforce single-link invariant and migrate safely.
- **Related:** SEC-02, SEC-16, SEC-18, SEC-19.

### SEC-H-04 — Production controls cannot be verified from this repository

- **Severity:** Informational.
- **Confidence:** High that the listed facts were unavailable; no claim is made that controls are absent.
- **Items requiring operator verification:** Clerk production MFA/session policy and key separation; provider API key restrictions/rotation; DB role least privilege, network restrictions and backups; encryption/retention; log access/redaction/retention; source map publication and deployment artifact exposure; export destination permissions/recipient approval; production CORS/header behavior.
- **Recommendation:** Record evidence from authorized configuration views and deployment checks in the release security record. Do not place secret values in audit docs.
- **Related:** SEC-04, SEC-07, SEC-10, SEC-13, SEC-15, SEC-16, SEC-17.

## Reviewed hypotheses not elevated to findings

| Hypothesis | Disposition and evidence |
|---|---|
| Cross-clinic object access / BOLA | No confirmed bypass. access.service.ts:42-64 enforces exact clinic equality and active clinic state; :66-79 resolves appointment clinic; service paths check patient/doctor clinic links, queue membership, staff target scope and prediction clinic ownership. Clinic lifecycle service enforces same-clinic ownership despite omitted common middleware. Deployed two-clinic regression remains necessary. |
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

No Critical or High confirmed issue was established. SEC-F-01 is Medium because sensitive clinic records are returned in bulk without a response bound and may amplify resource cost, while access still requires an account authorized to that clinic. SEC-H-01/02/03 are Low preventative controls or conditional risks and are not counted as confirmed vulnerabilities. SEC-H-04 is informational and represents evidence gaps.
