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
| `npm run test -w apps/server` | Run backend Vitest tests.               |
| `npm run seed:demo`           | Seed local demo clinic data.            |

## Documentation

Start with [docs/README.md](docs/README.md).

Key docs:

- [MVP](docs/MVP.md)
- [Architecture](docs/ARCHITECTURE.md)
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

The MVP spine is implemented locally. Remaining release-readiness work includes deployment setup, full clinic settings UI, frontend edit screens for doctors/patients, optional queue reorder UI, and more frontend/integration tests.

## Known Limitations

- no patient login
- no doctor login
- no billing, prescriptions, inventory, or full medical records
- no WhatsApp/SMS/email automation
- no trained ML
- no full multi-clinic SaaS membership model
- no proven production deployment in the repo
- no committed screenshots yet

## Demo Flow

```txt
Sign in -> dashboard -> add doctor -> add patient -> book appointment
-> view no-show risk -> manage queue status -> refresh dashboard
```

Screenshots placeholder: add screenshots after a stable local or deployed demo flow is captured.
