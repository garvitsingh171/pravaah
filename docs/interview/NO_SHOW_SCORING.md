# Worked no-show scoring examples

Purpose: source-backed interview practice. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: `VERIFIED_FROM_CODE` unless marked future. Audience: project owner.

Evaluator: [`prediction.service.ts`](../../apps/server/src/modules/predictions/prediction.service.ts). Inputs are attendance counts at this clinic, distance in km, and hours from booking to appointment. `null` distance adds zero. These are deterministic examples of the current rules, not calibrated probabilities.

| Scenario                          | Calculation                          | Score | Band   |
| --------------------------------- | ------------------------------------ | ----: | ------ |
| first-time, 72h, distance unknown | 10; clamp 10 to 0–100                |    10 | LOW    |
| first-time, 8h, distance unknown  | 15 + 10; clamp 25 to 0–100           |    25 | LOW    |
| first-time, 72h, 10km             | 8 + 10; clamp 18 to 0–100            |    18 | LOW    |
| first-time, 72h, 16km             | 15 + 10; clamp 25 to 0–100           |    25 | LOW    |
| reliable returning, 72h, 2km      | -20; clamp -20 to 0–100              |     0 | LOW    |
| reliable returning, 8h, 2km       | 15 + -20; clamp -5 to 0–100          |     0 | LOW    |
| one no-show, 72h, 2km             | 25; clamp 25 to 0–100                |    25 | LOW    |
| two no-shows, 72h, 2km            | 40; clamp 40 to 0–100                |    40 | MEDIUM |
| two no-shows, two late, 8h, 16km  | 40 + 15 + 15 + 15; clamp 85 to 0–100 |    85 | HIGH   |
| one no-show, one late, 20d, 10km  | 25 + 8 + 8 + 10; clamp 51 to 0–100   |    51 | MEDIUM |

The rule uses `<=24` hours for short notice and `>=14 days` for long advance. A score at 30 is MEDIUM; at 60 it is HIGH. Runs and outcomes are persisted separately. A failed refresh can leave an older operational score while durable work remains retryable; inspect [`prediction.recalculation.service.ts`](../../apps/server/src/modules/predictions/prediction.recalculation.service.ts). Staff decide follow-up; the score does not cancel or reorder visits.
