# Setup

## Required Tools

| Tool                                  | Purpose                                         |
| ------------------------------------- | ----------------------------------------------- |
| Node.js and npm                       | Run workspace scripts and install dependencies. |
| Git                                   | Clone and work with the repo.                   |
| PostgreSQL database                   | Local Postgres or hosted Postgres such as Neon. |
| Clerk account                         | Authentication keys and development users.      |
| Optional: psql or Prisma Studio       | Inspect local database state.                   |
| Optional: Postman/Thunder Client/curl | Manual API testing.                             |

## Clone And Install

```bash
git clone <repo-url>
cd pravaah
npm install
```

The repo uses npm workspaces:

```txt
apps/web
apps/server
packages/*
```

`packages/*` is reserved. There is no active shared package yet.

## Actual Root Scripts

Source: root `package.json`.

| Command                | What it runs                       |
| ---------------------- | ---------------------------------- |
| `npm run dev`          | `npm run dev --workspaces`         |
| `npm run dev:web`      | `npm run dev -w apps/web`          |
| `npm run dev:server`   | `npm run dev -w apps/server`       |
| `npm run build`        | `npm run build --workspaces`       |
| `npm run build:web`    | `npm run build -w apps/web`        |
| `npm run build:server` | `npm run build -w apps/server`     |
| `npm run lint`         | `npm run lint --workspaces`        |
| `npm run format`       | `prettier --write .`               |
| `npm run check`        | `npm run build && npm run lint`    |
| `npm run seed:demo`    | `npm run seed:demo -w apps/server` |

For local development, running frontend and backend in separate terminals is usually clearer:

```bash
npm run dev:web
npm run dev:server
```

## Frontend Scripts

Source: `apps/web/package.json`.

| Command                       | Purpose                        |
| ----------------------------- | ------------------------------ |
| `npm run dev -w apps/web`     | Start Vite dev server.         |
| `npm run build -w apps/web`   | Type-check and build Vite app. |
| `npm run lint -w apps/web`    | Run ESLint.                    |
| `npm run preview -w apps/web` | Preview built frontend.        |
| `npm run check -w apps/web`   | Run frontend build.            |

## Backend Scripts

Source: `apps/server/package.json`.

| Command                                        | Purpose                                       |
| ---------------------------------------------- | --------------------------------------------- |
| `npm run dev -w apps/server`                   | Start Express with `tsx watch src/server.ts`. |
| `npm run build -w apps/server`                 | Generate Prisma Client and compile to `dist`. |
| `npm run start -w apps/server`                 | Run `node dist/server.js`.                    |
| `npm run check -w apps/server`                 | Run `tsc --noEmit`.                           |
| `npm run lint -w apps/server`                  | Prints `server lint not configured yet`.      |
| `npm run test -w apps/server`                  | Run Vitest tests.                             |
| `npm run seed -w apps/server`                  | Run Prisma seed.                              |
| `npm run seed:demo -w apps/server`             | Run Prisma seed.                              |
| `npm run prisma:migrate:deploy -w apps/server` | Run production Prisma migrations.             |

## Environment Files

The repo has a root `.env.example` plus local `.env` files in:

```txt
apps/web/.env
apps/server/.env
```

Never commit real `.env` values. `.gitignore` excludes `.env` and `.env.*` while keeping `.env.example`.

## Environment Variables

Source: `.env.example`, `apps/server/src/config/env.ts`, `apps/server/src/config/prisma.ts`, `apps/server/prisma/seed.ts`, and frontend `import.meta.env` usage.

### Frontend

Put these in `apps/web/.env`:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_DEFAULT_CLINIC_ID=00000000-0000-4000-8000-000000000000
```

`VITE_DEFAULT_CLINIC_ID` is optional and used as an MVP/demo fallback only. The frontend first tries the authenticated internal user's active clinic returned by `GET /api/auth/me`.

### Backend

Put these in `apps/server/.env`:

```txt
PORT=5000
CLIENT_URL=http://localhost:5173
LOCAL_CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_if_used
```

`CLERK_WEBHOOK_SECRET` appears in `.env.example`, but no current source file uses Clerk webhooks.

### Seed Variables

The seed reads `apps/server/.env` and supports:

```txt
SEED_CLERK_USER_ID=user_xxxxxxxxx
DEV_CLERK_USER_ID=user_xxxxxxxxx
SEED_STAFF_CLERK_USER_ID=user_yyyyyyyyy
SEED_USER_EMAIL=local-admin@pravaah.local
SEED_USER_FULL_NAME=Local Pravaah Admin
SEED_STAFF_USER_EMAIL=local-staff@pravaah.local
SEED_STAFF_USER_FULL_NAME=Local Pravaah Staff
SEED_DEMO_CLINIC_ID=00000000-0000-4000-8000-000000000000
```

Use a real Clerk development user ID for `SEED_CLERK_USER_ID` when you want your signed-in user to access protected APIs. Placeholder seed users do not bypass Clerk.

## Database Setup

1. Create a PostgreSQL database.
2. Put the connection string in `apps/server/.env` as `DATABASE_URL`.
3. Run Prisma commands from `apps/server`:

```bash
cd apps/server
npx prisma generate
npx prisma migrate dev
```

Useful commands:

```bash
npx prisma validate
npx prisma format
npx prisma studio
```

Prisma config lives in `apps/server/prisma.config.ts`. The Prisma client is generated to `apps/server/src/generated/prisma`, which is ignored by `apps/server/.gitignore`.

## Seed Demo Data

From the repository root:

```bash
npm run seed:demo
```

Or from `apps/server`:

```bash
npm run seed:demo
```

The seed creates or updates:

- one demo clinic
- one Admin internal user
- one Staff internal user
- three doctors
- six patients
- appointments for yesterday, today, tomorrow, and next week
- six today's queue entries
- stored LOW/MEDIUM/HIGH no-show prediction examples

The seed uses placeholder patient/doctor data only. Do not seed real patient data.

## Running Locally

Terminal 1:

```bash
npm run dev:server
```

Terminal 2:

```bash
npm run dev:web
```

Expected URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
Health:   http://localhost:5000/api/health
```

## Render Backend Deployment

Create a Render Web Service for the backend from this repository.

```txt
Build command: npm install --production=false && npm run build --workspace apps/server
Pre-deploy command: npm run prisma:migrate:deploy --workspace apps/server
Start command: npm run start --workspace apps/server
```

Required backend env vars:

```txt
NODE_ENV=production
DATABASE_URL=postgresql://...
CLERK_SECRET_KEY=...
CLIENT_URL=https://<deployed-frontend-origin>
```

Render provides `PORT`; keep it unset unless you need a local fallback. Never commit real `DATABASE_URL`, `CLERK_SECRET_KEY`, webhook secrets, or production credentials.

## Vercel Frontend Deployment

Create a Vercel project for the React client:

```txt
Root directory: apps/web
Framework preset: Vite
Build command: npm run build
Output directory: dist
```

If building from the monorepo root instead, use:

```bash
npm run build --workspace apps/web
```

Required Vercel environment variables:

```txt
VITE_API_BASE_URL=https://YOUR_RENDER_BACKEND.onrender.com/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
```

`VITE_API_BASE_URL` must point to the deployed Render backend and end with `/api`. Only use Clerk's publishable key in Vercel frontend env vars; do not add `DATABASE_URL`, `CLERK_SECRET_KEY`, webhook secrets, or other backend-only secrets. After Vercel deploys, update the Render backend `CLIENT_URL` to the Vercel frontend URL so CORS accepts browser requests.

## Clerk Setup Notes

1. Create a Clerk application.
2. Put the publishable key in `apps/web/.env`.
3. Put the secret key only in `apps/server/.env`.
4. Create or identify a development user in Clerk.
5. Copy that user's Clerk ID into `SEED_CLERK_USER_ID`.
6. Run the seed so the internal Pravaah `User.clerkUserId` matches the Clerk user.

## v0.2 Onboarding Setup Notes

v0.2 will add public sign-up and self-service clinic onboarding. Exact dashboard values, redirect paths, and additional environment variables should be documented only after they are implemented and confirmed.

Future v0.2 setup work may require:

- Clerk sign-up configuration
- public and onboarding redirect URLs
- frontend and backend environment alignment
- separate development, preview, and production configuration
- CORS alignment between public frontend origins and the backend API

Do not invent or commit real Clerk dashboard values, production URLs, secrets, or patient data while preparing onboarding setup.

## Common Errors And Fixes

| Error                                          | Likely fix                                                                           |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `VITE_CLERK_PUBLISHABLE_KEY is not configured` | Add it to `apps/web/.env` and restart Vite.                                          |
| `CLERK_SECRET_KEY is not defined`              | Add it to `apps/server/.env` and restart the backend.                                |
| `DATABASE_URL is not defined`                  | Add it to `apps/server/.env`.                                                        |
| `INTERNAL_USER_NOT_FOUND`                      | Seed an internal user with your real Clerk user ID.                                  |
| `USER_NOT_ACTIVE`                              | Set the internal user status to `ACTIVE`, usually through the seed or Prisma Studio. |
| `CLINIC_ACCESS_DENIED`                         | Ensure `User.clinicId` matches the route clinic ID.                                  |
| Prisma client import failure                   | Run `npx prisma generate` from `apps/server`.                                        |
| CORS failure                                   | Ensure backend `CLIENT_URL` matches the frontend origin.                             |
| Frontend network error                         | Ensure `VITE_API_BASE_URL` is `http://localhost:5000/api` and backend is running.    |

## Security Reminders

- Keep `DATABASE_URL` and `CLERK_SECRET_KEY` server-side only.
- Only `VITE_*` variables are safe to expose to the browser.
- Do not commit local `.env` files.
- Do not use real patient data in seed files, screenshots, demos, or issues.
- Do not trust frontend role or clinic values; backend authorization is required.
