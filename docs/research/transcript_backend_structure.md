# Pravaah Backend Structure Notes

## Purpose

This research note captures the final backend structure for Pravaah so the implementation stays feature-module based instead of drifting into a layer-only layout.

## Final Decision

Pravaah uses a feature-module backend architecture inside `apps/server/src`.

```txt
apps/server/src
├── modules
│   ├── auth
│   ├── clinics
│   ├── doctors
│   ├── patients
│   ├── appointments
│   ├── queues
│   └── users
├── middleware
├── config
├── utils
├── app.ts
└── server.ts
```

## Why This Structure Fits Pravaah

Clinic workflows are feature-heavy. Keeping each feature together makes it easier to evolve appointment, queue, doctor, and patient logic without scattering a single feature across many top-level folders.

## Module Pattern

Each module can contain the files it needs:

```txt
modules/appointments/
├── appointment.routes.ts
├── appointment.controller.ts
├── appointment.service.ts
├── appointment.repository.ts
├── appointment.validation.ts
└── appointment.types.ts
```

## Feature Scope Examples

- `auth` handles Clerk verification and app-user mapping.
- `clinics` handles clinic profiles and clinic-scoped settings.
- `doctors` handles doctor profiles and clinic assignments.
- `patients` handles patient profiles and clinic history.
- `appointments` handles booking, updates, and lifecycle changes.
- `queues` handles the live working queue for the day.
- `users` handles internal clinic staff and admin records.

## Rules

- Do not create top-level `routes`, `controllers`, `services`, or `repositories` folders.
- Keep business logic in services.
- Keep database access in repositories.
- Keep request parsing in controllers.
- Keep shared middleware in `middleware`.

## Deprecated Ideas

The following are legacy ideas and should not be used as the current implementation model:

- legacy workspace structure
- layer-first backend folders as the main structure
- legacy auth strategy from the rejected MVP path
- legacy project-management examples
