# [Resolved] Enforce queue status transition rules

**Suggested label:** `Bug`

## Overview

The v0.3 release charter expected invalid queue lifecycle transitions to fail. Earlier code inspection found that the backend blocked updates from final queue statuses, but otherwise accepted any valid queue status enum sent to `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status` and synchronized the appointment status from that request.

Resolved in v0.4 workflow hardening: queue transition rules now live in `apps/server/src/modules/queues/queue.lifecycle.ts`, are enforced by `queue.service.ts`, and are guarded in `queue.repository.ts` by exact current queue and appointment statuses.

## Tasks

- [x] Define the approved queue transition map.
- [x] Enforce the transition map server-side.
- [x] Keep appointment synchronization consistent with supported queue status changes.
- [x] Add tests for valid transitions, skipped transitions, reversals, and final-state conflicts.
- [ ] Add route-facing coverage for direct API attempts that bypass frontend button visibility.

## Acceptance Criteria

- Direct API requests cannot skip or reverse unsupported non-final queue states.
- Final queue states remain protected.
- Appointment status synchronization remains correct for supported queue transitions.
- Service/repository/domain tests cover the lifecycle policy and persistence guards. Route-facing coverage remains useful follow-up coverage, but the backend service/repository boundary now enforces the rule.

## Notes

Source evidence:

- `apps/server/src/modules/queues/queue.validation.ts`
- `apps/server/src/modules/queues/queue.lifecycle.ts`
- `apps/server/src/modules/queues/queue.service.ts`
- `apps/server/src/modules/queues/queue.repository.ts`
- `apps/server/src/modules/queues/__tests__/queue.lifecycle.test.ts`
- `apps/server/src/modules/queues/__tests__/queue.service.test.ts`
- `apps/server/src/modules/queues/__tests__/queue.repository.test.ts`
- `docs/releases/V0.3_RELEASE_CHARTER.md`
