# Authorization And Security

Authoritative current references: [High-Level Design](../HLD.md), [Product Requirements](../PRD.md), and [Interview Guide](INTERVIEW_GUIDE.md). Do not treat Clerk identity as Pravaah authorization.

## Core Answer

Clerk proves who is signed in. Pravaah decides what that person can access.

Normal operational APIs require:

```txt
Clerk token
-> internal User exists
-> User.status = ACTIVE
-> role is allowed
-> User.clinicId matches route clinicId
```

## Onboarding State

v0.2 adds one special state:

```txt
Clerk session exists
internal Pravaah User does not exist
clinic access does not exist
allowed only on onboarding-aware endpoints
```

This is not an Admin, Staff, patient, or doctor role.

## Server Authority

The backend controls:

- `clerkUserId`
- internal user ID
- role
- status
- clinic ownership
- active clinic access

The frontend may submit clinic profile data, but it must not choose authority fields.

## Important Protections

- Clinic plus first Admin are created in one transaction.
- Standalone clinic creation is disabled for first-run onboarding.
- Duplicate onboarding requests should replay completed state or return a deliberate conflict.
- Sample data is fake and scoped to the authenticated Admin's clinic.
- Operational APIs keep returning `INTERNAL_USER_NOT_FOUND` for valid Clerk users without internal accounts.

## Honest Limitations

- No patient or doctor login.
- No full multi-clinic membership model.
- No production monitoring/audit-log system yet.
- No Clerk webhook implementation despite an env placeholder.

## Current trust and abuse boundaries (HEAD)

Clerk supplies identity; `apps/server/src/modules/auth/auth.middleware.ts` resolves the internal `User` and enforces role, status and clinic access. Identity-only onboarding and invitation preview/acceptance are deliberate exceptions to requiring an existing internal user. A clinic path parameter is untrusted, and an object UUID still needs object-level clinic authorization in the service or repository. `apps/server/src/app.ts` applies Clerk middleware, CORS and JSON parsing before routers and the global error handler. Current route files use `rateLimit(...)` buckets backed by `ApiRateLimitCounter` in Prisma; this limits abuse but does not replace authorization or guarantee idempotency. Staff invitation creation uses `apps/server/src/modules/staff/staff.service.ts` and the email service; the API returns invitation metadata, never the raw invite URL. Do not infer that HEAD has been deployed from these files.
