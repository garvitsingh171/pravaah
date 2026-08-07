# Authentication And User Resolution

## Workflow Summary

| Field                 | Evidence                                                                                                                                                                                                                                             |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | Clerk authentication, internal `User` resolution, active clinic resolution, authorized API request                                                                                                                                                   |
| Product status        | Implemented for Admin/Staff clinic-side users                                                                                                                                                                                                        |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                                                                                                           |
| Actor                 | Signed-out visitor, signed-in Clerk identity, active internal Admin or Staff                                                                                                                                                                         |
| Entry route           | `/login/*`, `/sign-up/*`, protected routes under `ProtectedAppShell`                                                                                                                                                                                 |
| Frontend files        | `apps/web/src/main.tsx`, `apps/web/src/App.tsx`, `apps/web/src/app/ApiAuthProvider.tsx`, `apps/web/src/app/ProtectedAppShell.tsx`, `apps/web/src/app/ActiveClinicProvider.tsx`, `apps/web/src/lib/apiClient.ts`, `apps/web/src/lib/clinicContext.ts` |
| Main frontend symbols | `ClerkProvider`, `ApiAuthProvider`, `setApiClientAuthTokenProvider`, `ProtectedAppShell`, `getOnboardingStatus`, `ActiveClinicProvider`, `getCurrentUserProfile`, `resolveActiveClinicContext`                                                       |
| API endpoint          | `GET /api/auth/onboarding-status`, `GET /api/auth/me`, operational endpoints under `/api/clinics/...` and `/api/appointments/...`                                                                                                                    |
| Middleware            | `clerkMiddleware`, `authenticateClerkIdentity`, `authenticateRequest`, `requireClinicAccess`, `requireAdminRole`, `requireClinicStaffRole`                                                                                                           |
| Authentication        | Clerk bearer token verified by `getAuth(req)`                                                                                                                                                                                                        |
| Authorization         | Internal `User.role`, `User.status`, and `User.clinicId` checked by `accessService`                                                                                                                                                                  |
| Clinic scoping        | `accessService.verifyClinicAccess(...)`; appointment-status route resolves clinic through `verifyAppointmentClinicAccess(...)`                                                                                                                       |
| Validation            | Endpoint-specific `validateRequest(...)` for params/query/body                                                                                                                                                                                       |
| Controller            | `auth.controller.ts -> getOnboardingStatusController`, `getCurrentUserController`                                                                                                                                                                    |
| Service               | `auth.service.ts -> getOnboardingStatus`, `getActiveUserByClerkUserId`, `getCurrentUserProfile`; `access.service.ts`                                                                                                                                 |
| Repository            | `auth.repository.ts`, `access.repository.ts`                                                                                                                                                                                                         |
| Database models       | `User`, `Clinic`, and workflow-specific resources                                                                                                                                                                                                    |
| Prisma operations     | `user.findUnique`, `clinic.findUnique`, `appointment.findUnique` for appointment clinic access                                                                                                                                                       |
| Transaction           | None for normal auth/profile reads                                                                                                                                                                                                                   |
| Concurrency control   | Not applicable for auth reads                                                                                                                                                                                                                        |
| State changes         | Frontend gate state only; no DB mutation except onboarding covered separately                                                                                                                                                                        |
| Errors                | `AUTHENTICATION_REQUIRED`, `INVALID_AUTH_TOKEN`, `INTERNAL_USER_NOT_FOUND`, `USER_NOT_ACTIVE`, `CLINIC_ACCESS_DENIED`, `ADMIN_REQUIRED`, `CLINIC_STAFF_REQUIRED`                                                                                     |
| Tests                 | `auth.middleware.test.ts`, `auth.service.test.ts`, `auth.repository.test.ts`, `auth.controller.test.ts`, `access.service.test.ts`, `ProtectedAppShell.test.tsx`, `apiClient.test.ts`                                                                 |
| Known gaps            | No user-management UI; only `ADMIN` and `STAFF` internal roles exist                                                                                                                                                                                 |

## End-To-End Trace

```text
User opens protected route such as /dashboard
    ↓
apps/web/src/App.tsx -> <Route element={<ProtectedAppShell />}>
    ↓
apps/web/src/app/ProtectedAppShell.tsx -> useAuth()
    ↓
if Clerk is not loaded: FullPageLoadingState
if signed out: Navigate to /login?redirect_url=...
    ↓
getOnboardingStatus()
    ↓
apps/web/src/features/onboarding/onboardingApi.ts -> apiClient.get('/auth/onboarding-status')
    ↓
apps/web/src/app/ApiAuthProvider.tsx -> setApiClientAuthTokenProvider(() => getToken())
    ↓
apps/web/src/lib/apiClient.ts -> Authorization: Bearer <Clerk token>
    ↓
apps/server/src/app.ts -> clerkMiddleware()
    ↓
GET /api/auth/onboarding-status
    ↓
apps/server/src/modules/auth/auth.routes.ts -> authenticateClerkIdentity
    ↓
apps/server/src/modules/auth/auth.middleware.ts -> resolveClerkIdentity()
    ↓
@clerk/express getAuth(req)
    ↓
apps/server/src/modules/auth/auth.controller.ts -> getOnboardingStatusController()
    ↓
apps/server/src/modules/auth/auth.service.ts -> getOnboardingStatus(clerkUserId)
    ↓
apps/server/src/modules/auth/auth.repository.ts -> findOnboardingUserByClerkUserId()
    ↓
User exists and is ACTIVE with supported role and active clinic: ready
User missing: onboardingRequired
User inconsistent/inactive/missing clinic: recoveryRequired
```

## Authentication Versus Authorization

Authentication answers: who is this Clerk identity?

Implementation evidence:

- `apps/web/src/main.tsx -> ClerkProvider` configures `/login`, `/sign-up`, and post-auth redirect fallbacks.
- `apps/web/src/app/ApiAuthProvider.tsx -> useAuth().getToken()` gives the API client a token provider.
- `apps/web/src/lib/apiClient.ts -> createApiClient()` adds the bearer token only when one is available.
- `apps/server/src/app.ts -> clerkMiddleware()` installs Clerk request context.
- `apps/server/src/modules/auth/auth.middleware.ts -> resolveClerkIdentity()` requires a bearer-shaped authorization header and authenticated Clerk `userId`.

Authorization answers: what can this internal Pravaah user do?

Implementation evidence:

- `authenticateRequest` calls `authService.getActiveUserByClerkUserId(...)`.
- `getActiveUserByClerkUserId` throws `INTERNAL_USER_NOT_FOUND` if a Clerk identity has no internal `User`.
- It throws `USER_NOT_ACTIVE` unless `User.status` is `ACTIVE`.
- `requireAdminRole` calls `accessService.requireAdmin`.
- `requireClinicStaffRole` accepts `ADMIN` or `STAFF`.
- `requireClinicAccess` verifies `req.user.clinicId === req.params.clinicId`, then loads the clinic and rejects inactive clinics.

## Internal User Cases

| Case                                         | Backend behavior                                                                                               | Frontend behavior                                                     |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| No bearer header                             | `resolveClerkIdentity` throws `AUTHENTICATION_REQUIRED`                                                        | Protected routes redirect to `/login` before most API calls           |
| Invalid/expired bearer token                 | `INVALID_AUTH_TOKEN`                                                                                           | API client surfaces `ApiClientError`; pages show error state          |
| Valid Clerk user, no internal `User`         | `GET /api/auth/onboarding-status` returns `NOT_STARTED`; normal protected APIs throw `INTERNAL_USER_NOT_FOUND` | `ProtectedAppShell` redirects to `/onboarding/clinic`                 |
| Active `ADMIN` or `STAFF` with active clinic | Authorized if clinic matches                                                                                   | `ActiveClinicProvider` renders the app                                |
| Internal user inactive/suspended             | `USER_NOT_ACTIVE` or onboarding `RECOVERY_REQUIRED`                                                            | `ProtectedAppShell` or `ActiveClinicProvider` shows recovery/error UI |
| Cross-clinic attempt                         | `CLINIC_ACCESS_DENIED`                                                                                         | API client error rendered in the current feature page                 |
| Staff opens clinic settings                  | Frontend blocks with Admin error; backend also uses `requireAdminRole`                                         | Settings form is not loaded                                           |

## Active Clinic Resolution

```text
ProtectedAppShell says ready
    ↓
ActiveClinicProvider
    ↓
getCurrentUserProfile({ authToken: () => getToken() })
    ↓
GET /api/auth/me
    ↓
authenticateRequest
    ↓
authService.getCurrentUserProfile(req.user)
    ↓
authRepository.findCurrentUserProfileById(user.id)
    ↓
resolveActiveClinicContext(user)
    ↓
Authenticated user clinic wins if valid and active
    ↓
ActiveClinicReactContext.Provider
    ↓
feature pages read useActiveClinic()
```

`resolveActiveClinicContext` can read localStorage and `VITE_DEFAULT_CLINIC_ID`, but once an authenticated profile is present it only accepts the authenticated user's active clinic. If the authenticated user has a malformed, inactive, missing, or mismatched clinic summary, the provider shows a missing-clinic state instead of falling back to localStorage or environment.

## Route And Middleware Matrix

| Route group                                              | Middleware                                                                                           | Internal user required? | Role check             | Clinic access                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | ----------------------- | ---------------------- | ------------------------------ |
| `GET /api/auth/onboarding-status`                        | `authenticateClerkIdentity`                                                                          | No                      | No                     | No                             |
| `POST /api/auth/onboarding/clinic`                       | `authenticateClerkIdentity`, body validation                                                         | No before creation      | Server creates `ADMIN` | Server creates new clinic      |
| `GET /api/auth/me`                                       | `authenticateRequest`                                                                                | Yes, active             | No extra role check    | Profile includes linked clinic |
| `GET/PATCH /api/clinics/:clinicId`                       | `authenticateRequest`, validation, `requireClinicAccess`, `requireAdminRole`                         | Yes                     | `ADMIN`                | Yes                            |
| Doctor/patient/appointment/queue/dashboard clinic routes | `authenticateRequest`, validation, `requireClinicAccess`, `requireClinicStaffRole`                   | Yes                     | `ADMIN` or `STAFF`     | Yes                            |
| `PATCH /api/appointments/:appointmentId/status`          | `authenticateRequest`, validation, `requireClinicStaffRole`; service calls appointment clinic access | Yes                     | `ADMIN` or `STAFF`     | Via appointment lookup         |

## Error Handling Trace

```text
Service or middleware throws AppError
    ↓
controller next(error) or middleware next(error)
    ↓
apps/server/src/middleware/errorHandler.ts -> errorHandler
    ↓
HTTP JSON: { success: false, error: { code, message } }
    ↓
apps/web/src/lib/apiClient.ts -> ApiClientError
    ↓
feature page error state, field errors, toast, retry, or redirect
```

## How To Explain This Workflow

Clerk proves who the browser user is. Pravaah then maps the Clerk user ID to its own `User` row before operational APIs run. The internal row carries role, status, and clinic membership, so authorization remains server-owned. The onboarding endpoints are special: they require a valid Clerk identity but intentionally allow the internal `User` to be missing so the first clinic and first Admin can be provisioned.
