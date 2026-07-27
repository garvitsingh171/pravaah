# Auth And Security

## Current Auth Stack

| Layer                    | Implementation                                          |
| ------------------------ | ------------------------------------------------------- |
| Frontend auth UI         | `@clerk/react`                                          |
| Backend Clerk middleware | `@clerk/express`                                        |
| App authorization        | Internal `User` table with role, status, and `clinicId` |
| API auth transport       | `Authorization: Bearer <Clerk token>`                   |

## Clerk Frontend Auth

`apps/web/src/main.tsx` wraps the app in `ClerkProvider`.

`apps/web/src/features/auth/LoginPage.tsx` renders Clerk `SignIn` with:

- path `/login`
- sign-up enabled through `/sign-up`
- safe redirect handling
- sign-out success toast

`apps/web/src/features/auth/SignUpPage.tsx` renders Clerk `SignUp` with a fallback redirect to `/onboarding/clinic`. Sign-up must not grant operational app access until Pravaah creates an internal active `User` and clinic assignment through the backend onboarding flow.

`apps/web/src/features/onboarding/ClinicOnboardingPage.tsx` lives outside `ProtectedAppShell`, requires a Clerk session, reads onboarding status through `/api/auth/onboarding-status`, and posts clinic profile fields to `/api/auth/onboarding/clinic`.

`ProtectedAppShell` uses Clerk `useAuth()`:

- while Clerk is loading, it shows a loading state
- if not signed in, it redirects to `/login`
- if signed in, it renders `ActiveClinicProvider` and the app layout

## Backend Auth Middleware

`apps/server/src/app.ts` registers:

```txt
clerkMiddleware()
```

Protected routes also call:

```txt
authenticateRequest
```

That middleware requires:

1. Authorization header exists.
2. Header matches `Bearer <token>`.
3. Clerk `getAuth(req)` reports an authenticated user ID.
4. Internal Pravaah user exists for that Clerk user ID.
5. Internal user status is `ACTIVE`.

In v0.2, only explicitly onboarding-aware endpoints may stop after Clerk identity verification and allow a missing internal `User`. Normal protected APIs must keep requiring the internal user and active status checks.

## Bearer Token Flow

```txt
Clerk session in browser
  -> useAuth().getToken()
  -> apiClient adds Authorization: Bearer <token>
  -> Express clerkMiddleware parses auth
  -> authenticateRequest checks getAuth(req)
  -> req.user receives internal Pravaah user summary
```

## Internal User Mapping

The internal `User` table stores:

- `clerkUserId`
- `fullName`
- `email`
- `role`
- `status`
- `clinicId`

Seeded demo users must use real Clerk development user IDs if you want to sign in and access protected APIs.

An authenticated Clerk identity without an internal `User` is a valid v0.2 onboarding state only on onboarding-aware endpoints. It is not an Admin, Staff, patient, or doctor role.

## User Status Checks

`authService` and `accessService` reject any non-active internal user.

Statuses:

- `INVITED`: exists but cannot use protected APIs yet
- `ACTIVE`: allowed if role and clinic checks pass
- `SUSPENDED`: not allowed

Common error:

```txt
USER_NOT_ACTIVE
```

## Role Checks

Current backend role helpers:

| Helper                   | Allows           |
| ------------------------ | ---------------- |
| `requireAdminRole`       | `ADMIN` only     |
| `requireClinicStaffRole` | `ADMIN`, `STAFF` |

Admin-only routes:

- `POST /api/clinics` is protected but disabled for standalone creation
- `PATCH /api/clinics/:clinicId`
- `POST /api/clinics/:clinicId/sample-data`

Most workflow routes allow Admin and Staff.

## Clinic Access Checks

MVP rule:

```txt
internalUser.clinicId === requested clinicId
```

`verifyClinicAccess` also checks:

- clinic exists
- clinic is active

Appointment status update uses appointment ID to look up the appointment clinic first, then verifies access to that clinic.

## Why Frontend Is Not Trusted

The frontend can:

- hide routes
- show useful messages
- use active clinic context
- avoid showing impossible actions

The backend must still enforce:

- authentication
- user status
- role
- clinic access
- doctor-clinic and patient-clinic ownership
- appointment/queue status rules

Any browser request can be modified, so frontend checks are not security boundaries.

For v0.2 onboarding, the frontend must not send trusted authority values such as internal role, user status, clinic ownership, or another clinic's ID. The backend must assign the first clinic user as `ADMIN`, `ACTIVE`, and linked to the newly created clinic inside one transaction.

Optional sample-data provisioning runs only after that clinic and Admin exist. The
runtime endpoint requires the normal protected API stack, own-clinic access, and
Admin role, and uses the authenticated internal user as the trusted creator.

## Secrets Handling

Frontend-safe:

```txt
VITE_API_BASE_URL
VITE_CLERK_PUBLISHABLE_KEY
VITE_DEFAULT_CLINIC_ID
```

Server-only:

```txt
DATABASE_URL
CLERK_SECRET_KEY
CLERK_WEBHOOK_SECRET
```

`CLERK_WEBHOOK_SECRET` is listed in `.env.example` but not currently used by the code.

## Patient Data Minimization

The MVP stores operational data:

- contact details
- appointment details
- queue status
- no-show/late-arrival history
- limited notes
- distance from clinic for starter scoring

The MVP does not store:

- prescriptions
- diagnosis history
- full medical records
- billing records
- patient portal credentials

## Current Security Limitations

- No audit logging for sensitive changes.
- No rate limiting middleware.
- Public onboarding API hardening is planned for v0.2 and is not implemented in v0.1.
- No dedicated production logging/monitoring configuration.
- No fine-grained permission model beyond Admin/Staff.
- No multi-clinic membership table.
- No webhook implementation despite env placeholder.
- No documented production security headers beyond standard Express/CORS behavior.

## Future Hardening Ideas

- audit logs for appointment, queue, and user access changes
- rate limiting and request size review
- production logging with redaction
- security headers appropriate to deployment target
- role-per-clinic membership model
- staff invite lifecycle
- stricter CORS origin configuration per environment
- automated dependency/security scanning

## What Not To Change Casually

- Do not bypass `authenticateRequest` on protected routes.
- Do not trust Clerk identity without internal `User` authorization except on explicit onboarding-aware endpoints.
- Do not expose server secrets to Vite.
- Do not accept frontend-provided role values.
- Do not remove clinic access checks from clinic-scoped APIs.
