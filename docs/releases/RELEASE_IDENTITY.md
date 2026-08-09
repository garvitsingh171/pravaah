# Release Identity

This document records the verified release identity for reviewer and release docs.

## Current Identity

| Field                        | Verified value                                                        |
| ---------------------------- | --------------------------------------------------------------------- |
| Root package version         | `0.2.0` in [package.json](../../package.json)                         |
| Web workspace version        | `0.1.0` in [apps/web/package.json](../../apps/web/package.json)       |
| Server workspace version     | `0.1.0` in [apps/server/package.json](../../apps/server/package.json) |
| Candidate label              | `v0.2.0`                                                              |
| Candidate name               | Public Demo and Self-Service Clinic Onboarding                        |
| Release date                 | `NEEDS_VERIFICATION`                                                  |
| Local Git tag                | None found during this pass                                           |
| GitHub release URL           | `NEEDS_VERIFICATION`                                                  |
| Production frontend URL      | `NEEDS_VERIFICATION`                                                  |
| Production backend URL       | `NEEDS_VERIFICATION`                                                  |
| Custom domain                | `NEEDS_VERIFICATION`                                                  |
| Deployed frontend commit SHA | `NEEDS_VERIFICATION`                                                  |
| Deployed backend commit SHA  | `NEEDS_VERIFICATION`                                                  |

## Deployment Architecture Evidence

| Layer    | Evidence                                                                                                | Current claim                                                                           |
| -------- | ------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Frontend | [apps/web/vercel.json](../../apps/web/vercel.json), [Deployment Guide](../guides/DEPLOYMENT.md)         | Vite frontend can be deployed to a static host; Vercel-style SPA rewrite is configured. |
| Backend  | [apps/server/package.json](../../apps/server/package.json), [Deployment Guide](../guides/DEPLOYMENT.md) | Express backend can be deployed to a Node host such as Render.                          |
| Database | [schema.prisma](../../apps/server/prisma/schema.prisma), env examples                                   | PostgreSQL required; hosted provider not verified by repository state.                  |
| Auth     | Clerk packages and env examples                                                                         | Clerk is used for authentication.                                                       |
| Health   | [health.routes.ts](../../apps/server/src/modules/health/health.routes.ts)                               | Backend health endpoint exists at `/api/health` when deployed.                          |

## Included In `v0.2.0` Candidate

See [v0.2 Release Notes](V0_2_0_RELEASE_NOTES.md) and [Project Status](../reviewer/project-status.md). Included features are implemented in source but should remain `NOT_YET_RELEASED` until release verification is recorded.

## Excluded From Current Release

- patient/doctor login
- trained ML no-show prediction
- messaging/notification automation
- billing, prescriptions, inventory, full medical records
- full multi-clinic membership/context switching
- browser E2E test suite
- production monitoring/observability stack

## Migration Requirements

Use Prisma production migration flow for deployed environments:

```bash
npm run prisma:migrate:deploy --workspace apps/server
```

Do not run development reset or destructive migration commands against production data.

## Rollback Awareness

No automated rollback runbook is committed. For release review, record:

- deployed commit SHAs
- database migration applied
- backup/snapshot strategy
- rollback owner
- smoke-check result before and after rollback
