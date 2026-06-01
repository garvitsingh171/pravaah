# Pravaah

Pravaah is a clinic appointment and queue management system for small and medium clinics. It helps staff manage doctors, patients, appointments, and daily queues in one place.

## Locked MVP Stack

- Frontend: React + TypeScript
- Backend: Express + TypeScript
- Authentication: Clerk
- Database hosting: Neon PostgreSQL
- ORM: Prisma
- Monorepo workspace: `apps/web`, `apps/server`, `packages/*`

Supabase is not part of the MVP architecture.

## What Pravaah Solves

Clinics often coordinate appointments with notebooks, calls, and messaging apps. That creates missed appointments, long waits, and confusing queue changes.

Pravaah is designed to help clinic staff:

- manage doctors and patients
- book and update appointments
- track who is next in the live queue
- reduce no-shows
- keep clinic operations organized

## Source Of Truth Docs

- [Architecture](docs/ARCHITECTURE.md)
- [Database Design](docs/DATABASE_DESIGN.md)
- [User Roles](docs/USER_ROLES.md)
- [Roadmap](docs/ROADMAP.md)
- [Setup](docs/SETUP.md)
- [Contributing](docs/CONTRIBUTING.md)

## Repository Layout

```txt
pravaah/
├── apps/
│   ├── web/
│   └── server/
├── packages/
├── docs/
├── .github/
├── README.md
├── package.json
└── .env.example
```

## Current State

This branch focuses on documentation consistency and workspace hygiene. The application code itself is not scaffolded yet.

The workspace packages contain placeholder manifests so repository-level checks can run without waiting for the full app implementation.

## Development Commands

```bash
npm install
npm run check
npm run format
```

## Project Direction

Pravaah is a clinic product, not a project-management app. The main domain terms are:

- clinics
- doctors
- patients
- appointments
- queues
- users
