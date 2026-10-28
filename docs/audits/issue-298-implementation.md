# Issue #298 implementation report

Status: **Implemented with verification limitations.** PR readiness: **draft PR only** until authenticated browser checks are run. No commit, push, PR, deployment, or production migration was performed. Repository migrations were applied only to a disposable `/tmp` PostgreSQL database for verification.

## Existing architecture and confirmed defects

The Live Queue page (`apps/web/src/features/queues/QueuePage.tsx`) calls `listTodayQueue` in `queueApi.ts` for the clinic-local day. Before this change it fetched on mount and manual Refresh only. It displayed a last-updated time after successful reads, but had no automatic polling or stale state. A failed refresh replaced the success state with an error and hid retained rows. Manual reads were not sequenced, so an older response could replace a newer snapshot. Row actions had pending controls and toasts, but no row-level failure message or authoritative reconciliation on failure.

The backend route → Zod validation → controller → service → repository → Prisma flow is in `apps/server/src/modules/queues`. The GET is `/:clinicId/queue?date=...`; status and reorder use PATCH routes. Existing middleware requires authentication, active clinic access, and Admin/Staff role. Status writes use a transaction, exact status guards, and appointment lifecycle checks. Reorder already used a PostgreSQL advisory transaction lock for clinic/doctor/date, checked active membership inside that transaction, and wrote positions in two passes. It did **not** compare the current order with the order observed by the client, so two staff could reorder the same active set and the later stale request could overwrite the first.

## Changes and before/after

| Area               | Before                                                | After                                                                                                                                             |
| ------------------ | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Freshness          | Manual fetch only; no stale warning                   | Foreground poll every 30 seconds, 90-second stale threshold, clinic-time last successful GET and failed attempt, refreshing/failed/no-data states |
| Manual refresh     | Could overlap another read                            | Coalesced while active; pending feedback; older or aborted responses ignored                                                                      |
| Background/network | No visibility or reconnect refresh                    | Poll skips hidden/offline tabs; return and reconnect trigger refresh                                                                              |
| Reorder            | Complete membership checked, observed order unchecked | Client sends complete `expectedQueueEntryIds`; locked transaction compares exact order before writes and returns 409 on mismatch                  |
| Conflict recovery  | Error toast and old local view                        | Explain conflict, retain confirmed view during reload, fetch authoritative order, require a new deliberate move                                   |
| Row status         | Pending control and global feedback                   | Adds observed `expectedStatus`, row-level failure, conflict/uncertainty messaging, and reconciliation read                                        |
| Doctor/clinic      | Existing doctor scope and clinic checks               | Preserved; page state resets on clinic/timezone/day context changes                                                                               |

The server remains authoritative. A successful reorder uses returned positions, then fetches the full clinic queue. Failed or uncertain mutations are never automatically replayed. Status and appointment lifecycle, no-show prediction display, and authorization paths remain in place. No database schema change was needed.

## Modified files

| Path                                                                            | Reason                                                                              |
| ------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| `apps/server/src/modules/queues/queue.validation.ts`                            | Validate observed reorder order and optional observed status.                       |
| `apps/server/src/modules/queues/queue.controller.ts`                            | Pass the observed order into the service.                                           |
| `apps/server/src/modules/queues/queue.service.ts`                               | Reject stale status and membership; pass snapshot to transaction.                   |
| `apps/server/src/modules/queues/queue.repository.ts`                            | Compare order under the existing lock and make tie ordering deterministic.          |
| `apps/server/src/modules/queues/__tests__/queue.validation.test.ts`             | Validate the new reorder request contract.                                          |
| `apps/server/src/modules/queues/__tests__/queue.service.test.ts`                | Verify stale status and service conflict behavior.                                  |
| `apps/server/src/modules/queues/__tests__/queue.repository.test.ts`             | Verify stale order aborts before position writes.                                   |
| `apps/server/src/modules/queues/__tests__/queue.concurrent.integration.test.ts` | Verify concurrent staff reorders against real PostgreSQL transactions.              |
| `apps/web/src/features/queues/queueApi.ts`                                      | Type the observed order and status fields.                                          |
| `apps/web/src/features/queues/QueuePage.tsx`                                    | Add polling, freshness, request sequencing, guarded actions, and recovery feedback. |
| `apps/web/src/features/queues/QueuePage.test.tsx`                               | Exercise freshness, recovery, keyboard move, and status payload behavior.           |
| `docs/architecture/API_STRUCTURE.md`                                            | Document the API concurrency fields and conflicts.                                  |
| `docs/workflows/queue-management.md`                                            | Document the end-to-end queue behavior and limits.                                  |
| `docs/audits/issue-298-implementation.md`                                       | Record implementation evidence and draft PR wording.                                |

## Two-staff example

Staff A and B both load Dr Rao's `[A, B, C]`. B moves C before B and the server commits `[A, C, B]`. A submits a move with `expectedQueueEntryIds: [A, B, C]`. After taking the doctor/date lock, the server reads `[A, C, B]`, returns `QUEUE_REORDER_CONFLICT` (409), and performs no position writes. A's page explains the change, fetches the latest order, and requires A to choose another move. If the recovery GET fails, retained rows are marked unverified and action controls stay disabled until a successful refresh.

## Concurrency and regression verification

- Repository unit test verifies that a changed order after lock acquisition throws `QUEUE_REORDER_CONFLICT` before any position update. Service and Zod tests verify the new request contract, stale status rejection, and incomplete membership conflict.
- Queue page tests cover observed order in the payload, conflict recovery to server order, last-success time preservation on failed refresh, initial failure without a false empty state, hidden-tab staleness, keyboard move controls, status actions, and terminal reasons.
- Full server suite: `npm run test -w apps/server` — 512 passed, 2 skipped (including the database-gated test without its dedicated URL). `npm run build -w apps/server` and `npm run check -w apps/server` passed.
- Real database test: `DATABASE_URL=... QUEUE_INTEGRATION_TEST_DATABASE_URL=... npx vitest run src/modules/queues/__tests__/queue.concurrent.integration.test.ts` against isolated PostgreSQL 16 in `/tmp` — 1 passed. Two concurrent staff requests started from the same order; exactly one committed, the other returned `QUEUE_REORDER_CONFLICT` (409), and a fresh GET matched the winning order. All 26 repository migrations applied successfully to that disposable database.
- Full web suite: `npm run test -w apps/web -- --maxWorkers=2` — 179 passed. Initial unrestricted run had two onboarding test timeouts under concurrent load; isolated onboarding rerun passed 17/17. Queue-specific rerun passed 12/12. `npm run build -w apps/web`, `npm run lint -w apps/web`, and `git diff --check` passed.
- Existing full suites exercise appointment booking/status behavior, queue operations, doctor and clinic validation, and no-show display. Responsive and keyboard behavior have component coverage, but no authenticated browser session was available for manual visual verification.

**F-01:** PASS in automated queue tests; authenticated browser verification remains open. **F-05:** PASS in service/repository and real PostgreSQL concurrency tests. The locked comparison prevented the second staff request from overwriting the first. Authenticated browser verification remains open. No production or persistent database was touched.

## Remaining limits

Polling reports the last completed fetch, not real-time truth. A change can occur immediately after any read; the server's guarded writes remain necessary. A network failure after a commit leaves the mutation result uncertain until a later GET succeeds. Legacy status API callers that omit optional `expectedStatus` retain the existing transaction guards but do not get stale-view detection before service processing. Authenticated desktop/mobile browser checks remain before closing #298.

## Draft PR description

**Title:** `[UX] Improve Queue Freshness, Concurrent Updates and Safe Reordering (#298)`

**Summary:** Add foreground queue polling and last-success/stale states; preserve confirmed rows during failed refresh; reject stale doctor-scoped reorder snapshots under the existing transaction lock; detect stale status actions; reconcile conflicts and uncertain outcomes from the server without replaying mutations. Keep keyboard move controls, clinic authorization, appointment lifecycle, and no-show behavior.

**Verification:** Server 512 passed/2 skipped in the default suite, plus the dedicated two-staff PostgreSQL test passed; web 179 passed. Both builds, server check, web lint, and diff check passed. An initial concurrent web run timed out two onboarding cases; they passed alone and in the bounded-worker full rerun. Authenticated browser verification remains. Keep this PR as draft and reference #298 without `Closes #298` until that check is complete.
