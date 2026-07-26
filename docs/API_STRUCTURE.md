# API Structure

## API Design Conventions

Pravaah uses REST-style JSON APIs mounted under:

```txt
http://localhost:5000/api
```

Module routes should define paths relative to their mount point. Do not duplicate `/api` inside feature route files.

## Success Response Format

Most successful responses use:

```json
{
    "success": true,
    "message": "Resource fetched successfully",
    "data": {
        "resource": {}
    }
}
```

Some controllers return a shaped result directly under `data`, such as appointment booking and dashboard high-risk responses. The frontend API client requires `success: true` and then returns `data`.

## Error Response Format

Expected errors use:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Human-readable message",
        "details": []
    }
}
```

`details` appears mainly on validation errors.

## Auth Requirements

Public/currently unauthenticated:

- `GET /api/health`
- `GET /`

Planned v0.2 onboarding:

- `GET /api/auth/onboarding-status` requires a valid Clerk identity while allowing the internal `User` to be missing
- `POST /api/auth/onboarding/clinic` requires a valid Clerk identity while allowing the internal `User` to be missing
- completed onboarding retries return the existing completed account instead of creating new records
- unique conflicts during onboarding are followed by a current-identity re-read before returning a safe replay or conflict
- these endpoints must be explicitly onboarding-aware and must not expose operational clinic data

Protected:

- all `/api/auth/me`, clinic, doctor, patient, appointment, queue, and dashboard routes
- `POST /api/clinics` remains protected but is disabled with `STANDALONE_CLINIC_CREATION_DISABLED`

Protected routes require:

```txt
Authorization: Bearer <Clerk session token>
```

The backend then verifies:

1. Clerk token is authenticated.
2. Internal `User` exists for the Clerk user ID.
3. Internal user is `ACTIVE`.
4. Role is allowed.
5. Clinic access is allowed where applicable.

Do not remove `INTERNAL_USER_NOT_FOUND` from normal protected APIs. A missing internal user is allowed only for explicit onboarding endpoints introduced by v0.2.

## Clinic-Scoped APIs

Most clinic data routes include:

```txt
/api/clinics/:clinicId/...
```

The current MVP access rule is:

```txt
req.user.clinicId === req.params.clinicId
```

Appointment status update uses:

```txt
PATCH /api/appointments/:appointmentId/status
```

Because that route does not include `clinicId`, the service loads the appointment and verifies clinic access through `appointment.clinicId`.

## Route Registration Overview

Source: `apps/server/src/app.ts`.

| Mount          | Router                                                           |
| -------------- | ---------------------------------------------------------------- |
| `/api/health`  | `healthRouter`                                                   |
| `/api/auth`    | `authRouter` (`/me`, `/onboarding-status`, `/onboarding/clinic`) |
| `/api/clinics` | `clinicRouter`                                                   |
| `/api/clinics` | `doctorRouter`                                                   |
| `/api/clinics` | `patientRouter`                                                  |
| `/api/clinics` | `clinicAppointmentRouter`                                        |
| `/api`         | `appointmentRouter`                                              |
| `/api/clinics` | `queueRouter`                                                    |
| `/api/clinics` | `dashboardRouter`                                                |

## Validation Flow

Routes call:

```txt
validateRequest({ params, query, body })
```

Behavior:

- valid params replace `req.params`
- valid body replaces `req.body`
- valid query is stored in `res.locals.validatedQuery`
- invalid data returns `400 VALIDATION_ERROR`

## Controller Rules

Controllers should:

- read `req.params`, `req.body`, and `res.locals.validatedQuery`
- call one service function
- return a response with `success`, `message`, and `data`
- call `next(error)` for failures

Controllers should not:

- query Prisma
- duplicate access checks already handled by middleware/services
- build custom error shapes repeatedly

## Service Rules

Services should:

- enforce business rules
- orchestrate workflows
- call repositories
- call auth/access helpers when middleware cannot handle a route shape
- throw `AppError` for expected errors

Examples:

- appointment service validates doctor/patient clinic links, checks slot conflict, generates prediction, creates queue entry
- queue service verifies final queue entries cannot be updated or reordered
- dashboard service backfills missing predictions before reading summary/high-risk data

## Repository Rules

Repositories should:

- contain Prisma reads/writes
- own transaction bodies where appropriate
- use selected includes for response data
- avoid HTTP-specific decisions

Repositories should not:

- trust frontend clinic IDs without service/middleware verification
- throw business-specific HTTP errors unless there is a deliberate local pattern
- format API JSON responses

## AppError Rules

Use `AppError` for expected application failures:

```ts
throw new AppError(
    409,
    'APPOINTMENT_SLOT_CONFLICT',
    'This doctor already has an appointment in this time slot.'
);
```

The global error handler maps `AppError` to the standard error response.

## Known Endpoint Groups

- Health
- Auth/current user
- Auth/onboarding status
- v0.2 clinic bootstrap under `POST /api/auth/onboarding/clinic`
- Clinics; standalone `POST /api/clinics` is disabled, while clinic update remains protected
- Doctors
- Patients
- Appointments
- Queue
- Dashboard

There is no standalone prediction API route. Prediction is generated during appointment booking and dashboard backfill.

## Manual API Testing

1. Start backend:

    ```bash
    npm run dev:server
    ```

2. Check health:

    ```bash
    curl http://localhost:5000/api/health
    ```

3. For protected APIs, sign in through the frontend or Clerk tooling and send a Bearer token.

4. Use seeded IDs from local database for `clinicId`, doctor IDs, patient IDs, appointment IDs, and queue entry IDs.

5. Expect validation failures to include `VALIDATION_ERROR` details.

## Checklist Before Adding A New Endpoint

- Is the endpoint in frozen MVP scope or active v0.2 scope?
- Does it require auth?
- If it accepts a Clerk-authenticated but unprovisioned user, is it explicitly onboarding-aware?
- Does it require Admin only or Admin/Staff?
- Is every clinic-scoped read/write access checked?
- Are params/query/body validated with Zod?
- Is business logic in the service?
- Are Prisma calls in the repository?
- Are expected errors `AppError`s?
- Is transaction behavior needed?
- Does the frontend API client need a new typed function?
- Are docs and tests updated?
