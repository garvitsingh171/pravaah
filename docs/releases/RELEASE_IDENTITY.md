# Release Identity

This document records release identity evidence for reviewer and release docs.

## Current Identity

| Field                        | Verified value                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| Root package version         | `0.3.0` in [package.json](../../package.json)                         |
| Web workspace version        | `0.1.0` in [apps/web/package.json](../../apps/web/package.json)       |
| Server workspace version     | `0.1.0` in [apps/server/package.json](../../apps/server/package.json) |
| Candidate label              | `v0.3.0`                                                              |
| Candidate name               | Clinic Operations Release Candidate                                   |
| Release status               | Release Candidate / Production Verification Pending                   |
| Release date                 | Not yet verified                                                      |
| Local Git tag                | Not created during this pass                                          |
| GitHub release URL           | Not yet published                                                     |
| Production frontend URL      | Pending owner verification                                            |
| Production backend URL       | Pending owner verification                                            |
| Custom domain                | Pending owner verification                                            |
| Deployed frontend commit SHA | Pending owner verification                                            |
| Deployed backend commit SHA  | Pending owner verification                                            |

## Deployment Architecture Evidence

| Layer    | Evidence                                                                                                | Current claim                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Frontend | [apps/web/vercel.json](../../apps/web/vercel.json), [Deployment Guide](../guides/DEPLOYMENT.md)         | Vite frontend can be deployed to a static host; Vercel-style SPA rewrite is configured. |
| Backend  | [apps/server/package.json](../../apps/server/package.json), [Deployment Guide](../guides/DEPLOYMENT.md) | Express backend can be deployed to a Node host such as Render.                          |
| Database | [schema.prisma](../../apps/server/prisma/schema.prisma), env examples                                   | PostgreSQL required; hosted provider not verified by repository state.                  |
| Auth     | Clerk packages and env examples                                                                         | Clerk is used for authentication.                                                       |
| Health   | [health.routes.ts](../../apps/server/src/modules/health/health.routes.ts)                               | Backend health endpoint exists at `/api/health` when deployed.                          |

## Included In `v0.3.0` Candidate

See [v0.3 Release Notes](V0_3_0_RELEASE_NOTES.md), [v0.3 Release Charter](V0.3_RELEASE_CHARTER.md), and [Project Status](../reviewer/project-status.md). Included source-backed features remain pending production verification until owner evidence is recorded.

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

## Migration Requirements

Use Prisma production migration flow for deployed environments:

```bash
npm run prisma:migrate:deploy --workspace apps/server
```

Do not run development reset or destructive migration commands against production data. Production migration execution remains an owner-controlled release action.

## Finalization Evidence Needed From Owner

- actual production frontend URL and custom domain
- actual production backend URL
- final release commit SHA
- Vercel deployed SHA
- Render deployed SHA
- Prisma migration result
- backend health result
- database connectivity result
- production smoke result
- Admin authorization result
- Staff authorization result
- cross-clinic rejection result
- known release limitations
- actual release date
- GO or NO-GO decision

Only after a GO decision should this document be changed from release candidate state to released state.
