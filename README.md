# Pravaah

Pravaah is an AI-assisted clinic flow management MVP for small and medium clinics. It helps clinic-side Admin and Staff users manage doctor records, patient records, appointments, today's queue, dashboard activity, and starter no-show risk scoring.

The no-show feature is rule-based and explainable. It is not trained machine learning.

## MVP Features

- Clerk sign-in for clinic-side Admin/Staff users
- internal Pravaah `User` mapping for role, status, and clinic access
- doctor record create/list workflows
- patient record create/list workflows with clinic-specific history
- appointment booking, filtering, listing, and status updates
- queue listing, filtering, and status updates
- backend queue reorder API
- dashboard summary, high-risk appointments, and activity feed
- stored `NoShowPrediction` results with reasons and suggested staff actions
- Prisma/PostgreSQL schema and demo seed data
- backend Vitest coverage for critical service and validation behavior
- frontend Vitest/React Testing Library coverage for onboarding-aware routing
- Playwright E2E scaffolding for public, Clerk sign-up, onboarding, and smoke journeys

## Tech Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Monorepo   | npm workspaces            |
| Frontend   | React + TypeScript + Vite |
| Styling    | Tailwind CSS              |
| Backend    | Express + TypeScript      |
| Auth       | Clerk                     |
| Database   | PostgreSQL                |
| ORM        | Prisma                    |
| Validation | Zod                       |
| Testing    | Vitest where configured   |

## Repository Structure

```txt
pravaah/
├── apps/
│   ├── web/              # React/Vite frontend
│   └── server/           # Express API, Prisma schema, migrations, seed
├── docs/                 # Current documentation source of truth
├── packages/             # Reserved for future shared workspace packages
├── .github/              # Issue templates and PR template
├── .env.example          # Example environment variable names
├── package.json          # Root workspace scripts
└── README.md
```

## Local Quick Start

1. Install dependencies.

    ```bash
    npm install
    ```

2. Create local env files.

    ```txt
    apps/web/.env
    apps/server/.env
    ```

    Use `.env.example` for variable names. Do not commit real secrets.

3. Generate and migrate Prisma from the backend workspace.

    ```bash
    cd apps/server
    npx prisma generate
    npx prisma migrate dev
    ```

4. Seed local demo data from the repo root.

    ```bash
    npm run seed:demo
    ```

5. Run backend and frontend in separate terminals.

    ```bash
    npm run dev:server
    npm run dev:web
    ```

Local URLs:

```txt
Frontend: http://localhost:5173
Backend:  http://localhost:5000
API:      http://localhost:5000/api
Health:   http://localhost:5000/api/health
```

## Main Scripts

| Command                       | Purpose                                 |
| ----------------------------- | --------------------------------------- |
| `npm run dev:web`             | Start Vite frontend.                    |
| `npm run dev:server`          | Start Express backend with `tsx watch`. |
| `npm run build:web`           | Build frontend.                         |
| `npm run build:server`        | Build backend.                          |
| `npm run lint`                | Run workspace lint scripts.             |
| `npm run test:web`            | Run frontend Vitest tests.              |
| `npm run test:server`         | Run backend Vitest tests.               |
| `npm run test:e2e`            | Run Playwright browser E2E tests.       |
| `npm run test -w apps/server` | Run backend Vitest tests.               |
| `npm run seed:demo`           | Seed local demo clinic data.            |

Frontend tests use mocked Clerk and mocked feature APIs for deterministic UI coverage. Playwright E2E tests use Clerk testing helpers, a real backend, and a required dedicated test database; never point `E2E_DATABASE_URL` at production.

## Documentation

Start with [docs/README.md](docs/README.md).

Key docs:

- [MVP](docs/MVP.md)
- [v0.2 Scope](docs/V0_2_SCOPE.md)
- [v0.1.0 MVP Freeze](docs/releases/V0_1_0_MVP_FREEZE.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup](docs/SETUP.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [Backend Structure](docs/BACKEND_STRUCTURE.md)
- [Frontend Structure](docs/FRONTEND_STRUCTURE.md)
- [API Reference](docs/API_REFERENCE.md)
- [Auth And Security](docs/AUTH_AND_SECURITY.md)
- [Workflows](docs/WORKFLOWS.md)
- [Interview Guide](docs/INTERVIEW_GUIDE.md)
- [AI Context](docs/AI_CONTEXT.md)

## Current Status

| Track                  | Status                                                    |
| ---------------------- | --------------------------------------------------------- |
| Current stable release | `v0.1.0` - MVP complete and deployed                      |
| Active development     | `v0.2.0` - Public Demo and Self-Service Clinic Onboarding |

The MVP product boundary is preserved in [docs/MVP.md](docs/MVP.md). Active v0.2 scope is tracked in [docs/V0_2_SCOPE.md](docs/V0_2_SCOPE.md), and the frozen v0.1 release record is in [docs/releases/V0_1_0_MVP_FREEZE.md](docs/releases/V0_1_0_MVP_FREEZE.md).

## Known Limitations

- no patient login
- no doctor login
- no billing, prescriptions, inventory, or full medical records
- no WhatsApp/SMS/email automation
- no trained ML
- no full multi-clinic SaaS membership model
- no committed screenshots yet

## Demo Flow

```txt
Sign in -> dashboard -> add doctor -> add patient -> book appointment
-> view no-show risk -> manage queue status -> refresh dashboard
```

Screenshots placeholder: add screenshots after a stable local or deployed demo flow is captured.
