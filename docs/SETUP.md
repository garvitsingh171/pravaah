<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah Setup Guide

## 1. Purpose

This guide explains how to set up Pravaah for local development.

It is written for:

- beginner contributors
- future maintainers
- AI coding assistants
- reviewers/interviewers who want to understand the project workflow

## 2. Required tools

Install or create access to:

| Tool                   | Purpose                                          |
| ---------------------- | ------------------------------------------------ |
| Node.js                | JavaScript runtime for frontend/backend tooling. |
| npm                    | Package manager and workspace runner.            |
| Git                    | Version control.                                 |
| GitHub account         | Repository, issues, pull requests, projects.     |
| VS Code                | Recommended editor.                              |
| Neon account           | PostgreSQL database hosting.                     |
| Clerk account          | Authentication provider.                         |
| Postman/Thunder Client | Optional API testing.                            |
| psql/pgAdmin           | Optional database inspection.                    |

## 3. Clone repository

```bash
git clone <repo-url>
cd pravaah
```

## 4. Install dependencies

```bash
npm install
```

The repository uses npm workspaces.

Expected workspace structure:

```txt
apps/web
apps/server
packages/*
```

## 5. Environment files

Create local environment files from examples.

Typical files:

```txt
.env
apps/web/.env
apps/server/.env
```

Exact structure can evolve, but secrets must never be committed.

## 6. Environment variables

### 6.1 Root/common

```txt
NODE_ENV=development
```

### 6.2 Frontend

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_DEFAULT_CLINIC_ID=optional_demo_clinic_uuid
```

Only public frontend-safe values should use the `VITE_` prefix.
Put these values in `apps/web/.env` for the Vite dev server.

`VITE_DEFAULT_CLINIC_ID` is an MVP/demo fallback clinic context. For signed-in
users, the web app resolves active clinic context in this order:

1. The authenticated internal Pravaah user returned by `GET /api/auth/me`, when
   that user has a `clinicId` linked to an active clinic.
2. `localStorage` key `pravaah.activeClinicId`, when a clinic has been selected.
3. `VITE_DEFAULT_CLINIC_ID`, for local/demo usage.

The backend remains the final authority. Every clinic-scoped API still checks
that the Clerk-authenticated internal user is ACTIVE and belongs to the requested
clinic. A stale or incorrect `localStorage` clinic ID will be rejected by the
backend.

Restart the Vite dev server after changing `apps/web/.env`; Vite reads
`VITE_*` environment variables when the dev server starts.

`VITE_DEFAULT_CLINIC_ID` must be a PostgreSQL UUID-shaped value. It does not
need to be a specific UUID version, but it must match an existing active clinic
when used.

### 6.3 Backend

```txt
PORT=5000
CLIENT_URL=http://localhost:5173
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret_if_used
```

Backend secrets must not be exposed to frontend.
Put these values in `apps/server/.env` for the Express server and Prisma seed.

### 6.4 Local seed/bootstrap

Clerk authenticates the person, but Pravaah still requires an internal `User`
row for role, status, and clinic access. For local development, seed the first
admin user with your own Clerk user ID:

```txt
SEED_CLERK_USER_ID=user_xxxxxxxxxxxxxxxxx
SEED_USER_EMAIL=local-admin@pravaah.local
SEED_USER_FULL_NAME=Local Pravaah Admin
SEED_DEMO_CLINIC_ID=00000000-0000-4000-8000-000000000000
```

`SEED_CLERK_USER_ID` is required when running the seed. `DEV_CLERK_USER_ID` is
also accepted as a local alias. Find the value in the Clerk dashboard by opening
your development Clerk application, going to Users, selecting your signed-in
user, and copying the user ID that starts with `user_`.

The seed creates an active demo clinic and an active internal `ADMIN` user linked
to that clinic. Keep `VITE_DEFAULT_CLINIC_ID` in `apps/web/.env` equal to
`SEED_DEMO_CLINIC_ID` when you want a demo fallback, or leave it unset and let
the frontend use the authenticated user's active `clinicId` from `GET /api/auth/me`.

Run the seed from `apps/server`. The seed loads `apps/server/.env`, validates
`SEED_DEMO_CLINIC_ID` as a PostgreSQL UUID-shaped value, and prints the clinic id
to copy into `apps/web/.env` if you use `VITE_DEFAULT_CLINIC_ID`.

The seeded user must have `status=ACTIVE` and `clinicId` set. The related clinic
must exist and have `isActive=true`. If you need to inspect these values locally,
run Prisma Studio from `apps/server` and check the `User` and `Clinic` tables.

## 7. Neon PostgreSQL setup

Steps:

1. Create a Neon account.
2. Create a project/database.
3. Copy the PostgreSQL connection string.
4. Put it in backend `.env` as `DATABASE_URL`.
5. Use Prisma migrations to create schema.

Important:

- Use a development database for local work.
- Do not use production credentials locally unless necessary.
- Never commit database URLs.

## 8. Clerk setup

Steps:

1. Create a Clerk application.
2. Copy frontend publishable key.
3. Copy backend secret key.
4. Add frontend key to `apps/web/.env`.
5. Add backend key to `apps/server/.env`.
6. Configure allowed origins/redirect URLs when deploying.

Clerk handles identity.

Pravaah backend still handles app roles and clinic permissions.

## 9. Prisma setup

Prisma should live in the backend workspace.

Suggested location:

```txt
apps/server/prisma/schema.prisma
```

Initialize Prisma when backend workspace is ready:

```bash
cd apps/server
npx prisma init
```

After schema is defined:

```bash
npx prisma migrate dev
npx prisma generate
npx prisma db seed
```

Useful commands:

```bash
npx prisma studio
npx prisma validate
npx prisma format
```

## 10. Running the app locally

Expected future commands from repository root:

```bash
npm run dev
npm run dev:web
npm run dev:server
```

Expected local URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
```

## 11. Repository scripts

Expected root scripts:

```bash
npm install
npm run format
npm run lint
npm run build
npm run check
```

Possible meaning:

| Script   | Purpose                                     |
| -------- | ------------------------------------------- |
| `format` | Run Prettier formatting.                    |
| `lint`   | Run lint checks across workspaces.          |
| `build`  | Build frontend and backend.                 |
| `check`  | Run build + lint or project quality checks. |
| `dev`    | Start development servers.                  |

If a script fails because the workspace is still being scaffolded, document that clearly in the PR notes.

## 12. Development workflow

1. Pick or create an issue.
2. Create a focused branch.
3. Make a small change.
4. Run format/check commands.
5. Commit with a clear message.
6. Push branch.
7. Open pull request.
8. Fill PR checklist honestly.
9. Review and merge after acceptance criteria are met.

## 13. Branch naming examples

```txt
docs/align-mvp-ai-database
setup/add-workspace-skeleton
backend/init-express-server
database/add-prisma-core-schema
feature/add-appointment-api
ai/add-starter-no-show-scoring
frontend/add-queue-screen
fix/queue-status-transition
```

## 14. Commit message examples

```txt
docs: align MVP AI scope and database model
setup: add npm workspace skeleton
backend: initialize express typescript server
database: add prisma schema for MVP entities
feat: add appointment booking API
ai: add starter no-show risk scoring service
fix: prevent appointment slot conflict
```

## 15. Local development order

Follow this order:

```txt
1. Root workspace
2. Backend workspace
3. Prisma schema
4. Database connection
5. Auth middleware
6. Core APIs
7. Frontend workspace
8. UI screens
9. Deployment
```

Do not start with advanced frontend polish before backend data flow exists.

## 16. Troubleshooting

### 16.1 Workspace not found

Check:

- `apps/web/package.json` exists
- `apps/server/package.json` exists
- root `package.json` has correct workspaces

### 16.2 Prisma cannot connect

Check:

- `DATABASE_URL` is correct
- Neon database is active
- network access works
- `.env` is loaded from correct workspace

### 16.3 Clerk auth fails

Check:

- frontend uses publishable key
- backend uses secret key
- allowed origins are configured
- token is sent from frontend to backend

### 16.4 CORS error

Check:

- backend `CLIENT_URL` matches frontend URL
- frontend `VITE_API_BASE_URL` is correct
- backend CORS middleware is configured

### 16.5 TypeScript build fails

Check:

- missing dependencies
- incorrect path aliases
- wrong tsconfig settings
- generated Prisma client missing

Run:

```bash
npx prisma generate
```

## 17. Security reminders

Never commit:

- `.env`
- real database URL
- Clerk secret key
- production credentials
- patient data dumps

Use `.env.example` for placeholder names only.

## 18. Setup principle

A good setup guide should let a new developer run the project without guessing.

If setup requires hidden knowledge, update this file.
