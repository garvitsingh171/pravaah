# [Refactor] Normalize frontend clinic ID path encoding

**Suggested label:** `Refactor`

## Overview

Most frontend API helpers encode path parameters with `encodeURIComponent`, but clinic settings and onboarding sample-data helpers interpolate `clinicId` directly. Current UUID clinic IDs are expected to work, but consistent encoding reduces drift.

## Tasks

- Update clinic settings API helper paths to encode `clinicId`.
- Update onboarding sample-data API helper path to encode `clinicId`.
- Add or update small API helper tests if existing test structure supports it.

## Acceptance Criteria

- All frontend clinic-scoped API helpers encode route path IDs consistently.
- Existing API paths remain unchanged for normal UUID clinic IDs.
- Tests or focused code inspection confirm the helper output.

## Notes

Source evidence:

- `apps/web/src/features/clinics/clinicApi.ts`
- `apps/web/src/features/onboarding/onboardingApi.ts`
- `apps/web/src/features/doctors/doctorApi.ts`
- `apps/web/src/features/patients/patientApi.ts`
- `apps/web/src/features/appointments/appointmentApi.ts`
- `apps/web/src/features/queues/queueApi.ts`
