# Deployment

## Current Status

The v0.1.0 MVP is recorded as completed and deployed in the release freeze record, but this repository still does not contain live deployment URLs or real production credentials.

Use placeholders in public docs until the actual Vercel URL, Render URL, deployed commit SHAs, and GitHub release URL are confirmed. See `docs/releases/V0_1_0_MVP_FREEZE.md`.

## Frontend Deployment Options

The frontend is a Vite app and can be deployed to a static frontend host such as:

- Vercel
- Netlify
- Cloudflare Pages
- Render static site

Build command:

```bash
npm run build:web
```

Output:

```txt
apps/web/dist
```

Required frontend env vars:

```txt
VITE_API_BASE_URL=https://<backend-host>/api
VITE_CLERK_PUBLISHABLE_KEY=<production publishable key>
VITE_DEFAULT_CLINIC_ID=<optional demo fallback UUID>
```

## Backend Deployment Options

The backend is an Express app and can be deployed to a Node host such as:

- Render
- Railway
- Fly.io
- a VPS/container platform

Build command:

```bash
npm install --production=false && npm run build --workspace apps/server
```

Pre-deploy command:

```bash
npm run prisma:migrate:deploy --workspace apps/server
```

Start command:

```bash
npm run start --workspace apps/server
```

Required backend env vars:

```txt
NODE_ENV=production
CLIENT_URL=https://<frontend-host>
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=<production secret key>
```

Render provides `PORT` for Web Services. The backend falls back to `5000` when `PORT` is not set for local runs.

## Database Environment

Use PostgreSQL. Hosted options such as Neon are acceptable, but the code only requires a valid PostgreSQL `DATABASE_URL`.

Deployment steps:

```bash
cd apps/server
npx prisma generate
npx prisma migrate deploy
```

Use `migrate deploy` for production-style environments. Use `migrate dev` for local development.

## Clerk Production Setup

Checklist:

- create or configure a Clerk production application
- set frontend allowed origins/redirect URLs
- use production `VITE_CLERK_PUBLISHABLE_KEY`
- use production `CLERK_SECRET_KEY` only on the backend
- create internal Pravaah `User` rows that map production Clerk user IDs
- make sure internal users are `ACTIVE` and linked to the intended active clinic

## CORS Setup

Backend CORS uses:

```txt
CLIENT_URL
```

Set it to the deployed frontend origin exactly, for example:

```txt
CLIENT_URL=https://pravaah.example.com
```

## Seed Data Warning

`npm run seed:demo` creates demo data. Do not run it against production unless the deployment is intentionally a demo environment.

For production-like use, create real clinic and internal user rows through a controlled admin process or one-time script.

## Environment Checklist

Frontend:

- `VITE_API_BASE_URL`
- `VITE_CLERK_PUBLISHABLE_KEY`
- optional `VITE_DEFAULT_CLINIC_ID`

Backend:

- `PORT`
- `CLIENT_URL`
- `DATABASE_URL`
- `CLERK_SECRET_KEY`

Seed-only:

- `SEED_CLERK_USER_ID`
- `SEED_STAFF_CLERK_USER_ID`
- `SEED_DEMO_CLINIC_ID`

## Build Checklist

Before release:

```bash
npm install
npm run build:web
npm run build:server
npm run test -w apps/server
```

The root `npm run check` runs build and lint. It may write build outputs, so be mindful during docs-only changes.

## Post-Deployment Smoke Test

1. Open frontend URL.
2. Sign in with Clerk.
3. Confirm dashboard loads.
4. Confirm `GET /api/health` returns healthy.
5. Confirm `GET /api/auth/me` returns the internal active user.
6. Create or list doctors.
7. Create or list patients.
8. Book an appointment.
9. Confirm queue entry appears.
10. Update queue status.
11. Confirm dashboard summary changes.
12. Confirm no backend secrets are exposed in frontend environment.

## Deployment Limitations

- No Dockerfile is present.
- No CI/CD deployment workflow is present.
- No production logging/monitoring setup is present.
- No migrations runbook beyond Prisma commands is automated.
- No screenshots or production URL are documented.
