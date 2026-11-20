# Release Identity

This document records verified release identity for reviewer and release docs.

## Current Identity

| Field                        | Verified value                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| Root package version         | `0.4.0` in [package.json](../../package.json)                         |
| Web workspace version        | `0.1.0` in [apps/web/package.json](../../apps/web/package.json)       |
| Server workspace version     | `0.1.0` in [apps/server/package.json](../../apps/server/package.json) |
| Release label                | `v0.3.0`                                                              |
| Release name                 | Clinic Operations Release                                             |
| Release status               | Released                                                              |
| GO/NO-GO decision            | GO                                                                    |
| Release date                 | Actual calendar date not provided; owner supplied `YYYY-MM-DD`        |
| Source/main commit SHA       | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                            |
| Local Git tag                | Owner action; not created by Codex                                    |
| GitHub release URL           | Owner action; not provided                                            |
| Production frontend URL      | `https://pravaah.garvitsingh171.com`                                  |
| Production backend URL       | `https://pravaah-wmeh.onrender.com/`                                  |
| Custom domain                | `https://pravaah.garvitsingh171.com`                                  |
| Deployed frontend commit SHA | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                            |
| Deployed backend commit SHA  | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                            |

## Production Verification Evidence

Owner-reported production verification for `v0.3.0`:

| Check                       | Result |
| --------------------------- | ------ |
| Prisma migrate deploy       | PASS   |
| Database connectivity       | PASS   |
| Backend `/api/health`       | PASS   |
| Fresh external Clerk signup | PASS   |
| Fresh-user onboarding       | PASS   |
| Clinic provisioning         | PASS   |
| Admin flow                  | PASS   |
| Staff authorization         | PASS   |
| Cross-clinic rejection      | PASS   |
| Doctor flow                 | PASS   |
| Patient flow                | PASS   |
| Appointment flow            | PASS   |
| No-show assistance          | PASS   |
| Queue workflow              | PASS   |
| Manual reorder              | PASS   |
| Dashboard                   | PASS   |
| Production smoke            | PASS   |

## Deployment Architecture Evidence

| Layer    | Evidence                                                                                                 | Verified release claim                                                          |
| -------- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Frontend | [apps/web/vercel.json](../../apps/web/vercel.json), owner-provided Vercel SHA and production URL         | Vite frontend is production deployed at `https://pravaah.garvitsingh171.com`.   |
| Backend  | [apps/server/package.json](../../apps/server/package.json), owner-provided Render SHA and production URL | Express backend is production deployed at `https://pravaah-wmeh.onrender.com/`. |
| Database | [schema.prisma](../../apps/server/prisma/schema.prisma), owner-reported migration/connectivity results   | PostgreSQL/Prisma production migration and connectivity are verified as PASS.   |
| Auth     | Clerk packages, env examples, owner-reported Clerk signup/onboarding checks                              | Clerk production signup and onboarding flow are verified as PASS.               |
| Health   | [health.routes.ts](../../apps/server/src/modules/health/health.routes.ts), owner-reported health check   | Backend `/api/health` is verified as PASS in production.                        |

## Included In `v0.3.0`

See [v0.3 Release Notes](V0_3_0_RELEASE_NOTES.md), [v0.3 Release Charter](V0.3_RELEASE_CHARTER.md), and [Project Status](../reviewer/project-status.md).

## Excluded From Current Release

- patient/doctor login
- patient portal or doctor portal
- billing, payments, prescriptions, inventory, or full medical records
- trained ML no-show prediction
- automatic reminders or notification automation
- automatic cancellation, risk-based prioritization, or automatic queue reordering
- full multi-clinic membership/context switching
- browser E2E test suite
- production monitoring/observability stack

## Remaining Release Metadata To Fill

The owner has not provided the actual calendar release date or GitHub Release URL. Do not invent either value.

## Current source after the verified v0.3 record

The root package now reads `0.4.0` at HEAD `9e0714ef0952f6425c308faebe3ce870a1844182`. The table above retains the owner-reported `v0.3.0` GO, deployed SHAs and production smoke evidence as historical release evidence. [v0.4.0 release notes](V0_4_0_RELEASE_NOTES.md) describe a source release boundary subject to release-gate verification; this document has no owner-supplied deployed SHA or smoke result for HEAD. A committed v0.4 feature, later migration or v0.5 audit does not extend v0.3 production verification.
