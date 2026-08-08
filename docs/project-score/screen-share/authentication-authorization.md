# Authentication And Authorization Screen-Share Runbook

Reliability status: `PARTIAL`. Browser sign-in depends on Clerk configuration; code-level evidence is reliable.

## Demonstrations

| Case | How to show | Expected behavior | Evidence | Say this |
| --- | --- | --- | --- | --- |
| Unauthenticated protected API | Send request without `Authorization` header. | 401 `AUTHENTICATION_REQUIRED`. | `auth.middleware.ts -> resolveClerkIdentity`, `errorHandler.ts`. | Authentication answers who the user is. |
| Malformed Bearer token | Send `Authorization: Bearer bad`. | 401 `INVALID_AUTH_TOKEN`. | `auth.middleware.ts`. | Clerk verification fails before internal user lookup. |
| Valid Clerk user, no internal User | Use onboarding-only state or explain code. | Normal APIs fail; onboarding status/provisioning are allowed through identity-only middleware. | `authenticateClerkIdentity`, `authenticateRequest`, `auth.routes.ts`. | First-run onboarding is the exception. |
| Admin-only route | Use `/clinic-settings` or `GET/PATCH /api/clinics/:clinicId`. | Staff receives 403 `ADMIN_REQUIRED`. | `clinic.routes.ts`, `requireAdminRole`, `access.service.ts`. | Authorization answers what the user may do. |
| Staff-allowed route | Use appointments/queue. | Admin/Staff allowed if clinic access passes. | `requireClinicStaffRole`. | Daily operations are Admin/Staff. |
| Cross-clinic attempt | Request a different `clinicId`. | 403 `CLINIC_ACCESS_DENIED`. | `verifyClinicAccess`. | Backend clinic scope is authoritative. |
| Missing clinic resource | Request real user clinic ID that does not exist. | 404 `CLINIC_NOT_FOUND` if user clinic matches but clinic row missing. | `verifyClinicAccess`. | 404 is resource absence, not role denial. |

## Do Not Say

- "Clerk handles authorization."
- "The frontend protects the data."
- "A Clerk user automatically has clinic access."
- "Doctors and patients can log in."

## Recovery

If Clerk live config fails, show the source path:

```text
ApiAuthProvider -> apiClient Authorization header
  -> app.ts clerkMiddleware
  -> authenticateRequest
  -> authService internal user lookup
  -> accessService role/clinic checks
```
