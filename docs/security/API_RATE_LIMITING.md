# API rate limiting (Issue #304 / SEC-H-01)

This is the initial, provisional policy for the implemented Express API. The original finding in `docs/audits/security/V0_5_SECURITY_FINDINGS.md` rated SEC-H-01 as **Low preventative hardening**, based on the absence of application-level HTTP rate limiting. No production traffic baseline or provider quota measurement is available. Tune maxima after observing 429s and clinic workload; do not treat these values as measured capacity.

## Policy and risk matrix

All windows are fixed windows starting with the first counted request for a key. A listed shared policy uses PostgreSQL counters across backend instances. The general and identity-read policies use a bounded process-local counter. Every authenticated internal-user route also receives `general` in `authenticateRequest`; it is deliberately generous so normal appointment and queue bursts are not constrained by a small global quota. The separate route policy is applied after authentication, validation and relevant clinic access checks, before its controller.

| Policy             | Initial maximum         | Key                              | Store  | Risk / reason                                                                                                      |
| ------------------ | ----------------------- | -------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------ |
| `general`          | 1,800 / 5 min           | internal user                    | local  | Low; abnormal sustained traffic, high enough for clinic polling                                                    |
| `identityRead`     | 120 / min               | verified Clerk ID                | local  | Medium; onboarding status and profile reads                                                                        |
| `collection`       | 120 / min               | internal user                    | shared | Medium; clinic-scoped collection and detail reads, bounded pagination already applies to patient/appointment lists |
| `queueRead`        | 300 / min               | internal user                    | shared | Medium; live queue polling needs a higher ceiling                                                                  |
| `dashboard`        | 90 / min                | internal user                    | shared | Medium; repeated aggregation                                                                                       |
| `mutation`         | 180 / min               | internal user                    | shared | Medium; protects ordinary writes while allowing reception bursts                                                   |
| `onboarding`       | 6 / hour; 600 / hour    | verified Clerk ID; trusted IP    | shared | High; clinic/Admin provisioning                                                                                    |
| `invitationWrite`  | 12 / hour; 30 / hour    | internal user; authorized clinic | shared | High; invitation email and management abuse across admins                                                          |
| `invitationRead`   | 30 / 5 min; 600 / 5 min | verified Clerk ID; trusted IP    | shared | High; token preview attempts                                                                                       |
| `invitationAccept` | 10 / hour; 600 / hour   | verified Clerk ID; trusted IP    | shared | High; token acceptance attempts                                                                                    |
| `provider`         | 20 / min; 300 / hour    | internal user; authorized clinic | shared | High; Geoapify geocoding/routing and location-changing writes                                                      |
| `provisioning`     | 3 / hour; 5 / hour      | internal user; authorized clinic | shared | High; sample-data creation                                                                                         |

The IP ceiling is intentionally high because a proxy or NAT may represent many users. It is an additional abuse brake, not the primary authenticated identity. Invitation revocation uses the ordinary mutation policy so an admin can revoke an invitation even after the invitation-send quota is exhausted. `provider` charges patient create/update and clinic update even if an individual request does not invoke Geoapify; this conservatively covers conditional external calls. Normal appointment-triggered rule-based prediction is charged only to the appointment mutation, not a second prediction policy.

### Actual route inventory

Risk is the abuse risk of repeated calls, not the sensitivity of the medical record itself. `Staff+` means active Admin or Staff; `Admin` means active Admin. Clinic route parameters are checked against `req.user.clinicId` before shared clinic quotas. Routes without a clinic parameter use user or Clerk identity quotas. The table lists all 58 registered API routes (including the health route and disabled standalone clinic creation).

| Method and mounted path                                               | Auth                                 | Risk   | Cost                                  | Route policy                         |
| --------------------------------------------------------------------- | ------------------------------------ | ------ | ------------------------------------- | ------------------------------------ |
| GET `/api/health`                                                     | Public                               | Low    | health                                | none; exempt from application limits |
| GET `/api/auth/onboarding-status`                                     | Clerk                                | Medium | DB                                    | identityRead                         |
| POST `/api/auth/onboarding/clinic`                                    | Clerk                                | High   | DB, optional Geoapify/sample data     | onboarding                           |
| GET `/api/auth/me`                                                    | active user                          | Low    | DB                                    | identityRead + general               |
| POST `/api/clinics`                                                   | Admin                                | Low    | disabled (405)                        | general only; no work performed      |
| GET `/api/clinics/:clinicId/lifecycle-impact`                         | Admin; service checks clinic         | Medium | DB                                    | collection                           |
| POST `/api/clinics/:clinicId/deactivate`                              | Admin; service checks clinic         | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/restore`                                 | Admin; service checks clinic         | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId`                                          | Admin; clinic access                 | Medium | DB                                    | collection                           |
| PATCH `/api/clinics/:clinicId`                                        | Admin; clinic access                 | High   | DB, conditional Geoapify              | provider                             |
| POST `/api/clinics/:clinicId/geocode`                                 | Admin; clinic access                 | High   | Geoapify                              | provider                             |
| POST `/api/clinics/:clinicId/sample-data`                             | Admin; clinic access                 | High   | bulk DB records                       | provisioning                         |
| POST `/api/clinics/:clinicId/doctors`                                 | Staff+; clinic access                | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId/doctors`                                  | Staff+; clinic access                | Medium | DB collection                         | collection                           |
| PATCH `/api/clinics/:clinicId/doctors/:doctorId`                      | Staff+; clinic access                | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId/doctors/:doctorId`                        | Staff+; clinic access                | Medium | DB                                    | collection                           |
| GET `/api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact`       | Admin; clinic access                 | Medium | DB                                    | collection                           |
| DELETE `/api/clinics/:clinicId/doctors/:doctorId`                     | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/doctors/:doctorId/restore`               | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId/doctors/:doctorId/availability`           | Staff+; clinic access                | Medium | DB                                    | collection                           |
| PUT `/api/clinics/:clinicId/doctors/:doctorId/availability`           | Staff+; clinic access                | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/patients`                                | Staff+; clinic access                | High   | DB, conditional Geoapify              | provider                             |
| POST `/api/clinics/:clinicId/patients/:patientId/route`               | Staff+; clinic access                | High   | Geoapify                              | provider                             |
| PATCH `/api/clinics/:clinicId/patients/:patientId`                    | Staff+; clinic access                | High   | DB, conditional Geoapify              | provider                             |
| POST `/api/clinics/:clinicId/patients/:patientId/geocode`             | Staff+; clinic access                | High   | Geoapify                              | provider                             |
| GET `/api/clinics/:clinicId/patients`                                 | Staff+; clinic access                | High   | sensitive DB collection, max 100/page | collection                           |
| GET `/api/clinics/:clinicId/patients/:patientId`                      | Staff+; clinic access                | Medium | DB                                    | collection                           |
| GET `/api/clinics/:clinicId/patients/:patientId/lifecycle-impact`     | Admin; clinic access                 | Medium | DB                                    | collection                           |
| DELETE `/api/clinics/:clinicId/patients/:patientId`                   | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/patients/:patientId/restore`             | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/appointments`                            | Staff+; clinic access                | Medium | DB, internal prediction               | mutation                             |
| GET `/api/clinics/:clinicId/appointments/available-slots`             | Staff+; clinic access                | Medium | DB                                    | collection                           |
| GET `/api/clinics/:clinicId/appointments`                             | Staff+; clinic access                | Medium | bounded DB collection                 | collection                           |
| PATCH `/api/appointments/:appointmentId/status`                       | Staff+; service checks object clinic | Medium | DB                                    | mutation                             |
| GET `/api/appointments/:appointmentId/activities`                     | Staff+; service checks object clinic | Medium | DB                                    | collection                           |
| GET `/api/appointments/:appointmentId/reschedule-slots`               | Staff+; service checks object clinic | Medium | DB                                    | collection                           |
| PATCH `/api/appointments/:appointmentId/reschedule`                   | Staff+; service checks object clinic | Medium | DB, internal prediction               | mutation                             |
| GET `/api/clinics/:clinicId/queue`                                    | Staff+; clinic access                | Medium | DB/polling                            | queueRead                            |
| PATCH `/api/clinics/:clinicId/queue/reorder`                          | Staff+; clinic access                | Medium | DB                                    | mutation                             |
| PATCH `/api/clinics/:clinicId/queue/:queueEntryId/status`             | Staff+; clinic access                | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId/dashboard/summary`                        | Staff+; clinic access                | Medium | aggregation                           | dashboard                            |
| GET `/api/clinics/:clinicId/dashboard/high-risk-appointments`         | Staff+; clinic access                | Medium | aggregation                           | dashboard                            |
| GET `/api/clinics/:clinicId/dashboard/no-show-intelligence`           | Staff+; clinic access                | Medium | aggregation                           | dashboard                            |
| GET `/api/clinics/:clinicId/dashboard/today-activity`                 | Staff+; clinic access                | Medium | aggregation                           | dashboard                            |
| GET `/api/clinics/:clinicId/staff`                                    | Admin; clinic access                 | Medium | DB enumeration                        | collection                           |
| PATCH `/api/clinics/:clinicId/staff/:userId/status`                   | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/staff/invitations/:invitationId/resend`  | Admin; clinic access                 | High   | DB/email                              | invitationWrite                      |
| GET `/api/clinics/:clinicId/staff/invitations`                        | Admin; clinic access                 | Medium | DB enumeration                        | collection                           |
| POST `/api/clinics/:clinicId/staff/invitations`                       | Admin; clinic access                 | High   | DB/email                              | invitationWrite                      |
| PATCH `/api/clinics/:clinicId/staff/invitations/:invitationId/revoke` | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| GET `/api/clinics/:clinicId/staff/:userId`                            | Admin; clinic access                 | Medium | DB                                    | collection                           |
| PATCH `/api/clinics/:clinicId/staff/:userId`                          | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| DELETE `/api/clinics/:clinicId/staff/:userId`                         | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| POST `/api/clinics/:clinicId/staff/:userId/restore`                   | Admin; clinic access                 | Medium | DB                                    | mutation                             |
| GET `/api/staff/invitations/:token`                                   | Clerk                                | High   | token lookup                          | invitationRead                       |
| POST `/api/staff/invitations/:token/accept`                           | Clerk                                | High   | token claim/DB                        | invitationAccept                     |
| GET `/api/predictions/:predictionId/feedback`                         | Staff+; service checks object clinic | Medium | DB                                    | collection                           |
| PUT `/api/predictions/:predictionId/feedback`                         | Staff+; service checks object clinic | Medium | DB                                    | mutation                             |

There is no separate HTTP prediction regeneration, bulk export, general geocoding, or routing-matrix endpoint. Prediction refresh is an internal worker; dataset export is a CLI and outside HTTP rate-limit scope. Clerk-hosted sign-in/sign-up and webhooks are not registered in this Express app. `OPTIONS` preflight is exempt. The root `/` welcome handler is outside `/api`, reads no data, and has no route quota.

## Architecture and operation

- Keys use `pravaah:rl:v1:<policy>:<scope>:<window>:<SHA-256 identity>`. Raw Clerk IDs, internal user IDs, clinic IDs, emails and invitation tokens are absent from counter keys. The server obtains Clerk IDs from `getAuth`, internal user/clinic IDs from the database, and IP from Express's configured proxy trust chain. IPv4-mapped IPv6 is normalized to IPv4; native IPv6 is grouped by /64.
- `TRUST_PROXY_CIDRS` is optional and defaults to trusting **no** forwarded headers. Set only exact verified ingress proxy networks, separated by commas. Broad wildcard trust is rejected. Until configured, an ingress proxy's socket IP may group users; the high IP ceilings reduce accidental blocking. Do not blindly set `trust proxy = true` or trust arbitrary `X-Forwarded-For` values.
- Shared counters use one atomic PostgreSQL `INSERT ... ON CONFLICT ... DO UPDATE ... RETURNING` statement. Expired windows reset in that statement; a background hourly delete removes expired rows. No Redis service is required. Provision the migration before deploying code. PostgreSQL counter writes add DB load; monitor it.
- A policy with two rules checks them in table order. A rejection by the first rule does not consume the second rule; a rejection by the second has already consumed the first. Retries count as attempts. This deliberate, conservative behavior prevents free repeated probing. Independent atomic row updates prevent oversubscription for each individual rule; the pair is not a single atomic transaction.
- Shared-store failures return 503 `RATE_LIMIT_UNAVAILABLE` before the controller, including on onboarding, invitations and provider calls. General/identity-read local counter failures allow the low-cost request. A quota rejection returns 429 `RATE_LIMIT_EXCEEDED` with integer `Retry-After` seconds. Neither response exposes keys, user information or token validity. Logs contain policy/scope only, without high-cardinality identities.
- `RATE_LIMIT_LIMITS` optionally overrides maxima with comma-separated `policy.scope=positiveInteger` entries, for example `provider.user=30,provider.clinic=500`. Unknown, duplicate, zero or excessive values fail startup. Windows live in the policy source. Test and deploy overrides consistently to all instances. Lowering a max takes effect on the next request; existing windows retain their expiry.
- Unit tests use local counters in `NODE_ENV=test` unless `RATE_LIMIT_TEST_SHARED=1`; the security CI job sets that flag and runs against its isolated PostgreSQL service. Production always uses shared counters for shared policies.
- The general local limiter is per process and does not provide a fleet-wide ceiling. Shared PostgreSQL policies do. For multiple instances or high sustained abuse, a dedicated counter store or edge protection may be warranted. This implementation avoids adding a new service while the actual backend deployment scale and traffic are unverified.

## Deployment and verification

Apply the checked-in migration during the normal pre-deploy step. Do not point tests at production. The isolated security workflow runs PostgreSQL migrations and `tests/security/rateLimit.integration.test.ts`, plus focused HTTP policy tests. Inspect `rate_limit.rejected` and `rate_limit.store_error` events and database counter volume after deployment. Compare 429 rates with queue/appointment workload, then adjust maxima in `RATE_LIMIT_LIMITS` if staff activity approaches them. Provider maxima should be reconciled with the actual Geoapify plan before relying on them as a cost cap.

Local verification on 2026-10-31: eight focused policy/HTTP tests and one route-coverage test passed. The isolated PostgreSQL 16 migration and 73-test security suite passed with shared counters enabled, including a 24-request concurrent counter test across two independent Prisma clients. A repeated suite run also passed after clearing test-owned quota keys during fixture reset. The backend unit suite passed 522 tests with two existing skips; the existing frontend regression selection passed 43 tests. TypeScript, Prisma validation and the server build passed. The server lint script currently only prints "server lint not configured yet". Docker/PostgreSQL were disposable and no production database was accessed.

Commands executed from the repository root, except `prisma validate` from `apps/server`:

```text
npm run test -w apps/server
npm run build:server
npm run check -w apps/server
npm run lint -w apps/server
npm run test -w apps/web -- src/features/patients/PatientsPage.test.tsx src/features/doctors/DoctorsPage.test.tsx src/features/appointments/AppointmentsPage.test.tsx src/components/ui/RiskExplanation.test.tsx
npx prisma validate
NODE_ENV=test SECURITY_TEST_MODE=1 DATABASE_URL=<isolated PostgreSQL URL> TEST_DATABASE_URL=<same URL> npm run security:migrate -w apps/server
NODE_ENV=test SECURITY_TEST_MODE=1 RATE_LIMIT_TEST_SHARED=1 DATABASE_URL=<isolated PostgreSQL URL> TEST_DATABASE_URL=<same URL> npm run test:security -w apps/server
```

The isolated database was PostgreSQL 16 in a disposable Docker container. Remote GitHub Actions execution and production traffic behavior remain unverified locally.

## Remediation status and remaining limits

SEC-H-01 is **partially remediated locally**. The application has route coverage, shared quotas for sensitive operations, trusted identity keys, 429/503 contracts and automated tests. Production deployment and live traffic behavior were not verified. Before claiming full remediation, apply the migration through the established deploy process, verify the configured proxy network if client IP attribution is needed, confirm the actual backend instance count and Geoapify quota, and observe 429/503 rates during clinic use. Invalid bearer tokens still reach Clerk verification before an application quota is available; health and the root welcome route remain unrestricted. There is no standalone HTTP bulk export or prediction regeneration endpoint to protect. General local quotas remain per instance, and rate-limit writes consume PostgreSQL capacity under high request rates.
