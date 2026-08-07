# No-Show Risk Assistance

## Workflow Summary

| Field                 | Evidence                                                                                                                                                     |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow              | Deterministic no-show risk generation, persistence, and display                                                                                              |
| Product status        | Implemented as rule-based assistance                                                                                                                         |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                   |
| Actor                 | Admin/Staff view generated risk context; no automatic patient-facing action                                                                                  |
| Entry route           | `/appointments`, `/queue`, `/dashboard`                                                                                                                      |
| Frontend files        | `AppointmentsPage.tsx`, `queueApi.ts`, `QueuePage.tsx`, `dashboardApi.ts`, `DashboardOverviewPage.tsx`, `components/ui/RiskBadge.tsx`, `RiskExplanation.tsx` |
| Main frontend symbols | `RiskBadge`, `PredictionDetailPanel`, `AppointmentDetailPanel`, queue `noShowPrediction`, dashboard `HighRiskAppointmentsCard`                               |
| API endpoint          | No standalone prediction route. Risk appears in appointment, queue, and dashboard responses                                                                  |
| Middleware            | Prediction generation happens inside appointment/dashboard workflows                                                                                         |
| Authentication        | Same as parent workflow                                                                                                                                      |
| Authorization         | Same as parent workflow                                                                                                                                      |
| Validation            | Same as parent workflow                                                                                                                                      |
| Service               | `prediction.service.ts -> predictNoShowRisk`, `toNoShowPredictionResponse`, `getSuggestedNoShowActions`                                                      |
| Repository            | `appointment.repository.ts -> createNoShowPrediction`; `dashboard.repository.ts -> createNoShowPredictions`                                                  |
| Database models       | `NoShowPrediction`, `Appointment`, `Patient`, `PatientClinic`                                                                                                |
| Prisma operations     | `noShowPrediction.create`, `noShowPrediction.createMany({ skipDuplicates: true })`, response selects                                                         |
| Transaction           | Booking prediction is inside appointment transaction. Dashboard backfill is not wrapped in a larger transaction                                              |
| Concurrency control   | `NoShowPrediction.appointmentId` is unique; dashboard backfill uses `skipDuplicates`                                                                         |
| State changes         | Stored `NoShowPrediction` rows; frontend display only                                                                                                        |
| Errors                | Prediction service does not throw domain errors; parent appointment/dashboard errors apply                                                                   |
| Tests                 | `prediction.service.test.ts`, appointment/dashboard tests                                                                                                    |
| Known gaps            | `PatientClinic` history counters are not automatically updated by current status workflows                                                                   |

## Important Language

Pravaah currently uses deterministic, explainable no-show risk assistance rather than a trained machine-learning model.

It does not:

- cancel appointments automatically
- reorder queues automatically
- send reminders automatically
- decide whether a patient should be seen
- replace Admin/Staff judgment

## Scoring Inputs

`predictNoShowRisk` accepts:

| Input                              | Source in appointment booking                                    |
| ---------------------------------- | ---------------------------------------------------------------- |
| `scheduledAt`                      | newly created `Appointment.scheduledAt`                          |
| `bookedAt`                         | newly created `Appointment.createdAt`                            |
| `patientNoShowCount`               | count of prior clinic appointments with status `NO_SHOW`         |
| `patientCompletedAppointmentCount` | count of prior clinic appointments with status `COMPLETED`       |
| `patientLateArrivalCount`          | `PatientClinic.totalLateArrivals`                                |
| `distanceFromClinicKm`             | `PatientClinic.distanceFromClinicKm` converted to number or null |

Dashboard backfill passes scheduled/booked/no-show/completed counts, but does not pass late-arrival count or distance.

## Rule Summary

| Rule                                              | Score impact |
| ------------------------------------------------- | ------------ |
| Two or more prior no-shows                        | +40          |
| One prior no-show                                 | +25          |
| Two or more late arrivals                         | +15          |
| One late arrival                                  | +8           |
| Distance >= 15 km                                 | +15          |
| Distance >= 8 km                                  | +8           |
| Booked <= 24 hours before appointment             | +15          |
| Booked >= 14 days before appointment              | +10          |
| No prior completed/no-show appointments           | +10          |
| At least 3 completed appointments and no no-shows | -20          |

The score is clamped to `0..100`. Risk levels are:

| Score   | Risk level |
| ------- | ---------- |
| `>= 60` | `HIGH`     |
| `>= 30` | `MEDIUM`   |
| `< 30`  | `LOW`      |

Response mapping adds:

- `modelVersion: starter-rule-v1`
- `generatedAt`
- human-readable suggested actions from `getSuggestedNoShowActions`

## Generation Trace

```text
appointment.service.ts -> createAppointment()
    ↓
counts patient no-show and completed appointments
    ↓
reads PatientClinic totalLateArrivals and distanceFromClinicKm
    ↓
appointment transaction creates Appointment
    ↓
prediction.service.ts -> predictNoShowRisk(...)
    ↓
appointment.repository.ts -> createNoShowPrediction(tx, clinicId, appointmentId, patientId, prediction)
    ↓
tx.noShowPrediction.create({ riskLevel, score, reasons })
    ↓
prediction.service.ts -> toNoShowPredictionResponse(storedPrediction)
    ↓
frontend receives riskLevel, score, reasons, suggestedActions, modelVersion
```

## Dashboard Backfill Trace

```text
DashboardOverviewPage loads summary or high-risk appointments
    ↓
GET /api/clinics/:clinicId/dashboard/summary
or GET /api/clinics/:clinicId/dashboard/high-risk-appointments
    ↓
dashboard.service.ts -> backfillMissingNoShowPredictions(clinicId, selectedDate, clinic.timezone)
    ↓
dashboard.repository.ts -> findAppointmentsMissingNoShowPrediction()
    ↓
dashboard.repository.ts -> countPatientAppointmentsByStatuses()
    ↓
prediction.service.ts -> predictNoShowRisk(...)
    ↓
dashboard.repository.ts -> createNoShowPredictions(predictions)
    ↓
prisma.noShowPrediction.createMany({ skipDuplicates: true })
```

This is a read-endpoint side effect. It exists to populate missing predictions for active appointments.

## Risk Data Flow Diagram

```mermaid
flowchart LR
    PatientClinic[PatientClinic history] --> Service[predictNoShowRisk]
    AppointmentHistory[Appointment status counts] --> Service
    AppointmentTime[scheduledAt and createdAt] --> Service
    Service --> Stored[NoShowPrediction row]
    Stored --> Appointments[/appointments display]
    Stored --> Queue[/queue display]
    Stored --> Dashboard[/dashboard high-risk and summary]
```

## How To Explain This Workflow

Risk assistance is a transparent rules engine. It turns clinic-local history and appointment timing into a stored score, reasons, and suggested staff actions. The result is advisory context for humans, not an automated decision.
