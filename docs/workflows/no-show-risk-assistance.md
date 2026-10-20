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
| Main frontend symbols | `RiskBadge`, shared `RiskExplanation`, appointment `AppointmentDetailPanel`, queue `noShowPrediction`, dashboard `HighRiskAppointmentsCard`                  |
| API endpoint          | Risk appears in appointment/queue responses; feedback uses `GET/PUT /api/predictions/:predictionId/feedback`                                                 |
| Middleware            | Prediction generation happens inside appointment/dashboard workflows                                                                                         |
| Authentication        | Same as parent workflow                                                                                                                                      |
| Authorization         | Same as parent workflow                                                                                                                                      |
| Validation            | Same as parent workflow                                                                                                                                      |
| Service               | `prediction.service.ts -> predictNoShowRisk`, `toNoShowPredictionResponse`, `getSuggestedNoShowActions`                                                      |
| Repository            | `appointment.repository.ts -> createNoShowPrediction`; `dashboard.repository.ts -> createNoShowPredictions`                                                  |
| Database models       | `NoShowPrediction`, `PredictionFeedback`, `AppointmentPredictionOutcome`, `Appointment`, `Patient`, `PatientClinic`                                          |
| Prisma operations     | `noShowPrediction.create`, `noShowPrediction.createMany({ skipDuplicates: true })`, response selects                                                         |
| Transaction           | Booking prediction is inside appointment transaction. Dashboard backfill is not wrapped in a larger transaction                                              |
| Concurrency control   | nullable unique baseline `runKey`; dashboard backfill uses `skipDuplicates`                                                                                  |
| State changes         | append-only `NoShowPrediction` runs; user-owned feedback upserts per run; one appointment-level outcome is synchronized on booking and lifecycle updates     |
| Errors                | Prediction service does not throw domain errors; parent appointment/dashboard errors apply                                                                   |
| Tests                 | `prediction.service.test.ts`, appointment/dashboard tests                                                                                                    |
| Known gaps            | Refresh is deferred through durable work; it is not a request-time guarantee.                                                                                |

## Staff Feedback (Issue #281)

Admin and Staff can open the feedback disclosure from appointment risk details or queue risk explanation. They can record `USEFUL`, `NOT_USEFUL`, or `UNSURE`, choose a staff-reported action, and optionally add a note up to 500 characters. `GET /api/predictions/:predictionId/feedback` returns only the authenticated user's entry (or `null`); `PUT` creates or updates that user's entry. The API derives clinic ownership from the referenced prediction and rejects cross-clinic access.

The feedback row remains tied to the prediction run originally evaluated. It does not change appointment status, queue state, attendance outcome, or risk score. Staff action categories are reports, not verified events. Feedback remains subjective and optional; no feedback is distinct from `UNSURE`. A server-generated recommendation snapshot/version is saved when feedback is first created and preserved on updates. It captures the recommendation set reconstructed for that run at submission, not a verified record of the exact content shown in a previous UI release. Future analytics may compare feedback with verified outcomes, but causal effects and analytics are not implemented.

```text
Staff reviews a run -> records usefulness and reported action -> backend verifies user and clinic -> feedback is upserted for (prediction run, staff user)
```

## Important Language

Pravaah currently uses deterministic, explainable no-show risk assistance rather than a trained machine-learning model.

The shared `RiskExplanation` presentation is used for appointment details, queue disclosures, and dashboard high-risk items. It renders the stored risk classification and score, each usable reason with its recorded `scoreImpact`, the backend-provided suggested actions, and metadata from that same prediction run. Missing or malformed values remain unavailable; the frontend does not calculate risk levels, score contributions, or fallback recommendations. Factor impacts are individual rule contributions and do not necessarily sum to the bounded final score. A score such as `75/100` is not a calibrated 75% probability.

Each response includes a narrow `predictionContext.distanceFromClinicKm` projection from that run's `featureSnapshot`. It is a non-negative finite number or `null`; the full snapshot and patient location are not exposed by this projection. The UI formats the stored distance and never substitutes current patient distance. Generation time uses the run's `createdAt` as `generatedAt`, formatted in the clinic timezone (the configured clinic default is `Asia/Kolkata`). Persisted `ruleVersion` and `generationSource` are shown when present. Legacy runs without trustworthy version metadata show “Not available”. Staff feedback remains embedded in the shared view and remains associated with the exact immutable run.

It does not:

- cancel appointments automatically
- reorder queues automatically
- send reminders automatically
- decide whether a patient should be seen
- replace Admin/Staff judgment

## Scoring Inputs

`predictNoShowRisk` accepts:

| Input                              | Source in appointment booking                                                                   |
| ---------------------------------- | ----------------------------------------------------------------------------------------------- |
| `scheduledAt`                      | newly created `Appointment.scheduledAt`                                                         |
| `bookedAt`                         | newly created `Appointment.createdAt`                                                           |
| `patientNoShowCount`               | count of prior clinic appointments with status `NO_SHOW`                                        |
| `patientCompletedAppointmentCount` | count of prior clinic appointments with status `COMPLETED`                                      |
| `patientLateArrivalCount`          | `PatientClinic.totalLateArrivals`, maintained from recorded appointment arrivals for new visits |
| `distanceFromClinicKm`             | `PatientClinic.distanceFromClinicKm` converted to number or null                                |

Dashboard backfill passes scheduled/booked/no-show/completed counts, but does not pass late-arrival count or distance.

The rule math, thresholds, reasons, feature sources, and `starter-rule-v1` version stay unchanged. `PatientClinic` now also maintains booking, completion, no-show, and last-completed-visit aggregates, but prediction continues counting completed/no-show `Appointment` rows directly and reading only late arrivals/distance from `PatientClinic`. Stored predictions are not recalculated by attendance updates.

## Appointment Outcome Tracking

Booking creates one `AppointmentPredictionOutcome` in `PENDING`. Appointment
status updates and queue status updates both synchronize the same outcome
inside their existing database transaction after arrival and activity writes.
`ARRIVED`, `IN_QUEUE`, and `CALLED` use `arrivedAt` and activity history as
attendance evidence; `COMPLETED` is also attendance evidence. Attendance maps
to `actualNoShow: false`; explicit `NO_SHOW` without attendance maps to `true`.
Cancellation before attendance and unresolved visits have a null binary label.

If a visit was recorded as arrived and later reaches operational `NO_SHOW`, its
outcome is `EXCLUDED` with a conflict reason and null label. A cancellation
after arrival keeps `ATTENDED`. The operational status is not rewritten. Final
appointment states cannot currently be corrected through existing lifecycle
APIs, so this feature does not add a correction path.

Prediction rows remain immutable and multiple runs join to the one outcome via
`appointmentId`. A future evaluator must select runs independently: require a
feature snapshot and versions, predate both the scheduled visit and first
trustworthy evidence, and match snapshot `scheduledAt` to the current appointment schedule. This
excludes late-generated predictions and runs from a previous rescheduled time.
Legacy predictions without snapshots are retained but not automatically
eligible. No outcomes are backfilled for old appointments because reliable
event ordering cannot be reconstructed consistently. Dataset preparation,
run de-duplication, model training, and performance analysis are future tasks;
the engine remains rule-based today.

Structured clinic or patient address fields are not prediction inputs. Geoapify
Routing may improve the source of `PatientClinic.distanceFromClinicKm`, but it
does not trigger mass prediction recalculation. Historical manual values remain
identifiable as legacy `NOT_CALCULATED` data and are not labelled as routed.

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

- `ruleVersion: starter-rule-v1` is persisted on new runs; `modelVersion` is only a compatibility alias
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
prediction.service.ts -> normalizeNoShowPredictionFeatures(...) -> evaluateNoShowFeatureSnapshotV1(...)
    ↓
appointment.repository.ts -> createNoShowPrediction(tx, clinicId, appointmentId, patientId, prediction)
    ↓
tx.noShowPrediction.create({ metadata, riskLevel, score, reasons })
    ↓
prediction.service.ts -> toNoShowPredictionResponse(storedPrediction)
    ↓
frontend receives riskLevel, score, reasons, suggestedActions, persisted ruleVersion, provenance, and predictionContext.distanceFromClinicKm
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
prediction.service.ts -> normalizeNoShowPredictionFeatures(...) -> evaluateNoShowFeatureSnapshotV1(...)
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

## Geocoding Boundary

Geoapify-derived coordinates are not an input to no-show risk. Existing
`PatientClinic.distanceFromClinicKm` behavior, thresholds, scores, reasons,
versions, and prediction timing remain unchanged. Prediction never calls
Geoapify or calculates distance.

## Input-Change Refresh

Refresh is event-driven, never triggered by an Appointment, Queue, or Dashboard GET.
Successful rescheduling appends `APPOINTMENT_RESCHEDULED` in its transaction.
First `COMPLETED`/`NO_SHOW` transitions and first late arrivals register coalesced
clinic-and-patient `PredictionRefreshWork` as `PATIENT_HISTORY_CHANGED`; stable
routing success, failure, and invalidation register `TRAVEL_DISTANCE_CHANGED`.
Starting a route attempt does not register work.

The worker processes only future `SCHEDULED`/`CONFIRMED` appointments for that
same clinic/patient in bounded batches. Each run takes an appointment advisory
transaction lock, revalidates eligibility, compares all six normalized features
plus rule version, and appends only changed state. `Appointment.createdAt` remains
`bookedAt` after rescheduling. Stable null distance is represented honestly;
transient routing nulls are not refresh triggers. Leases, revisions, retryable
failures, expired-lease reclamation, and startup recovery protect durable work without a time-based refresh.
No address, coordinates, or other PII is captured or logged by this workflow.
