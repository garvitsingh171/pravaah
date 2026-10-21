# ML Dataset Export — v0.5

## Purpose and scope

This operator-invoked tool prepares a versioned table for future no-show experimentation. It does not train, evaluate, or deploy a model, and it does not change the live rule-based prediction system.

## Sources and architecture

`NoShowPrediction` provides immutable, versioned historical feature snapshots. `AppointmentPredictionOutcome` is the sole label source. `Appointment` supplies the schedule that must match the snapshot, and `Clinic.timezone` supplies local calendar interpretation. The export repository reads only selected columns in ordered pages inside one PostgreSQL `RepeatableRead` transaction. Validation and transformation are in `apps/server/src/modules/predictions/dataset-export/`; no operational table is written.

## Eligibility and selection

Only `ATTENDED` + `actualNoShow=false` with `ARRIVAL_EVIDENCE` or `COMPLETED_STATUS`, and `NO_SHOW` + `actualNoShow=true` with `NO_SHOW_STATUS`, are valid labels. Pending, cancelled, excluded/conflicting, null, and inconsistent outcomes are left unlabeled and excluded. The pipeline does not infer attendance from absence of a no-show.

The snapshot must use `no-show-features-v1`, pass strict exact-key runtime validation, match the appointment's currently stored scheduled instant, and have been created before both the scheduled instant and outcome evidence. A supported snapshot is read from the prediction record only; current patient history, current location, notes, staff actions, rule scores, reasons, and recommendations are never used as features. The baseline `isPredictionEligibleForOutcome()` remains in force.

For each appointment, the newest valid prediction by `createdAt`, then ID descending as a stable tie-breaker, is selected. An invalid newer run does not prevent an older eligible run from being selected. Rejected runs and appointment-level exclusions are counted separately in the report.

## Dataset schema v1

| Field                     | Type                | Definition                                                                    |
| ------------------------- | ------------------- | ----------------------------------------------------------------------------- |
| `previousNoShows`         | nonnegative integer | Historical `patientNoShowCount` snapshot                                      |
| `previousLateArrivals`    | nonnegative integer | Historical `patientLateArrivalCount` snapshot                                 |
| `previousCompletedVisits` | nonnegative integer | Historical `patientCompletedAppointmentCount` snapshot                        |
| `distanceFromClinicKm`    | number or null      | Snapshot distance rounded to nearest km; missing remains null                 |
| `bookingLeadHours`        | nonnegative number  | `(scheduledAt - bookedAt)` from snapshot, rounded to 0.01 hour                |
| `appointmentDayOfWeek`    | integer 1–7         | In clinic timezone; Monday=1, Sunday=7                                        |
| `appointmentTimeBucket`   | category            | Local time: MORNING before 12:00; AFTERNOON 12:00–16:59; EVENING 17:00 onward |
| `actualNoShow`            | boolean             | Verified target; CSV uses `1` for true and `0` for false                      |

`pravaah-ml-dataset-v1` is separate from source feature version `no-show-features-v1` and rule version `starter-rule-v1`. Strict Zod validation is applied to snapshots and output rows. The export contains no exact appointment date, time, row identifier, source ID, rule score, or direct identity field. Nullable distance is represented as JSON `null` and a blank CSV cell.

## Privacy and limitations

The output is constructed from a fixed field allowlist. There are no patient, clinic, appointment, doctor, staff, or prediction IDs; no free text; and no exact date/time. Distance is reduced to whole kilometres. Exports below the default 20-row cohort size are suppressed; operators may raise the threshold with `--minimum-cohort-size`, but cannot lower it below 20 (an empty dataset artifact may still be written with the aggregate manifest when not in dry-run mode). Output files use mode `0600`; the selected output directory is created/set to mode `0700`; partial writes are removed on failure. The default `private-ml-exports/` directory and common dataset artifact names are ignored by Git.

These controls reduce exposure but do not establish legal or statistical anonymity. Coarse schedules and historical counts may still be identifying when combined with external knowledge. Only trained operators with approved access to the configured database should run exports. Store artifacts in an approved private location, share only with the authorized analysis team, and securely delete both dataset and manifest when the approved retention period ends. Retention is governed by the operator's organizational policy; this tool does not retain or upload artifacts.

## Authorization and execution

This is a local server CLI, not a public API. Access to the configured database credentials is the underlying data authorization boundary. The operator must have approval, and a trusted execution environment must set `PRAVAAH_ML_EXPORT_AUTHORIZED_CLINIC_ID` to the single clinic UUID approved for export; the CLI rejects a different `--clinic-id`. This environment scope is an operator authorization control, not an application identity service. Every invocation must specify one clinic UUID, a half-open scheduled-time interval, and a destination. Never use a clinic ID alone as proof of access. No production export is performed by tests or builds.

After explicit operator approval and connection to the intended database, first run a dry run with synthetic/development data:

```bash
PRAVAAH_ML_EXPORT_AUTHORIZED_CLINIC_ID=00000000-0000-4000-8000-000000000001 \
npm run export:ml-dataset -w apps/server -- \
  --clinic-id 00000000-0000-4000-8000-000000000001 \
  --from 2025-01-01T00:00:00Z --to 2026-01-01T00:00:00Z \
  --output ./private-ml-exports/dataset.pravaah-dataset.csv --format csv \
  --minimum-cohort-size 30 --dry-run
```

Dry-run validates and reports aggregate counts without writing files. To write an approved export, remove `--dry-run`. JSONL is supported with `--format jsonl` and a `.jsonl` output path. The tool does not start prediction backfills or refresh jobs. Do not use real production data in local development or tests.

## Quality report and output

The adjacent `.manifest.json` records dataset and source feature schema versions, selection/privacy policy versions, creation time, period, format, candidate and eligible totals, exported count, verified label counts and percentages, null counts, appointment-level exclusion counts, rejected-run counts, duplicate count, snapshot/version/leakage totals, and cohort suppression. It contains no source identifiers. `exportedRecords` equals verified attendance plus verified no-show rows. On suppressed cohorts, exported and class/null aggregate counts are zero; the eligible total and suppression indicator remain available to the authorized operator. Empty and suppressed exports are represented explicitly; no examples are fabricated.

CSV has stable allowlisted column ordering and RFC-style quoting; booleans are `1`/`0`. JSONL uses JSON booleans and null. Each output is written through a private same-directory temporary file and cleaned on a failed pair write.

## Known limitations and future integration

The 20-row threshold and whole-kilometre rounding are basic risk reduction, not a formal privacy guarantee. This version does not calculate differential privacy, perform a formal re-identification assessment, train a model, split data for evaluation, or provide a model-serving path. Future ML work must add governance, leakage review, model evaluation, fairness analysis, and explicit approval before training or deployment.
