# Code-Writing Simulations

Keep solutions small and tied to Pravaah workflows.

## Exercise 1 - Appointment Conflict Helper

Problem: Write a function that checks whether a requested appointment conflicts with active existing appointments for the same doctor and exact `scheduledAt`.

Context: Current Pravaah conflict logic is exact doctor/time, not duration overlap.

Relevant files: `appointment.service.ts`, `appointment.repository.ts`, migration `20260612120303_add_active_doctor_slot_unique_index`.

Expected reasoning: filter by clinic, doctor, exact scheduled time, and active statuses.

Minimal JS:

```js
function hasSlotConflict(existing, requested) {
  return existing.some((appointment) =>
    appointment.clinicId === requested.clinicId &&
    appointment.doctorId === requested.doctorId &&
    appointment.scheduledAt.getTime() === requested.scheduledAt.getTime() &&
    ['SCHEDULED', 'CONFIRMED', 'ARRIVED', 'IN_QUEUE', 'CALLED'].includes(appointment.status)
  );
}
```

TypeScript version:

```ts
type ActiveAppointmentStatus = 'SCHEDULED' | 'CONFIRMED' | 'ARRIVED' | 'IN_QUEUE' | 'CALLED';

type AppointmentSlot = {
    clinicId: string;
    doctorId: string;
    scheduledAt: Date;
    status: ActiveAppointmentStatus | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';
};

const activeStatuses = new Set<AppointmentSlot['status']>([
    'SCHEDULED',
    'CONFIRMED',
    'ARRIVED',
    'IN_QUEUE',
    'CALLED',
]);

export const hasSlotConflict = (
    existing: AppointmentSlot[],
    requested: Pick<AppointmentSlot, 'clinicId' | 'doctorId' | 'scheduledAt'>
): boolean => {
    return existing.some((appointment) => {
        return (
            appointment.clinicId === requested.clinicId &&
            appointment.doctorId === requested.doctorId &&
            appointment.scheduledAt.getTime() === requested.scheduledAt.getTime() &&
            activeStatuses.has(appointment.status)
        );
    });
};
```

Common mistakes: using string date comparison across timezones, forgetting status filter, claiming duration overlap.

Follow-up: How would duration-overlap detection change this?

## Exercise 2 - Queue Reorder Validation

Problem: Validate that a reorder request contains unique IDs and all active queue entries for one doctor.

Relevant files: `queue.service.ts -> reorderQueue`, `QueuePage.tsx -> handleQueueMove`.

Strong solution: reject duplicates, wrong clinic, final entries, multiple doctors, incomplete active set, and entries outside the selected date.

TypeScript types:

```ts
type QueueStatus = 'ARRIVED' | 'WAITING' | 'CALLED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW';

type QueueEntry = {
    id: string;
    clinicId: string;
    doctorId: string;
    status: QueueStatus;
};

const finalStatuses = new Set<QueueStatus>(['COMPLETED', 'CANCELLED', 'NO_SHOW']);
```

Common mistakes: allowing duplicate IDs, reordering final rows, mixing doctors.

Follow-up: Why does the backend validate this if the UI already disables invalid moves?

## Exercise 3 - Status Transition Check

Problem: Add a small helper that rejects updates from final appointment statuses.

Relevant files: `appointment.repository.ts`, `appointment.service.ts`.

Minimal solution: if current status is `COMPLETED`, `CANCELLED`, or `NO_SHOW` and new status differs, return conflict.

Strong solution: separate final-state protection from a full strict transition graph and do not claim the full graph exists until implemented.

## Exercise 4 - Zod Validation

Problem: Create a Zod schema for a queue status update body.

Relevant files: `queue.validation.ts`, `validateRequest.ts`.

Expected reasoning: runtime request input is unknown, so TypeScript alone is not enough.

Common mistakes: accepting arbitrary strings, validating only in frontend.

## JavaScript-To-TypeScript Recovery Pattern

If JavaScript logic works but TypeScript does not:

1. Explain the business logic clearly.
2. Write simple JS or pseudocode if allowed.
3. Identify domain types from existing files.
4. Add explicit input/output types.
5. Narrow unions with `Set`, `Record`, or type guards.
6. State what TypeScript prevents, such as invalid status strings or missing fields.

Professional phrasing:

```text
I am confident about the workflow logic. I am stuck on the TypeScript typing, so I would first make the logic explicit, then tighten it using the existing enum/type from the module.
```

## Unable To Finish

Use an actual Pravaah framing:

```text
I completed the validation and service decision path. The remaining piece is the repository transaction update. I would finish by adding the Prisma transaction, mapping the conflict to AppError 409, and adding a service test for the rollback/conflict case.
```
