# [Bug] Preserve doctor-scoped queue positions during reorder

**Suggested label:** `Bug`

## Overview

The v0.3 release charter expects queue positions to remain scoped by clinic, doctor, and clinic-local day. Code inspection found that booking assigns positions in that scope, but manual queue reorder fetches all active entries for a clinic/day and rewrites them as one global sequence without a doctor predicate.

## Tasks

- Define the intended reorder scope for the queue API and UI.
- Include doctor scope in reorder validation and persistence.
- Ensure a reorder for one doctor cannot rewrite another doctor's queue positions.
- Add tests for same-day active queues across multiple doctors.
- Update release verification steps to include the multi-doctor reorder scenario.

## Acceptance Criteria

- Queue creation and queue reorder use compatible clinic/doctor/day position scope.
- Reordering one doctor's queue preserves other doctors' active queue positions.
- Direct API requests that mix incompatible doctor scopes are rejected.
- Tests cover successful same-doctor reorder and rejected cross-doctor/global reorder attempts.

## Notes

Source evidence:

- `apps/server/src/modules/appointments/appointment.service.ts`
- `apps/server/src/modules/queues/queue.service.ts`
- `apps/server/src/modules/queues/queue.repository.ts`
- `docs/releases/V0.3_RELEASE_CHARTER.md`
