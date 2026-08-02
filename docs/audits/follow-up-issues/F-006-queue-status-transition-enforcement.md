# [Bug] Enforce queue status transition rules

**Suggested label:** `Bug`

## Overview

The v0.3 release charter expects invalid queue lifecycle transitions to fail. Code inspection found that the backend currently blocks updates from final queue statuses, but otherwise accepts any valid queue status enum sent to `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status` and synchronizes the appointment status from that request.

## Tasks

- Define the approved queue transition map.
- Enforce the transition map server-side.
- Keep appointment synchronization consistent with supported queue status changes.
- Add tests for valid transitions, skipped transitions, reversals, and final-state conflicts.
- Add route-facing coverage for direct API attempts that bypass frontend button visibility.

## Acceptance Criteria

- Direct API requests cannot skip or reverse unsupported non-final queue states.
- Final queue states remain protected.
- Appointment status synchronization remains correct for supported queue transitions.
- Tests cover both service behavior and controller/route-facing behavior where appropriate.

## Notes

Source evidence:

- `apps/server/src/modules/queues/queue.validation.ts`
- `apps/server/src/modules/queues/queue.service.ts`
- `apps/server/src/modules/queues/queue.repository.ts`
- `apps/server/src/modules/queues/__tests__/queue.service.test.ts`
- `docs/releases/V0.3_RELEASE_CHARTER.md`
