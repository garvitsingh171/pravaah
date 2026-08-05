# Queue Workflow

Authoritative current references: [Product Requirements](../../PRD.md), [High-Level Design](../../HLD.md), and [Interview Guide](../../INTERVIEW_GUIDE.md).

## Purpose

Help clinic staff manage today's patient flow while keeping humans in control.

## Flow

```txt
Appointment created
-> QueueEntry created
-> Staff opens /queue
-> update status
-> manually move active entries up/down
-> backend validates full active order
-> dashboard reflects activity
```

## Important Rules

- Final queue entries should not be reordered.
- Queue position scope is clinic, doctor, and clinic-local appointment date.
- Reorder requests must include every active entry for one doctor's queue on the selected clinic-local date exactly once.
- Reorder validation rejects mixed clinics, mixed doctors, final entries, missing active entries, unknown entries, and duplicate IDs.
- Reorder persistence runs in one transaction and uses the same clinic/doctor/date advisory-lock key as booking-time queue position assignment.
- Queue access is clinic-scoped.
- Appointment status and queue status synchronize for shared states.
- No-show risk is displayed as operational context only. It never automatically reorders the queue, cancels an appointment, or deprioritizes a patient.

## Demo Check

Create at least two active queue entries, move one, confirm order changes, then update a queue status and refresh the dashboard.
