# Public Routes And Fallbacks

## Workflow Summary

| Field                 | Evidence                                                                                                                                                                                                                         |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | Public landing, Clerk auth pages, onboarding redirect, not-found, metadata, public error boundary                                                                                                                                |
| Product status        | Implemented                                                                                                                                                                                                                      |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                                                                                       |
| Actor                 | Public visitor, signed-out user, signed-in user                                                                                                                                                                                  |
| Entry route           | `/`, `/login/*`, `/sign-up/*`, `/onboarding`, `/onboarding/clinic`, `*`                                                                                                                                                          |
| Frontend files        | `apps/web/src/App.tsx`, `main.tsx`, `routes/RouteMetadata.tsx`, `routes/NotFoundPage.tsx`, `features/public/PublicLandingPage.tsx`, `features/auth/LoginPage.tsx`, `SignUpPage.tsx`, `components/public/PublicErrorBoundary.tsx` |
| Main frontend symbols | `AppRoutes`, `PublicRouteBoundary`, `RouteLoadingFallback`, `RouteScrollRestoration`, `RouteMetadata`, `PublicLandingPage`, `LoginPage`, `SignUpPage`, `NotFoundPage`                                                            |
| API endpoint          | Public landing and not-found do not call API. Login/sign-up are Clerk UI flows. Onboarding page calls auth endpoints after Clerk sign-in                                                                                         |
| Middleware            | Not applicable until API call                                                                                                                                                                                                    |
| Authentication        | Public pages do not require internal Pravaah user                                                                                                                                                                                |
| Authorization         | Protected application routes are nested under `ProtectedAppShell`                                                                                                                                                                |
| State changes         | Route metadata and scroll restoration; auth state handled by Clerk                                                                                                                                                               |
| Tests                 | `App.test.tsx`, `siteMetadata.test.ts`, public route behavior indirectly covered                                                                                                                                                 |
| Known gaps            | SPA metadata is route-driven client-side; repository does not contain deployed production origin verification                                                                                                                    |

## Route Table

| Route                      | Component                            | Behavior                                                                          |
| -------------------------- | ------------------------------------ | --------------------------------------------------------------------------------- |
| `/`                        | `PublicLandingPage`                  | Public landing route in `PublicRouteBoundary`                                     |
| `/login/*`                 | `LoginPage`                          | Clerk sign-in UI route                                                            |
| `/sign-up/*`               | `SignUpPage`                         | Clerk sign-up UI route                                                            |
| `/onboarding`              | `Navigate to /onboarding/clinic`     | Public route redirect                                                             |
| `/onboarding/clinic`       | `ClinicOnboardingPage`               | Requires Clerk sign-in; checks onboarding status                                  |
| Protected dashboard routes | `ProtectedAppShell` then `AppLayout` | Requires Clerk session, completed onboarding, active internal user, active clinic |
| `*`                        | `NotFoundPage`                       | Public fallback                                                                   |

## Public Route Trace

```text
Browser opens /
    ↓
main.tsx -> ClerkProvider, ApiAuthProvider, ToastProvider, App
    ↓
App.tsx -> BrowserRouter
    ↓
RouteMetadata updates document metadata
    ↓
RouteScrollRestoration runs on pathname changes
    ↓
AppRoutes route match /
    ↓
PublicRouteBoundary
    ↓
PublicErrorBoundary
    ↓
Suspense fallback RouteLoadingFallback while lazy chunk loads
    ↓
PublicLandingPage
```

## Auth Page Trace

```text
Visitor opens /login/* or /sign-up/*
    ↓
AppRoutes lazy-loads LoginPage or SignUpPage
    ↓
ClerkProvider configuration from main.tsx supplies:
      signInUrl = /login
      signUpUrl = /sign-up
      signInFallbackRedirectUrl = /dashboard
      signUpFallbackRedirectUrl = /onboarding/clinic
      afterSignOutUrl = /login?signout=success
    ↓
Clerk handles session UI
    ↓
After auth, protected route gate checks onboarding/internal user state
```

## Protected Route Fallbacks

`ProtectedAppShell` renders:

- full-page loading while Clerk or onboarding status is loading
- redirect to `/login?redirect_url=...` when signed out
- redirect to `/onboarding/clinic?redirect_url=...` when onboarding is `NOT_STARTED`
- recovery screen when internal state is inconsistent
- retryable error state when onboarding status cannot load
- `ActiveClinicProvider` and `AppLayout` when ready

`ActiveClinicProvider` renders:

- loading state while `/auth/me` loads
- missing clinic state when authenticated profile cannot yield a valid active clinic
- error state for API failures
- active clinic context when ready

## Deployment Route Behavior

`apps/web/vercel.json` rewrites non-API paths to `/index.html`:

```json
{
    "rewrites": [
        {
            "source": "/((?!api(?:/|$)).*)",
            "destination": "/index.html"
        }
    ]
}
```

This supports direct loads of SPA routes on Vercel. The repository does not record a verified production origin.

## How To Explain This Workflow

Public routes are a React SPA shell with Clerk auth pages. The protected app is not just hidden navigation: it is guarded by Clerk session state, onboarding status, internal user status, and active clinic resolution before operational routes render.
