# Queue Screen-Share Runbook

Reliability status: `REQUIRES_SETUP`. Queue entries are created during appointment booking, so prepare at least two active same-day appointments for one doctor.

## What To Demonstrate

| Demo | What to explain | Code to open | Model evidence | Follow-up |
| --- | --- | --- | --- | --- |
| Queue listing | Queue is clinic/date scoped and includes appointment/risk context. | `QueuePage.tsx -> loadQueue`, `queueApi.ts -> listTodayQueue`, `queue.routes.ts` | `QueueEntry`, `Appointment`, `NoShowPrediction` | Why date is clinic-local? |
| Status update | Staff manually changes queue status; backend syncs appointment status. | `QueuePage.tsx -> handleStatusUpdate`, `queue.service.ts -> updateQueueStatus`, `queue.repository.ts -> updateQueueEntryStatus` | `QueueStatus`, `AppointmentStatus` enums | What if status changed concurrently? |
| Final status | Completed/cancelled/no-show queue entries cannot update again. | `queue.service.ts -> finalQueueStatuses` | Final statuses in enum | Is every transition strictly enforced? |
| Reorder | Staff moves active entries for one doctor queue. | `QueuePage.tsx -> handleQueueMove`, `queue.service.ts -> reorderQueue` | `QueueEntry.position` | Why one doctor only? |
| Reorder conflict | Backend rejects duplicate, incomplete, final, wrong-date, cross-clinic, or changed queues. | `queue.service.ts`, `queue.repository.ts -> reorderQueueEntries` | Indexes on `QueueEntry` | Is there a unique position constraint? |

## Key Truths

- Queue entries are created during appointment booking, not by a separate arrival endpoint.
- Risk visibility does not automatically reorder the queue.
- Reorder must include all active entries for one doctor and selected clinic-local date.
- Final queue entries are locked from reorder and status update.
- Current code does not fully enforce a strict non-final queue transition graph.

## Recovery

| Failure | What to do | What to say |
| --- | --- | --- |
| Empty queue | Book two appointments first or show queue code path. | Empty queue is a valid state; entries are produced by appointment booking. |
| Reorder disabled | Check whether only one active entry exists or selected entry is final. | The UI blocks invalid reorder before the backend also validates. |
| 409 reorder conflict | Refresh queue and retry. | The system detected the queue changed during reorder. |
| Status update fails | Keep the error visible and show backend mapping. | The UI preserves feedback and the backend returns structured conflict errors. |
