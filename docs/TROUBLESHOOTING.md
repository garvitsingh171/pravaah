# Troubleshooting

## Backend Not Starting

Symptoms:

- `CLERK_SECRET_KEY is not defined`
- `DATABASE_URL is not defined`

Fix:

- create `apps/server/.env`
- add required backend env vars
- restart `npm run dev:server`

## Frontend API Base URL Missing

Symptom:

```txt
Frontend API base URL is not configured.
```

Fix:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
```

Put it in `apps/web/.env` and restart Vite.

## Clerk Token Missing Or Invalid

Symptoms:

- `AUTHENTICATION_REQUIRED`
- `INVALID_AUTH_TOKEN`

Fix:

- sign in through `/login`
- confirm the request includes `Authorization: Bearer <token>`
- confirm backend uses the matching Clerk application secret key
- restart frontend/backend after env changes

## INTERNAL_USER_NOT_FOUND

Meaning:

Clerk authenticated the user, but Pravaah has no internal `User` row for that Clerk user ID.

Fix:

1. Copy the Clerk development user ID from Clerk dashboard.
2. Put it in `apps/server/.env`:

    ```txt
    SEED_CLERK_USER_ID=user_xxxxx
    ```

3. Run:

    ```bash
    npm run seed:demo
    ```

4. Sign in again.

## USER_NOT_ACTIVE

Meaning:

The internal user exists but `status` is not `ACTIVE`.

Fix:

- rerun seed with a real Clerk user ID for Admin
- or update local `User.status` in Prisma Studio

Staff placeholder users are seeded as `INVITED` unless `SEED_STAFF_CLERK_USER_ID` is set.

## CLINIC_ACCESS_DENIED

Meaning:

The authenticated internal user's `clinicId` does not match the route `clinicId`.

Fix:

- confirm `User.clinicId`
- confirm route URL clinic ID
- confirm frontend active clinic source
- align `VITE_DEFAULT_CLINIC_ID` with `SEED_DEMO_CLINIC_ID` for demo fallback

## Active Clinic Is Not Configured

Symptoms:

- frontend shows active clinic missing state
- code `CLINIC_CONTEXT_MISSING`

Fix:

- ensure `GET /api/auth/me` returns `user.clinicId`
- ensure the returned `clinic` exists and `isActive=true`
- seed demo data
- set `VITE_DEFAULT_CLINIC_ID` only for demo fallback

## Prisma Client Missing

Symptoms:

- import failure for `src/generated/prisma/client.js`
- TypeScript cannot resolve generated Prisma files

Fix:

```bash
cd apps/server
npx prisma generate
```

## Database Connection Failure

Symptoms:

- backend throws `DATABASE_URL is not defined`
- Prisma cannot connect
- migrations fail

Fix:

- confirm `apps/server/.env` has `DATABASE_URL`
- confirm database is running/reachable
- run `npx prisma validate`
- run `npx prisma migrate dev` locally

## CORS Failure

Symptoms:

- browser blocks API requests
- backend works through curl but not frontend

Fix:

```txt
CLIENT_URL=http://localhost:5173
```

For deployment, set `CLIENT_URL` to the deployed frontend origin.

## Seed Failure

Common causes:

- missing `DATABASE_URL`
- invalid `SEED_DEMO_CLINIC_ID`
- seed email already belongs to another Clerk user in the database

Fix:

- use PostgreSQL UUID-shaped `SEED_DEMO_CLINIC_ID`
- use unique seed emails
- check `User` table in Prisma Studio

## Build Failure

Frontend:

- run `npm run build -w apps/web`
- check missing Vite env vars only when runtime code requires them
- fix TypeScript/ESLint errors

Backend:

- run `npm run build -w apps/server`
- run `npx prisma generate`
- check imports from generated Prisma client

## API Returns VALIDATION_ERROR

Fix:

- compare request params/query/body to the matching `*.validation.ts`
- check `YYYY-MM-DD` date format for list filters
- check UUID-shaped IDs
- check enum values are uppercase

## Appointment Slot Conflict

Symptom:

```txt
APPOINTMENT_SLOT_CONFLICT
```

Meaning:

The doctor already has an active appointment at the exact scheduled time.

Fix:

- choose a different doctor or time
- verify existing appointment status

## Queue Or Appointment Status Sync Conflict

Symptom:

```txt
STATUS_SYNC_CONFLICT
```

Meaning:

The appointment or queue entry changed while another status update was running.

Fix:

- refresh the page
- retry the action if the current status still allows it
