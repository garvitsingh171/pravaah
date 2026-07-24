# Pravaah v0.1.0 MVP Freeze

## Release Summary

| Field                  | Value                                                     |
| ---------------------- | --------------------------------------------------------- |
| Release name           | Pravaah v0.1.0                                            |
| Status                 | Completed, deployed, and frozen                           |
| Release type           | MVP baseline                                              |
| Next active release    | `v0.2.0` - Public Demo and Self-Service Clinic Onboarding |
| GitHub release         | `<GITHUB_RELEASE_URL>`                                    |
| Vercel deployed commit | `<VERCEL_DEPLOYED_COMMIT_SHA>`                            |
| Render deployed commit | `<RENDER_DEPLOYED_COMMIT_SHA>`                            |
| Database snapshot      | `pravaah-v0-1-0-mvp-freeze-2026-07-24`                    |

This document records the v0.1 MVP baseline before v0.2 onboarding work begins. It must not contain real deployment secrets, database URLs, Clerk keys, or patient data.

## MVP Feature Summary

v0.1.0 includes:

- Clerk sign-in for already provisioned clinic-side Admin and Staff users
- internal Pravaah `User` mapping for role, status, and clinic access
- dashboard summary, high-risk appointments, and today's activity feed
- doctor record create/list/update APIs and create/list frontend workflow
- patient record create/list/update APIs and create/list frontend workflow
- appointment booking, filtering, listing, status updates, queue entry creation, and no-show prediction creation
- queue listing, filtering, status updates, and backend reorder API
- rule-based starter no-show risk scoring stored as `NoShowPrediction`
- Prisma/PostgreSQL schema and demo seed data
- backend Vitest coverage for critical auth, validation, appointment, queue, prediction, and dashboard behavior

## Locked Stack

| Layer      | Technology                |
| ---------- | ------------------------- |
| Monorepo   | npm workspaces            |
| Frontend   | React + TypeScript + Vite |
| Styling    | Tailwind CSS              |
| Routing    | React Router              |
| Backend    | Express + TypeScript      |
| Auth       | Clerk                     |
| Database   | PostgreSQL                |
| ORM        | Prisma                    |
| Validation | Zod                       |
| Testing    | Vitest where configured   |

Do not reinterpret this release as Next.js, Supabase, MongoDB, Firebase, or microservices.

## Deployed Architecture Summary

Expected deployed shape:

```txt
Vercel static frontend
  -> VITE_API_BASE_URL points to Render backend /api

Render Node backend
  -> Express API
  -> Clerk secret key server-side
  -> DATABASE_URL server-side

Neon PostgreSQL
  -> Prisma migrations applied

Clerk
  -> frontend publishable key
  -> backend token verification
```

Deployment reference placeholders:

- Frontend URL: `<VERCEL_FRONTEND_URL>`
- Backend URL: `<RENDER_BACKEND_URL>`
- Vercel deployed commit: `<VERCEL_DEPLOYED_COMMIT_SHA>`
- Render deployed commit: `<RENDER_DEPLOYED_COMMIT_SHA>`
- GitHub release: `<GITHUB_RELEASE_URL>`

## Core Workflow

```txt
Provisioned Admin/Staff signs in with Clerk
  -> backend maps Clerk identity to ACTIVE internal User
  -> active clinic context is resolved
  -> user creates or lists doctors and patients
  -> user books appointment
  -> backend creates appointment, queue entry, and no-show prediction
  -> user manages appointment and queue status
  -> dashboard summarizes clinic activity and risk
```

## Smoke-Test Checklist

Record manual smoke-test evidence here before publishing the release:

- [ ] Frontend loads at `<VERCEL_FRONTEND_URL>`.
- [ ] Backend health endpoint loads at `<RENDER_BACKEND_URL>/api/health`.
- [ ] Provisioned Admin can sign in.
- [ ] `GET /api/auth/me` returns active internal user and clinic context.
- [ ] Dashboard loads summary, high-risk appointments, and activity feed.
- [ ] Doctors list loads and doctor creation works.
- [ ] Patients list loads and patient creation works.
- [ ] Appointment booking creates appointment, queue entry, and no-show prediction.
- [ ] Queue list loads and status updates work.
- [ ] Protected APIs reject signed-out requests.
- [ ] Valid Clerk users without internal provisioning do not get operational clinic access.
- [ ] No real patient data appears in screenshots, seed data, demo assets, or docs.

## Database Baseline

The deployed Pravaah v0.1.0 database state was preserved before v0.2 development.

| Field                              | Value                                                                       |
| ---------------------------------- | --------------------------------------------------------------------------- |
| Provider                           | Neon PostgreSQL                                                             |
| Production branch                  | `production`                                                                |
| Baseline type                      | Manual snapshot                                                             |
| Baseline name                      | `pravaah-v0-1-0-mvp-freeze-2026-07-24`                                      |
| Placeholder alias                  | `<NEON_SNAPSHOT_NAME>`                                                      |
| Created on                         | July 24, 2026                                                               |
| Reason                             | Preserve the deployed MVP state before public sign-up and clinic onboarding |
| Verification                       | Snapshot creation completed successfully                                    |
| Credentials recorded in repository | No                                                                          |

The snapshot must not be restored or deleted during normal development. Restoration should only be performed after confirming a production data-integrity incident.

## Known Limitations

- Public landing and self-service sign-up are not part of v0.1.
- Internal users and clinic access are manually provisioned through seed/admin database work.
- Clinic settings UI is a placeholder page.
- Doctor and patient edit APIs exist, but dedicated frontend edit screens are not implemented.
- Queue reorder API exists, but the frontend does not expose reorder controls.
- No patient login, patient portal, doctor login, or doctor portal.
- No billing, prescriptions, inventory, full medical records, or hospital ERP features.
- No SMS, WhatsApp, email, or voice automation.
- No trained ML. No-show scoring is deterministic rule logic.
- MVP user access is single-clinic through `User.clinicId`, not full multi-clinic SaaS membership.

## Manual Provisioning Limitation

v0.1 requires a project owner or operator to:

1. Create or identify a Clerk user.
2. Seed or create a matching internal Pravaah `User`.
3. Set role to `ADMIN` or `STAFF`.
4. Set status to `ACTIVE`.
5. Assign the correct `clinicId`.

A newly signed-up Clerk user without this internal row must not receive operational app access. That limitation is the main product problem v0.2 addresses.

## v0.1 Hotfix Policy

After freeze, v0.1 should receive only:

- critical security fixes
- production-breaking bug fixes
- data-integrity fixes
- deployment recovery fixes

New public routing, onboarding, sign-up, settings, edit workflows, queue controls, sample data, and demo improvements belong to v0.2.

## Transition To v0.2

Active development now moves to:

```txt
v0.2.0 - Public Demo and Self-Service Clinic Onboarding
```

The active scope source of truth is `docs/V0_2_SCOPE.md`.

v0.2 must preserve v0.1 behavior while adding:

- unauthenticated public entry
- Clerk sign-up
- authenticated-but-unprovisioned state
- onboarding status API
- transactional clinic and first Admin provisioning
- orphan clinic prevention
- isolated sample clinic data
- onboarding-aware routing
- functional clinic settings
- first-run checklist
- onboarding security and tests

## Security And Data-Handling Notes

- Do not commit database URLs, Clerk keys, webhook secrets, API tokens, or production credentials.
- Do not include real patient data in seed files, screenshots, demo notes, tests, or docs.
- Keep `INTERNAL_USER_NOT_FOUND` behavior for normal operational APIs.
- Keep operational clinic, doctor, patient, appointment, queue, dashboard, and prediction APIs protected by internal user, active status, role, and clinic access.
- Do not trust frontend-provided role, status, clinic ID, user ID, or ownership values.
- Public onboarding APIs added in v0.2 must not expose existing clinic data.
