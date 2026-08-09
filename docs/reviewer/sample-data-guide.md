# Safe Sample Data Guide

Use fictional data only for reviewer demos, screenshots, local seeds, and portfolio assets.

## Current Seed Source

The local demo seed lives in [apps/server/prisma/seed.ts](../../apps/server/prisma/seed.ts). Shared fictional definitions live in [sampleData.definitions.ts](../../apps/server/src/modules/clinics/sampleData.definitions.ts).

The seed creates:

- one fictional demo clinic
- one Admin user and one Staff user mapped to configured Clerk IDs
- three fictional doctors
- six fictional patients
- appointments covering scheduled, confirmed, arrived, in-queue, called, completed, cancelled, and no-show states
- queue entries for today's active/terminal examples
- stored deterministic no-show risk rows

The seed uses `.local` or `.example.test` emails, placeholder phone numbers such as `+91 00000 ...`, and explicit sample-data notes.

## Demo Clinic

| Field       | Example                          |
| ----------- | -------------------------------- |
| Name        | Pravaah Demo Family Clinic       |
| Slug        | `pravaah-demo-family-clinic`     |
| City        | Bengaluru                        |
| Timezone    | `Asia/Kolkata`                   |
| Hours       | `09:00` to `18:00`               |
| Slot/buffer | 15-minute slots, 5-minute buffer |

## Demo Roles

| Role    | Current use                                                                                                                              |
| ------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Admin   | Best for full reviewer demo because Admin can onboard, provision sample data, open clinic settings, and run daily workflows.             |
| Staff   | Best for operational workflow review: doctors, patients, appointments, queue, dashboard. Staff cannot access Admin-only clinic settings. |
| Patient | Record only. No login.                                                                                                                   |
| Doctor  | Record only. No login.                                                                                                                   |

## Workflow States To Demonstrate

| State                              | Supported by seed/current schema   |
| ---------------------------------- | ---------------------------------- |
| Scheduled appointment              | Yes                                |
| Confirmed appointment              | Yes                                |
| Arrived appointment                | Yes                                |
| Waiting queue entry                | Yes                                |
| Called queue entry                 | Yes                                |
| Completed appointment/queue entry  | Yes                                |
| Cancelled appointment/queue entry  | Yes                                |
| No-show appointment/queue entry    | Yes                                |
| Low, medium, and high no-show risk | Yes, through deterministic scoring |

## Safe Capture Rules

- Use only local, preview, or demo data.
- Do not use real clinic, patient, doctor, phone, email, address, or medical information.
- Do not show browser URLs containing tokens.
- Do not commit Clerk user IDs from production users.
- Do not run `npm run seed:demo` against a production database unless the environment is intentionally a demo environment.
- Prefer `.example.test`, `.local`, placeholder phone numbers, and visibly fictional names.

## Local Seed Commands

```bash
npm run seed:demo
```

Required for sign-in demos:

- `SEED_CLERK_USER_ID` must match a development Clerk user for the Admin to sign in.
- `SEED_STAFF_CLERK_USER_ID` must match a development Clerk user for the Staff user to sign in.

Placeholder internal users do not bypass Clerk.
