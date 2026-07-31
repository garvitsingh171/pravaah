# Deployment

## Current Status

The v0.1.0 MVP is recorded as completed and deployed in the release freeze record, but this repository still does not contain live deployment URLs or real production credentials.

`v0.2.0` is a release candidate. Use placeholders in public docs until the actual Vercel URL, Render URL, deployed commit SHAs, screenshot assets, and GitHub release URL are confirmed. See [v0.2 Release Notes](../releases/V0_2_0_RELEASE_NOTES.md).

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

For Vercel projects whose root directory is `apps/web`, `apps/web/vercel.json` rewrites non-API browser routes to `index.html` for React Router refresh support.

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

The backend build script cleans `dist`, runs Prisma generation, and compiles with `tsconfig.build.json`. That production build config excludes tests and test helpers so Render-style deployments do not emit stale `*.test.js` or `*.spec.js` files.

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
- allow public sign-up and onboarding routes for the frontend origin
- for manually provisioned demo accounts, create internal Pravaah `User` rows that map production Clerk user IDs
- for self-service onboarding, verify the onboarding API creates the first active Admin transactionally

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
npx prettier --check README.md "docs/**/*.md"
npm run lint
npm run test:web
npm run test:server
npm run test:e2e
npm run build:web
npm run build:server
npm run check
find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)
```

The `find` command should produce no emitted test files after the backend build. The root `npm run check` runs build and lint and may write build output, so be mindful during docs-only changes.

## Post-Deployment Smoke Test

1. Open frontend URL while signed out and confirm the public landing page renders.
2. Sign up with Clerk.
3. Confirm `GET /api/auth/onboarding-status` returns `NOT_STARTED`.
4. Create a clinic through onboarding.
5. Optionally provision sample data.
6. Confirm dashboard loads as the first Admin.
7. Confirm `GET /api/health` returns healthy.
8. Confirm `GET /api/auth/me` returns the internal active user and clinic.
9. Update clinic settings as Admin.
10. Create or list doctors, then edit one.
11. Create or list patients, then edit one.
12. Book an appointment.
13. Confirm queue entry appears.
14. Update queue status and manually reorder active entries.
15. Confirm dashboard summary changes.
16. Confirm no backend secrets are exposed in frontend environment.

## Deployment Limitations

- No Dockerfile is present.
- No CI/CD deployment workflow is present.
- No production logging/monitoring setup is present.
- No migrations runbook beyond Prisma commands is automated.
- No verified screenshots or production URL are documented yet.
