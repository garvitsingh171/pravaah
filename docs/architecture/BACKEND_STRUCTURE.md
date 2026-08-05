# Backend Structure

Detailed backend request flow, modules, transactions, and database relationships are maintained in the [backend/database LLD section](../LLD.md#backend-database-and-workflow-implementation).

## Package And Scripts

Backend package:

```txt
apps/server
```

Scripts from `apps/server/package.json`:

| Script      | Command                                 |
| ----------- | --------------------------------------- |
| `dev`       | `tsx watch src/server.ts`               |
| `build`     | `tsc`                                   |
| `start`     | `node dist/server.js`                   |
| `check`     | `tsc --noEmit`                          |
| `lint`      | `echo "server lint not configured yet"` |
| `test`      | `vitest run`                            |
| `seed`      | `prisma db seed`                        |
| `seed:demo` | `prisma db seed`                        |

## Server Entry Flow

```txt
src/server.ts
  -> imports app from src/app.ts
  -> imports env from src/config/env.ts
  -> app.listen(env.port)
```

`src/app.ts` builds and exports the Express app.

## App Route Mounting

Source: `apps/server/src/app.ts`.

```txt
/api/health
/api/auth
/api/clinics
/api/clinics   doctors
/api/clinics   patients
/api/clinics   clinic appointment routes
/api           appointment status routes
/api/clinics   queue routes
/api/clinics   dashboard routes
/              welcome route
```

The root `/` welcome route is currently registered after `errorHandler`; API routers are registered before `errorHandler`.

## Middleware Order

Current order:

```txt
clerkMiddleware()
cors({ origin: env.clientUrl })
express.json()
API routers
errorHandler
GET /
```

Feature routes add their own middleware:

```txt
authenticateRequest
validateRequest
requireClinicAccess
requireAdminRole or requireClinicStaffRole
controller
```

Some routes have different order where required by their shape. For example, appointment status update has no `clinicId` route param, so the service verifies clinic access by appointment ID.

## Config Files

| File                   | Responsibility                                                                    |
| ---------------------- | --------------------------------------------------------------------------------- |
| `src/config/env.ts`    | Loads dotenv, requires Clerk server keys, exposes `nodeEnv`, `port`, `clientUrl`. |
| `src/config/prisma.ts` | Requires `DATABASE_URL`, creates PrismaPg adapter, exports Prisma client.         |
| `prisma.config.ts`     | Prisma CLI config for schema, migrations, seed, and datasource URL.               |

## Module Structure

Current modules:

```txt
src/modules/
├── auth/
├── health/
├── clinics/
├── doctors/
├── patients/
├── appointments/
├── queues/
├── predictions/
└── dashboard/
```

Most feature modules use:

```txt
feature.routes.ts
feature.controller.ts
feature.service.ts
feature.repository.ts
feature.validation.ts
feature.types.ts
__tests__/
```

The `predictions` module has service/types/tests only because prediction is called by other workflows instead of exposed as its own route.

## File Responsibilities

| File type    | Responsibility                                                                          |
| ------------ | --------------------------------------------------------------------------------------- |
| Routes       | URL/method registration and middleware composition.                                     |
| Controllers  | Read params/body/validated query, call service, return JSON, pass errors to `next`.     |
| Services     | Business rules, authorization helpers where needed, workflow orchestration, `AppError`. |
| Repositories | Prisma queries and transactions only.                                                   |
| Validation   | Zod schemas for params, query, and body.                                                |
| Types        | TypeScript types inferred from validation schemas or local response shapes.             |

## Auth Middleware Flow

```txt
Authorization header required
  -> must match Bearer <token>
  -> getAuth(req) from Clerk
  -> authService.getActiveUserByClerkUserId(auth.userId)
  -> req.user = internal ACTIVE user summary
```

Common auth errors:

- `AUTHENTICATION_REQUIRED`
- `INVALID_AUTH_TOKEN`
- `INTERNAL_USER_NOT_FOUND`
- `USER_NOT_ACTIVE`

## Access Control Flow

`accessService.verifyClinicAccess`:

1. requires `req.user`
2. requires `User.status = ACTIVE`
3. checks `user.clinicId === clinicId`
4. loads the clinic
5. rejects inactive clinics

Role helpers:

- `requireAdminRole` allows only `ADMIN`
- `requireClinicStaffRole` allows `ADMIN` and `STAFF`

## Error Handling Flow

Expected application errors use `AppError`:

```ts
throw new AppError(404, 'CLINIC_NOT_FOUND', 'Clinic not found');
```

`errorHandler` returns:

```json
{
    "success": false,
    "error": {
        "code": "CLINIC_NOT_FOUND",
        "message": "Clinic not found"
    }
}
```

It also handles:

- malformed JSON
- Clerk/auth 401 errors
- Prisma `P2002` unique constraint errors
- Prisma `P2025` record-not-found errors
- unexpected server errors

## Validation With Zod

`validateRequest` supports:

- `params`
- `query`
- `body`

Parsed body and params replace `req.body` and `req.params`.

Parsed query is stored at:

```txt
res.locals.validatedQuery
```

Validation errors return `400 VALIDATION_ERROR` with field details.

## Prisma Repository Rules

- Keep Prisma calls inside repositories.
- Use services for business decisions.
- Use transactions for multi-write workflows.
- Keep response formatting out of repositories.
- Select only fields needed for responses when possible.
- Use clinic scoping in queries that read clinic data.

## Transaction Rules

Transactions are currently used for:

- creating doctor + doctor-clinic link
- creating patient + patient-clinic link
- booking appointment + queue entry + no-show prediction
- syncing appointment and queue status updates
- queue reordering

Appointment booking also uses PostgreSQL advisory locks to reduce slot and queue-position races.

## Testing Approach

Backend tests use Vitest and mostly mock repositories/services to validate:

- auth middleware behavior
- clinic access checks
- appointment booking workflow
- appointment validation
- queue prediction response mapping
- dashboard summary/backfill/activity behavior
- rule-based prediction scoring

Feature-module tests live in:

```txt
src/modules/<feature>/__tests__/*.test.ts
```

This keeps tests feature-local while keeping production module folders easier to scan. Production builds exclude nested `__tests__` directories through `tsconfig.build.json`.

Run:

```bash
npm run test -w apps/server
```

## How To Add A New Backend Module

1. Create `apps/server/src/modules/<feature>/`.
2. Add route, controller, service, repository, validation, and types files as needed.
3. Define Zod params/query/body schemas.
4. Add auth, validation, role, and clinic access middleware in the route.
5. Put business rules in the service.
6. Put Prisma calls in the repository.
7. Throw `AppError` for expected failures.
8. Register the router in `src/app.ts`.
9. Add focused Vitest coverage under `src/modules/<feature>/__tests__/`.
10. Update `docs/architecture/API_REFERENCE.md`, `docs/architecture/API_STRUCTURE.md`, and any workflow docs.

## How To Debug A Backend Request

1. Check the frontend request URL starts with `VITE_API_BASE_URL`.
2. Check the browser request includes `Authorization: Bearer <token>`.
3. Hit `GET /api/health` to confirm the backend is running.
4. If auth fails, inspect `apps/server/src/modules/auth/auth.middleware.ts`.
5. If access fails, inspect `User.clinicId`, `User.status`, and `Clinic.isActive`.
6. If validation fails, inspect the matching `*.validation.ts`.
7. If business logic fails, inspect the feature service.
8. If data is unexpected, inspect the repository and Prisma schema.
9. Use Prisma Studio for local database inspection.

## What Not To Change Casually

- Do not bypass `authenticateRequest` on protected clinic data.
- Do not trust frontend-provided role or clinic data.
- Do not put Prisma queries in controllers.
- Do not add global route/controller/repository folders.
- Do not remove transaction boundaries from appointment, queue, or link creation workflows.
