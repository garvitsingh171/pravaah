# Queue Revision

Trace:

```text
/queue
  -> QueuePage.loadQueue
  -> queueApi.listTodayQueue
  -> GET /api/clinics/:clinicId/queue
  -> auth + validation + clinic access + Staff/Admin role
  -> queueService.listQueueByClinicDate
  -> queueRepository.findQueueByClinicDate
```

Status update:

```text
QueuePage.handleStatusUpdate
  -> PATCH /api/clinics/:clinicId/queue/:queueEntryId/status
  -> queueService.updateQueueStatus
  -> queueRepository.updateQueueEntryStatus transaction
  -> sync AppointmentStatus
```

Reorder:

```text
QueuePage.handleQueueMove
  -> PATCH /api/clinics/:clinicId/queue/reorder
  -> queueService.reorderQueue
  -> validate unique IDs, clinic, non-final, one doctor, complete active set
  -> queueRepository.reorderQueueEntries transaction
```

Limits: no automatic risk-based reorder, no separate arrival endpoint, no full strict non-final transition graph.
