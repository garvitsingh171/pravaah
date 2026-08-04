# Pravaah MVP

## Release Status

Pravaah MVP is completed and frozen as `v0.1.0`.

Current product requirements are now maintained in [Product Requirements](../PRD.md). This MVP document is a historical baseline and should not be used as the complete current product definition.

Active development has moved to the `v0.2.0` release candidate:

- Active scope: [V0_2_SCOPE.md](../scope/V0_2_SCOPE.md)
- v0.1 freeze record: [V0_1_0_MVP_FREEZE.md](../releases/V0_1_0_MVP_FREEZE.md)
- v0.2 release notes: [V0_2_0_RELEASE_NOTES.md](../releases/V0_2_0_RELEASE_NOTES.md)

This document remains the historical MVP product boundary. Do not silently expand or remove the original MVP scope.

## One-Line Definition

Pravaah is an AI-assisted clinic flow management MVP for small and medium clinics, focused on clinic-side Admin and Staff users who manage doctors, patients, appointments, today's queue, dashboard data, and starter no-show risk scoring.

The starter no-show feature is rule-based and explainable. It is not a trained machine-learning model.

## Problem Statement

Small and medium clinics often coordinate the clinic day with notebooks, calls, spreadsheets, and messaging apps. That creates avoidable friction when patients miss appointments, arrive late, or need queue changes.

Pravaah targets the operational problem:

```txt
Manual appointment records -> unclear arrivals -> queue confusion -> wasted staff and doctor time
```

## Target Users

| User           | Current implementation                                                                                         |
| -------------- | -------------------------------------------------------------------------------------------------------------- |
| Admin          | Authenticated clinic-side user. Can access Admin-only backend actions such as clinic create/update.            |
| Staff          | Authenticated clinic-side user. Can manage daily doctor, patient, appointment, queue, and dashboard workflows. |
| Patient record | Stored data record only. Patients do not log in during the MVP.                                                |
| Doctor record  | Stored data record only. Doctors do not log in during the MVP.                                                 |

## Main MVP Workflow

```txt
Admin/Staff signs in with Clerk
        |
        v
Backend maps Clerk user to internal ACTIVE User
        |
        v
Active clinic context is resolved
        |
        v
Staff creates Doctor record and Patient record
        |
        v
Staff books Appointment
        |
        v
Backend creates QueueEntry and NoShowPrediction
        |
        v
Staff manages appointment/queue status
        |
        v
Dashboard summarizes clinic activity and risk
```

## Implemented MVP Features

| Area                         | Current implementation                                                                                                                            |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Monorepo                     | npm workspaces with `apps/web`, `apps/server`, and reserved `packages/*`.                                                                         |
| Frontend                     | React + TypeScript + Vite app with Clerk sign-in, protected app shell, active clinic resolution, Tailwind styling, and feature pages.             |
| Backend                      | Express + TypeScript API with feature modules, route/controller/service/repository layering, Zod validation, AppError, and global error handling. |
| Auth                         | Clerk frontend and Express middleware. Protected APIs require Bearer tokens and an internal `User` row.                                           |
| Clinic access                | MVP uses `User.clinicId` as the single active clinic access check.                                                                                |
| Doctor records               | Backend create/list/update; frontend list/search/create/edit. Doctors do not authenticate.                                                        |
| Patient records              | Backend create/list/update; frontend list/search/create/edit with clinic-specific history display. Patients do not authenticate.                  |
| Appointments                 | Backend create/list/status update; frontend booking, filters, list, status actions, and no-show risk detail panels.                               |
| Queue                        | Backend list/status update/reorder; frontend list/filter/status update and manual move controls for active queue entries.                         |
| Dashboard                    | Backend and frontend summary, high-risk appointments, and today's activity feed.                                                                  |
| Starter no-show risk scoring | Rule-based scoring during appointment creation, stored as `NoShowPrediction`, with dashboard backfill for missing active appointment predictions. |
| Testing                      | Vitest tests exist for auth access/middleware, appointments, queues, predictions, dashboard, and validation behavior.                             |

## Historical v0.1 Limitations

- Public sign-up and self-service clinic onboarding are not part of the frozen v0.1 MVP.
- Clinic settings UI was a placeholder in the frozen v0.1 release.
- Doctor and patient edit workflows were not implemented in the frozen v0.1 frontend.
- Queue reorder existed in the backend API but was not exposed in the frozen v0.1 frontend UI.
- No patient login, doctor login, patient portal, or doctor portal.
- No SMS, WhatsApp, email reminder automation, billing, prescriptions, inventory, or full medical records.
- No trained ML model. No-show scoring is deterministic rule logic.
- MVP user access is single-clinic through `User.clinicId`; it is not full multi-clinic SaaS membership.
- There is no shared package code yet; `packages/*` is reserved.

Current v0.2 source now contains public routing, sign-up, onboarding, clinic settings, doctor edit, patient edit, and queue reorder controls. Those are tracked in [v0.2 Release Notes](../releases/V0_2_0_RELEASE_NOTES.md), not retroactively added to the v0.1 MVP boundary.

## Non-Goals

Do not add these to the MVP without an explicit product decision:

- patient login
- doctor login
- billing or payments
- prescriptions
- inventory
- hospital ERP features
- WhatsApp/SMS/email automation
- mobile app
- traffic, weather, or live location prediction
- trained ML no-show prediction
- automatic appointment cancellation
- fully automatic queue reordering
- multi-clinic organization administration

## Demo Scenario

Use the seeded demo data or create similar local data:

1. Sign in as a Clerk user mapped to an ACTIVE internal Admin or Staff user.
2. Confirm the app resolves an active clinic context.
3. Add a doctor record.
4. Add a patient record with optional clinic-specific distance/history details.
5. Book an appointment for today.
6. Confirm the backend returns an appointment, queue entry, and no-show prediction.
7. Open the appointments page and review the risk details.
8. Open the queue page and update the queue status.
9. Open the dashboard and verify summary, high-risk appointments, and activity feed.

## Success Criteria

The MVP is successful when a reviewer can:

- run the frontend and backend locally with documented env vars
- sign in through Clerk with a seeded internal Pravaah user
- understand the Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> NoShowPrediction spine
- book appointments and see queue entries
- update appointment and queue statuses
- explain why no-show scoring is rule-based and advisory
- inspect the Prisma schema and understand the relationships
- find docs that match the implemented code

## Post-MVP Direction

Active post-MVP development is defined by [V0_2_SCOPE.md](../scope/V0_2_SCOPE.md). Later post-v0.2 work can include:

- richer role and permission model
- `ClinicMember` or `UserClinic` for multi-clinic user access
- reminder logs and communication integrations
- patient and doctor portals
- audit logs
- production deployment automation
- analytics and reporting
- trained ML only after enough safe, relevant data exists

## Source Of Truth

For frozen MVP scope, this file is the source of truth. For active v0.2 scope, use [V0_2_SCOPE.md](../scope/V0_2_SCOPE.md). For implementation details, code wins:

- Backend: `apps/server/src`
- Database: `apps/server/prisma/schema.prisma`
- Frontend: `apps/web/src`
