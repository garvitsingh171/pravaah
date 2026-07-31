# Appointment Workflow

## Purpose

Create an appointment and keep queue and no-show context in sync.

## Flow

```txt
Admin/Staff selects doctor and patient
-> POST /api/clinics/:clinicId/appointments
-> validate clinic, doctor, patient, and slot
-> create Appointment
-> create QueueEntry
-> create NoShowPrediction
-> show appointment, queue position, and risk explanation
```

## Important Rules

- Doctor and patient must be linked to the same clinic.
- The same doctor cannot have overlapping active appointment slots.
- No-show risk is rule-based and advisory.
- Queue and appointment status updates synchronize where appropriate.

## Demo Check

Book an appointment, open appointments to show risk reasons, then open queue to show the generated entry.
