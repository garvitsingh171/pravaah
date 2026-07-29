# Frontend Structure

## Package And Scripts

Frontend package:

```txt
apps/web
```

Scripts from `apps/web/package.json`:

| Script    | Command                |
| --------- | ---------------------- |
| `dev`     | `vite`                 |
| `build`   | `tsc -b && vite build` |
| `lint`    | `eslint .`             |
| `preview` | `vite preview`         |
| `check`   | `npm run build`        |

## Entry Point

Source: `apps/web/src/main.tsx`.

Entry flow:

```txt
main.tsx
  -> requires VITE_CLERK_PUBLISHABLE_KEY
  -> ClerkProvider
  -> ApiAuthProvider
  -> ToastProvider
  -> App
```

If `VITE_CLERK_PUBLISHABLE_KEY` is missing, the frontend throws at startup.

## Providers

| Provider               | File                                    | Responsibility                                                    |
| ---------------------- | --------------------------------------- | ----------------------------------------------------------------- |
| `ClerkProvider`        | `main.tsx`                              | Clerk sign-in/session handling.                                   |
| `ApiAuthProvider`      | `app/ApiAuthProvider.tsx`               | Registers Clerk `getToken()` with the shared API client.          |
| `ToastProvider`        | `components/feedback/ToastProvider.tsx` | Success/error toast messages.                                     |
| `ActiveClinicProvider` | `app/ActiveClinicProvider.tsx`          | Fetches current internal user and resolves active clinic context. |

## Routing Structure

Source: `apps/web/src/App.tsx` and `apps/web/src/routes/dashboardRoutes.tsx`.

Routes:

| Path               | Page                                                   |
| ------------------ | ------------------------------------------------------ |
| `/`                | Public landing page                                    |
| `/login/*`         | Clerk sign-in page wrapper                             |
| `/sign-up/*`       | Clerk sign-up page wrapper                             |
| `/onboarding`      | Redirects to clinic onboarding                         |
| `/onboarding/clinic` | First-time clinic onboarding form outside protected app shell |
| `/dashboard`       | Dashboard overview                                     |
| `/doctors`         | Doctor list/search                                     |
| `/doctors/new`     | Doctor create form                                     |
| `/patients`        | Patient list/search                                    |
| `/patients/new`    | Patient create form                                    |
| `/appointments`    | Appointment list/filter/status update and booking form |
| `/queue`           | Today's queue list/filter/status update                |
| `/clinic-settings` | Admin clinic settings load/edit/save workflow          |
| `*`                | Public-safe not found page                             |

`ProtectedAppShell` blocks unauthenticated users and redirects them to `/login?redirect_url=...`.
For signed-in users, it resolves `GET /api/auth/onboarding-status` before mounting
the operational app shell. `NOT_STARTED` redirects to `/onboarding/clinic`,
`RECOVERY_REQUIRED` shows a safe recovery state, and only `COMPLETED` active Admin
or Staff users reach `ActiveClinicProvider` and the existing app layout.
The public landing, auth, and onboarding routes are outside `ProtectedAppShell`.

## Layout Structure

| File                            | Responsibility                                                     |
| ------------------------------- | ------------------------------------------------------------------ |
| `app/AppLayout.tsx`             | Page shell with Sidebar, Topbar, and nested route outlet.          |
| `components/layout/Sidebar.tsx` | Navigation links from route config.                                |
| `components/layout/Topbar.tsx`  | Current page title, role context label, and Clerk sign-out button. |

## Feature Folders

```txt
src/features/
├── auth/
├── dashboard/
├── clinics/
├── doctors/
├── patients/
├── onboarding/
├── appointments/
└── queues/
```

Current pages:

- `PublicLandingPage`
- `LoginPage`
- `SignUpPage`
- `ClinicOnboardingPage`
- `DashboardOverviewPage`
- `ClinicSettingsPage`
- `DoctorsPage`
- `DoctorCreatePage`
- `PatientsPage`
- `PatientCreatePage`
- `AppointmentsPage`
- `QueuePage`

## API Client Design

Source: `apps/web/src/lib/apiClient.ts`.

The shared `apiClient`:

- reads `VITE_API_BASE_URL`
- trims/normalizes request paths
- serializes JSON bodies
- adds `Accept: application/json`
- adds `Content-Type: application/json` when a body is present
- adds `Authorization: Bearer <token>` when a token provider returns a token
- parses the backend `success: true` response shape
- converts backend error responses to `ApiClientError`
- converts aborts and network failures to typed client errors

Feature API files live beside feature pages:

```txt
features/auth/authApi.ts
features/clinics/clinicApi.ts
features/dashboard/dashboardApi.ts
features/doctors/doctorApi.ts
features/patients/patientApi.ts
features/appointments/appointmentApi.ts
features/queues/queueApi.ts
```

## Auth Token Integration

`ApiAuthProvider` calls:

```txt
setApiClientAuthTokenProvider(() => getToken())
```

Feature API calls generally do not pass tokens manually. The shared client gets the active Clerk token through the provider.

`ActiveClinicProvider` explicitly passes an auth token provider for the first current-user fetch.

## Active Clinic Resolution

Source: `apps/web/src/lib/clinicContext.ts`.

Resolution order:

1. authenticated internal user returned by `GET /api/auth/me`, when it has a valid active clinic summary
2. localStorage key `pravaah.activeClinicId`, only when no authenticated profile is available
3. `VITE_DEFAULT_CLINIC_ID`, only when no authenticated profile is available

In normal signed-in use, the authenticated internal user is the expected source. The backend still enforces clinic access.

## Types

Shared frontend types live in:

```txt
src/types/api.ts
src/types/domain.ts
src/types/enums.ts
src/types/index.ts
```

They mirror API/domain concepts but are not generated from Prisma or OpenAPI.

## Feedback Components

```txt
components/feedback/
├── EmptyState.tsx
├── ErrorMessage.tsx
├── FieldError.tsx
├── LoadingState.tsx
├── ToastProvider.tsx
└── toastContext.ts
```

Pages use these for loading, empty, validation, error, retry, success, and toast states.

## Forms

Current forms:

- doctor create form
- patient create form
- appointment booking form

Form behavior:

- simple client-side validation for common mistakes
- backend validation details mapped to field errors when possible
- `ApiClientError` shown through `ErrorMessage` and toast
- create flows navigate back to list pages or refresh data after success

## Error, Loading, And Empty States

Implemented states include:

- full-page loading while Clerk or active clinic context loads
- missing active clinic error state
- API network/auth/validation error display
- retry controls for data-loading failures
- empty states for no doctors, no patients, no appointments, no queue entries, no dashboard data
- toast messages for successful create/status operations

## Current Pages

| Page            | Current behavior                                                                                     |
| --------------- | ---------------------------------------------------------------------------------------------------- |
| Login           | Clerk `SignIn`, safe redirect handling, sign-out toast.                                              |
| Sign Up         | Clerk `SignUp`, then directs signed-in users toward clinic onboarding.                                |
| Clinic Onboarding | Resolves onboarding status, renders first-time clinic form for `NOT_STARTED`, posts clinic bootstrap, offers optional fictional sample data after successful clinic creation, and redirects completed users to the dashboard. |
| Landing         | Public product overview with sign-in/sign-up CTAs and a signed-in continuation CTA to onboarding.    |
| Dashboard       | Fetches summary, high-risk appointments, today activity, and the Admin first-run setup checklist status. |
| Doctors         | Lists doctors, local search, create link.                                                            |
| Doctor Create   | Creates doctor through backend API.                                                                  |
| Patients        | Lists patients from `PatientClinic` API, backend search, create link.                                |
| Patient Create  | Creates patient and clinic link through backend API.                                                 |
| Appointments    | Lists/filter appointments, books appointments, updates appointment status, shows prediction details. |
| Queue           | Lists today's queue, filters by doctor/status, updates queue status, shows first risk details.       |
| Clinic Settings | Loads the active clinic settings, displays the slug read-only, and lets Admins update supported profile and operational fields. |

## How To Add A New Page

1. Create a feature folder or add to an existing one.
2. Add the page component.
3. Add a typed feature API helper if the page calls the backend.
4. Add loading, empty, error, and success states.
5. Add the route to `routes/dashboardRoutes.tsx`.
6. Add navigation only if it should appear in the sidebar.
7. Update docs and tests/manual checks.

## How To Connect A Page To An API

1. Add or reuse a function in `features/<feature>/<feature>Api.ts`.
2. Use `apiClient.get/post/patch/...`.
3. Type the response `data` shape.
4. Use `useActiveClinic()` for clinic-scoped paths.
5. Handle `ApiClientError` separately from unknown errors.
6. Do not trust frontend role or clinic checks as final security.

## UI Limitations

- Clinic settings UI is implemented for Admin profile and operational updates.
- Doctor edit and patient edit screens are not implemented.
- Queue reorder API is not surfaced in the UI.
- Public landing, public sign-up, and first-time clinic onboarding UI exist.
- First-time onboarding includes an optional fictional sample-data decision after clinic bootstrap.
- Protected application routing is onboarding-aware; `ActiveClinicProvider` is mounted only after completed active Admin/Staff onboarding status.
- No frontend automated tests are configured.
- No screenshots are committed.
- Shared types are manually maintained and can drift from backend schemas if not reviewed.

## What Not To Change Casually

- Do not move backend authorization rules into frontend-only checks.
- Do not expose backend secrets through `VITE_*`.
- Do not add patient/doctor login routes during the frozen MVP or v0.2 onboarding scope.
- Do not claim UI support for backend-only features unless the page exists.
