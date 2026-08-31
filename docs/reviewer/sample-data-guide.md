# Safe Sample Data Guide

Use fictional data only for reviewer demos, screenshots, local seeds, and portfolio assets.

## Current Seed Source

The local demo seed lives in [apps/server/prisma/seed.ts](../../apps/server/prisma/seed.ts). Shared fictional definitions live in [sampleData.definitions.ts](../../apps/server/src/modules/clinics/sampleData.definitions.ts).

The seed creates:

- one fictional clinic configured for a normal Bengaluru outpatient day
- one Admin user and one Staff user mapped to configured Clerk IDs
- six fictional doctors
- twenty-four fictional patients
- sixteen appointments for the clinic-local current day
- twenty historical appointments across the previous few weeks
- seven future appointments across the next week
- appointments covering scheduled, confirmed, arrived, in-queue, called, completed, cancelled, and no-show states
- queue entries for today's active and terminal examples
- stored deterministic no-show risk rows

The seed uses `.local` or `.example.test` emails and placeholder phone numbers such as `+91 00000 ...`. The localhost seed keeps visible patient and appointment notes natural for screenshots; onboarding sample-data provisioning may still use internal sample markers in notes so it can detect already provisioned sample records.

Dates are generated relative to clinic-local today using the clinic timezone, currently `Asia/Kolkata`, so rerunning the seed refreshes the scenario for the current local day.

Queue reorder demo note: the localhost seed intentionally creates four active queue entries for the same doctor and clinic-local date. This supports the manual reorder controls without needing to create extra appointments before the demo.

Repeat seed safety: `npm run seed:demo` reuses deterministic doctors, patients, and known demo appointment IDs. Before rebuilding relative-date appointments, it deletes only the matching deterministic demo appointment IDs and their dependent queue/prediction rows. It does not run a database reset or broad delete across unrelated records.

Clerk/Admin reuse: `SEED_CLERK_USER_ID` or `DEV_CLERK_USER_ID` identifies the local development Clerk user. If that internal Pravaah Admin already has a clinic, the seed updates and reuses that clinic instead of forcing the Admin onto a second fixed clinic. The seed does not create or replace Clerk users, and Clerk IDs must stay in local environment files only.

## Demo Clinic

| Field       | Example                          |
| ----------- | -------------------------------- |
| Name        | Pravaah Family Care              |
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
- Do not run `npm run seed:demo` against a production database.
- Prefer `.example.test`, `.local`, placeholder phone numbers, and visibly fictional names.

## Local Seed Commands

```bash
npm run seed:demo
```

Required for sign-in demos:

- `SEED_CLERK_USER_ID` must match a development Clerk user for the Admin to sign in.
- `SEED_STAFF_CLERK_USER_ID` must match a development Clerk user for the Staff user to sign in.

Placeholder internal users do not bypass Clerk.
