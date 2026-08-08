# No-Show Assistance Revision

Current system: deterministic rule-based assistance, not trained ML and not LLM.

Inputs:

- appointment scheduled time
- booking time
- patient no-show count
- patient late-arrival count
- patient completed count
- distance from clinic if recorded

Outputs:

- risk level: `LOW`, `MEDIUM`, `HIGH`
- score: clamped 0-100
- reasons with score impact
- suggested manual actions
- response-level model version `starter-rule-v1`

Evidence:

- `apps/server/src/modules/predictions/prediction.service.ts`
- `NoShowPrediction` model
- `prediction.service.test.ts`
- risk UI in appointment/queue/dashboard

Boundary:

- does not cancel appointments
- does not reorder queue
- does not diagnose patients
- does not claim accuracy
- should be reviewed by staff as context
