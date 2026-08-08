# Authentication Revision

Authentication answers who the user is. Authorization answers what the user may do.

Trace:

```text
Clerk browser session
  -> ApiAuthProvider gets token
  -> apiClient sets Authorization: Bearer token
  -> app.ts clerkMiddleware
  -> auth.middleware.resolveClerkIdentity
  -> authenticateRequest
  -> authService.getActiveUserByClerkUserId
  -> accessService checks active user, role, clinic access
```

Statuses:

- 401 `AUTHENTICATION_REQUIRED`: no token.
- 401 `INVALID_AUTH_TOKEN`: bad/expired token.
- 403 `USER_NOT_ACTIVE`: internal user inactive.
- 403 `ADMIN_REQUIRED`: Staff/non-Admin calls Admin route.
- 403 `CLINIC_ACCESS_DENIED`: wrong clinic.
- 404 `CLINIC_NOT_FOUND`: route clinic missing after access path.

Do not say:

- Clerk handles authorization.
- Frontend route guards are security.
- Doctors/patients can log in.
