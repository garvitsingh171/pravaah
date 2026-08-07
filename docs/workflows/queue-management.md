# Queue Management

## Workflow Summary

| Field                 | Evidence                                                                                                                                                                                 |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | List today's queue, update queue status, manually reorder active entries                                                                                                                 |
| Product status        | Implemented                                                                                                                                                                              |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                                               |
| Actor                 | Active internal `ADMIN` or `STAFF`                                                                                                                                                       |
| Entry route           | `/queue`                                                                                                                                                                                 |
| Frontend files        | `apps/web/src/features/queues/QueuePage.tsx`, `queueApi.ts`                                                                                                                              |
| Main frontend symbols | `QueuePage`, `loadQueue`, `refreshQueue`, `handleStatusUpdate`, `handleQueueMove`, `listTodayQueue`, `updateQueueStatus`, `reorderQueue`                                                 |
| API endpoint          | `GET /api/clinics/:clinicId/queue?date=YYYY-MM-DD`, `PATCH /api/clinics/:clinicId/queue/:queueEntryId/status`, `PATCH /api/clinics/:clinicId/queue/reorder`                              |
| Middleware            | `authenticateRequest`, `validateRequest`, `requireClinicAccess`, `requireClinicStaffRole`                                                                                                |
| Authentication        | Clerk token plus active internal user required                                                                                                                                           |
| Authorization         | Admin and Staff both allowed                                                                                                                                                             |
| Clinic scoping        | Route `clinicId` plus service checks queue entry clinic on status/reorder                                                                                                                |
| Validation            | `queue.validation.ts -> listQueueQuerySchema`, `updateQueueStatusBodySchema`, `reorderQueueBodySchema`                                                                                   |
| Controller            | `queue.controller.ts -> listQueueByClinicDateController`, `updateQueueStatusController`, `reorderQueueController`                                                                        |
| Service               | `queue.service.ts -> listQueueByClinicDate`, `updateQueueStatus`, `reorderQueue`                                                                                                         |
| Repository            | `queue.repository.ts -> findQueueByClinicDate`, `updateQueueEntryStatus`, `reorderQueueEntries`                                                                                          |
| Database models       | `QueueEntry`, `Appointment`, `Doctor`, `Patient`, `NoShowPrediction`, `Clinic`                                                                                                           |
| Prisma operations     | queue `findMany`, `findUnique`, guarded `updateMany`, reorder position updates, raw date-range SQL                                                                                       |
| Transaction           | Status update and reorder each run in `prisma.$transaction`                                                                                                                              |
| Concurrency control   | Reorder uses PostgreSQL advisory transaction lock per clinic/doctor/date and verifies active set inside transaction                                                                      |
| State changes         | Queue status, appointment status sync, `calledAt`, `completedAt`, queue positions                                                                                                        |
| Errors                | `QUEUE_ENTRY_NOT_FOUND`, `QUEUE_ENTRY_CLINIC_MISMATCH`, `QUEUE_ENTRY_FINAL_STATUS`, `QUEUE_SCOPE_MISMATCH`, `QUEUE_REORDER_INCOMPLETE`, `QUEUE_REORDER_CONFLICT`, `STATUS_SYNC_CONFLICT` |
| Tests                 | `queue.service.test.ts`, `QueuePage.test.tsx`                                                                                                                                            |
| Known gaps            | UI is fixed to today's local browser date; backend supports a `date` query/body but frontend does not expose arbitrary date selection                                                    |

## Queue Listing Trace

```text
User opens /queue
    ↓
QueuePage -> useActiveClinic()
    ↓
todayDate = getTodayDateInputValue()
    ↓
loadQueue()
    ↓
queueApi.listTodayQueue(clinicId, todayDate)
    ↓
GET /api/clinics/:clinicId/queue?date=YYYY-MM-DD
    ↓
authenticateRequest -> validateRequest(params, query)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
queue.controller.ts -> listQueueByClinicDateController()
    ↓
queue.service.ts -> listQueueByClinicDate(req.user, clinicId, date)
    ↓
accessService.verifyClinicAccess(user, clinicId)
    ↓
queue.repository.ts -> findQueueByClinicDate(clinicId, date, clinic.timezone)
    ↓
raw SQL computes clinic-local date range
    ↓
prisma.queueEntry.findMany({ clinicId, appointment.scheduledAt in range, include: appointment, doctor, patient })
    ↓
toNoShowPredictionResponse maps appointment.noShowPrediction into queue response
    ↓
QueuePage stores queueListState and renders filters/status/move controls
```

## Queue Status Trace

```text
User clicks a queue status action
    ↓
QueuePage -> handleStatusUpdate(queueEntry, nextStatus)
    ↓
queueApi.updateQueueStatus(clinicId, queueEntry.id, nextStatus)
    ↓
PATCH /api/clinics/:clinicId/queue/:queueEntryId/status
    ↓
authenticateRequest -> validateRequest(params, body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
queue.controller.ts -> updateQueueStatusController()
    ↓
queue.service.ts -> updateQueueStatus(req.user, clinicId, queueEntryId, status)
    ↓
accessService.verifyClinicAccess(user, clinicId)
    ↓
queueRepository.findQueueEntryById(queueEntryId)
    ↓
reject missing, cross-clinic, or final queue entry
    ↓
map QueueStatus to AppointmentStatus
    ↓
queueRepository.updateQueueEntryStatus(...)
    ↓
prisma.$transaction
    ↓
tx.queueEntry.updateMany({ final-status guard })
    ↓
optional calledAt/completedAt timestamp update
    ↓
tx.appointment.updateMany({ final-status guard })
    ↓
tx.queueEntry.findUniqueOrThrow({ include: queueEntryDetailsInclude })
    ↓
QueuePage shows toast and refreshes queue
```

Queue to appointment status mapping:

| Queue status | Appointment status |
| ------------ | ------------------ |
| `ARRIVED`    | `ARRIVED`          |
| `WAITING`    | `IN_QUEUE`         |
| `CALLED`     | `CALLED`           |
| `COMPLETED`  | `COMPLETED`        |
| `CANCELLED`  | `CANCELLED`        |
| `NO_SHOW`    | `NO_SHOW`          |

Final queue statuses: `COMPLETED`, `CANCELLED`, `NO_SHOW`. Final entries cannot be updated or reordered by backend service logic.

## Queue Reordering Trace

```text
User clicks move up or move down on /queue
    ↓
QueuePage -> handleQueueMove(queueEntry, offset)
    ↓
getActiveQueueEntries(confirmedQueueEntries)
    ↓
getQueueEntriesForDoctorScope(..., queueEntry.doctor.id)
    ↓
moveQueueEntryId(activeQueueEntryIds, queueEntry.id, offset)
    ↓
queueApi.reorderQueue(clinicId, { date: todayDate, queueEntryIds: nextQueueEntryIds })
    ↓
PATCH /api/clinics/:clinicId/queue/reorder
    ↓
authenticateRequest -> validateRequest(params, body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
queue.controller.ts -> reorderQueueController()
    ↓
queue.service.ts -> reorderQueue(req.user, clinicId, date, queueEntryIds)
    ↓
verify clinic access
    ↓
reject duplicate IDs
    ↓
queueRepository.findQueueEntriesByIds(queueEntryIds)
    ↓
reject missing, cross-clinic, final-status, or multi-doctor request
    ↓
queueRepository.findActiveQueueByClinicDoctorDate(...)
    ↓
reject incomplete request or entries outside active doctor/date queue
    ↓
queueRepository.reorderQueueEntries(...)
    ↓
prisma.$transaction
    ↓
acquireQueueScopeLock(tx, clinicId, doctorId, date)
    ↓
re-read active queue entries inside transaction
    ↓
verify active set still exactly matches request
    ↓
first pass: update positions to 1_000_000 + index
    ↓
second pass: update positions to index + 1
    ↓
return reordered active entries
    ↓
QueuePage merges reordered active entries into confirmed list and shows toast
```

## Reorder Invariants

| Invariant                                               | Evidence                                                                            |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| Request IDs must be unique                              | Zod refine and service `new Set` check                                              |
| Entries must exist                                      | `findQueueEntriesByIds` length check                                                |
| Entries must belong to route clinic                     | service clinic mismatch check                                                       |
| Entries must be non-final                               | service final status check                                                          |
| Entries must all belong to one doctor                   | service `requestedDoctorIds` check                                                  |
| Request must include all active entries for doctor/date | service and repository checks                                                       |
| Concurrency protection                                  | `acquireQueueScopeLock` uses `pg_advisory_xact_lock` inside transaction             |
| Position rewrite avoids transient duplicates            | first pass writes high temporary positions, second pass writes normalized positions |

## Queue Lifecycle Diagram

```mermaid
stateDiagram-v2
    [*] --> WAITING: appointment booking creates QueueEntry
    WAITING --> ARRIVED: queue status update
    WAITING --> CALLED: queue status update
    WAITING --> COMPLETED: queue status update
    WAITING --> CANCELLED: queue status update
    WAITING --> NO_SHOW: queue status update
    ARRIVED --> WAITING: queue status update allowed by backend
    ARRIVED --> CALLED
    ARRIVED --> COMPLETED
    ARRIVED --> CANCELLED
    ARRIVED --> NO_SHOW
    CALLED --> COMPLETED
    CALLED --> CANCELLED
    CALLED --> NO_SHOW
    COMPLETED --> [*]
    CANCELLED --> [*]
    NO_SHOW --> [*]
```

The backend accepts any non-final source to any Zod-accepted queue status. The diagram shows common transitions plus the fact that `ARRIVED` can be set back to `WAITING` because the backend does not enforce a stricter matrix.

## How To Explain This Workflow

The queue is created when appointments are booked. Staff can then change queue status or manually reorder active entries. Queue status updates synchronize the linked appointment inside the same transaction. Reorder is conservative: it only works within one doctor/date queue, requires the complete active set, locks that scope, rechecks it, and rewrites positions atomically.
