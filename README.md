# Pravaah

Pravaah is an AI-assisted clinic flow management app for small and medium clinics. It helps clinic-side Admin and Staff users manage clinic setup, doctors, patients, appointments, today's queue, dashboard activity, and starter no-show risk scoring.

The no-show feature is rule-based and explainable. It is not trained machine learning.

## Release Status

| Track             | Status                                                                                                              |
| ----------------- | ------------------------------------------------------------------------------------------------------------------- |
| Frozen baseline   | `v0.1.0` MVP complete and preserved as a historical release record                                                  |
| Current candidate | `v0.2.0` Public Demo and Self-Service Clinic Onboarding                                                             |
| Publication state | Documentation prepared; release verification, deployment URL confirmation, and screenshot capture are still pending |

Do not treat `v0.2.0` as fully released until the owner runs the verification checklist in [v0.2 Release Notes](docs/releases/V0_2_0_RELEASE_NOTES.md).

## Current Capabilities

- Public landing page plus Clerk sign-in and sign-up routes.
- Onboarding-aware routing for signed-out, unprovisioned, active Admin, active Staff, and recovery states.
- Identity-only onboarding status API for valid Clerk users without internal Pravaah accounts.
- Transactional clinic plus first Admin provisioning with server-owned role/status/clinic authority.
- Optional fictional sample data scoped to the newly created clinic.
- Functional Admin clinic settings page.
- First-run setup checklist.
- Doctor create/list/edit workflows.
- Patient create/list/edit workflows with clinic-specific history fields.
- Appointment booking, filtering, listing, status updates, and queue entry creation.
- Queue listing, filtering, status updates, and manual reorder controls.
- Dashboard summary, high-risk appointments, and activity feed.
- Stored `NoShowPrediction` results with reasons and suggested staff actions.
- Prisma/PostgreSQL schema, migrations, and local demo seed data.
- Backend, frontend, and API-level automated tests where implemented. Browser-based end-to-end testing is intentionally deferred to a future release.

## Tech Stack

| Layer      | Technology                    |
| ---------- | ----------------------------- |
| Monorepo   | npm workspaces                |
| Frontend   | React + TypeScript + Vite     |
| Styling    | Tailwind CSS                  |
| Backend    | Express + TypeScript          |
| Auth       | Clerk                         |
| Database   | PostgreSQL                    |
| ORM        | Prisma                        |
| Validation | Zod                           |
| Testing    | Vitest, React Testing Library |

## Repository Structure

```txt
pravaah/
├── apps/
│   ├── web/              # React/Vite frontend
│   └── server/           # Express API, Prisma schema, migrations, seed
├── docs/
│   ├── product/          # Product scope, roles, workflows, decisions
│   ├── architecture/     # System, API, database, auth, frontend/backend structure
│   ├── guides/           # Setup, deployment, testing, troubleshooting, demo, contributing
│   ├── scope/            # v0.2 scope and roadmap
│   ├── releases/         # Historical and candidate release notes
│   ├── interview/        # Interview prep and workflow walkthroughs
│   ├── engineering/      # Code organization and consistency audit
│   ├── ai/               # Guardrails for future AI assistants
│   └── assets/           # Demo asset manifests and screenshot placeholders
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

2. Create local env files from the checked-in examples.

    ```txt
    .env
    apps/web/.env
    apps/server/.env
    ```

3. Generate Prisma and run local migrations from the backend workspace.

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

See [Setup](docs/guides/SETUP.md) for Clerk, database, seed, and local environment details.

## Main Scripts

| Command                | Purpose                                                 |
| ---------------------- | ------------------------------------------------------- |
| `npm run dev:web`      | Start Vite frontend.                                    |
| `npm run dev:server`   | Start Express backend with `tsx watch`.                 |
| `npm run build:web`    | Build frontend.                                         |
| `npm run build:server` | Build backend.                                          |
| `npm run lint`         | Run workspace lint scripts.                             |
| `npm run format`       | Format the repo with Prettier. Writes files.            |
| `npm run check`        | Run workspace build/check scripts. Writes build output. |
| `npm run test:web`     | Run frontend Vitest tests.                              |
| `npm run test:server`  | Run backend Vitest tests.                               |
| `npm run seed:demo`    | Seed local demo clinic data.                            |

For docs-only review, prefer a non-writing check first:

```bash
npx prettier --check README.md "docs/**/*.md"
```

## Documentation

Start with [docs/README.md](docs/README.md).

Key docs:

- [Product MVP Boundary](docs/product/MVP.md)
- [v0.2 Scope](docs/scope/V0_2_SCOPE.md)
- [v0.2 Release Notes](docs/releases/V0_2_0_RELEASE_NOTES.md)
- [Demo Guide](docs/guides/DEMO_GUIDE.md)
- [Setup](docs/guides/SETUP.md)
- [Testing](docs/guides/TESTING.md)
- [Deployment](docs/guides/DEPLOYMENT.md)
- [Troubleshooting](docs/guides/TROUBLESHOOTING.md)
- [Architecture](docs/architecture/ARCHITECTURE.md)
- [API Reference](docs/architecture/API_REFERENCE.md)
- [Auth And Security](docs/architecture/AUTH_AND_SECURITY.md)
- [Interview Pack](docs/interview/README.md)
- [AI Context](docs/ai/AI_CONTEXT.md)

## Verified From Source Inspection

The current source tree contains the implementation paths for public routing, sign-up, onboarding status, transactional clinic/Admin provisioning, orphan prevention, onboarding UI, sample data, onboarding-aware routing, clinic settings, first-run checklist, doctor edit, patient edit, queue reorder, and Render-safe backend build output.

This Codex session did not run test suites, builds, deployments, migrations, or browser screenshot capture. Those remain owner release gates.

## Known Limitations

- No patient login or doctor login.
- No billing, prescriptions, inventory, or full medical record system.
- No WhatsApp/SMS/email automation.
- No trained ML model.
- No full multi-clinic SaaS membership model; current authorization uses one active `User.clinicId`.
- No committed real screenshots yet; screenshot slots are documented in [v0.2 Assets](docs/assets/v0.2/README.md).
- No verified public frontend/backend deployment URLs are recorded in the repository.

## Demo Flow

```txt
Public landing
-> Clerk sign-up
-> onboarding status NOT_STARTED
-> create clinic
-> optional sample data
-> dashboard
-> clinic settings
-> doctor edit
-> patient edit
-> appointment booking
-> queue status and manual reorder
```

Use [Demo Guide](docs/guides/DEMO_GUIDE.md) for the scripted walkthrough and [v0.2 Assets](docs/assets/v0.2/README.md) for screenshot capture requirements.
