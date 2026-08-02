# [Bug] Enforce appointment status transition rules

**Suggested label:** `Bug`

## Overview

The v0.3 release charter expects invalid appointment lifecycle transitions to fail. Code inspection found that the backend currently blocks changes away from final appointment statuses, but otherwise accepts any valid status enum sent to `PATCH /api/appointments/:appointmentId/status`.

## Tasks

- Define the approved appointment transition map.
- Enforce the transition map server-side.
- Keep queue synchronization consistent with appointment status changes.
- Add tests for valid transitions, skipped transitions, reversals, and final-state conflicts.

## Acceptance Criteria

- Direct API requests cannot skip or reverse unsupported non-final appointment states.
- Final appointment states remain protected.
- Queue status synchronization still works for supported transitions.
- Tests cover both service behavior and controller/route-facing behavior where appropriate.

## Notes

Source evidence:

- `apps/server/src/modules/appointments/appointment.validation.ts`
- `apps/server/src/modules/appointments/appointment.repository.ts`
- `apps/web/src/features/appointments/AppointmentsPage.tsx`
- `docs/releases/V0.3_RELEASE_CHARTER.md`
