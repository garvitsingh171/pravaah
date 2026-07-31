# Queue Workflow

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
- Reorder requests must include every active entry exactly once.
- Queue access is clinic-scoped.
- Appointment status and queue status synchronize for shared states.

## Demo Check

Create at least two active queue entries, move one, confirm order changes, then update a queue status and refresh the dashboard.
