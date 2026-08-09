# Release Checklist

Use this checklist before marking `v0.2.0` as released. Commands listed here exist in the repository unless marked as manual/recommended.

## Code Quality

| Check                      | Command or action                                                            | Status                                                   |
| -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| Install dependencies       | `npm install`                                                                | Required                                                 |
| Markdown formatting        | `npx prettier --check README.md "docs/**/*.md"`                              | Required                                                 |
| Workspace lint             | `npm run lint`                                                               | Required; backend lint currently prints placeholder text |
| Frontend tests             | `npm run test:web`                                                           | Required                                                 |
| Backend tests              | `npm run test:server`                                                        | Required                                                 |
| Frontend build             | `npm run build:web`                                                          | Required                                                 |
| Backend build              | `npm run build:server`                                                       | Required                                                 |
| Full workspace check       | `npm run check`                                                              | Required                                                 |
| Backend emitted test files | `find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)` | Required after backend build; expected no output         |
| No accidental debug code   | Manual `git diff` review                                                     | Required                                                 |

## Database

| Check                    | Command or action                                                                                                    | Status                             |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| Prisma schema validation | `npx prisma validate --schema apps/server/prisma/schema.prisma`                                                      | Required                           |
| Prisma client generation | `npm run prisma:generate --workspace apps/server`                                                                    | Required                           |
| Migration review         | Inspect [migrations](../../apps/server/prisma/migrations)                                                            | Required                           |
| Production migrations    | `npm run prisma:migrate:deploy --workspace apps/server`                                                              | Required only in target deploy env |
| Production safety        | Confirm no destructive reset against production                                                                      | Required                           |
| Sample data safety       | Confirm demo data is fictional before screenshots                                                                    | Required                           |
| API process health       | Backend boot and `/api/health`                                                                                       | Required                           |
| Database readiness query | Run `SELECT 1;` through Prisma or an equivalent target-environment database client using the deployed `DATABASE_URL` | Required                           |

Example database readiness query from an environment configured with the target `DATABASE_URL`:

```bash
printf 'SELECT 1;' | npx prisma db execute --schema apps/server/prisma/schema.prisma --stdin
```

`/api/health` proves the API process can respond; it does not prove Prisma can reach the configured database.

## Authentication

| Check                                                | Status   |
| ---------------------------------------------------- | -------- |
| Clerk publishable key configured only on frontend    | Required |
| Clerk secret key configured only on backend          | Required |
| Allowed origins and redirect URLs match frontend URL | Required |
| Sign-in works for seeded/manual demo user            | Required |
| Sign-up reaches onboarding state                     | Required |
| Internal user resolution works after onboarding      | Required |
| Admin can access clinic settings/sample data         | Required |
| Staff cannot access Admin-only settings              | Required |
| Cross-clinic access is rejected                      | Required |

## Deployment

| Check                                                                       | Status                  |
| --------------------------------------------------------------------------- | ----------------------- |
| Frontend `VITE_API_BASE_URL` points to backend `/api`                       | Required                |
| Backend `CLIENT_URL` matches frontend origin                                | Required                |
| Database `DATABASE_URL` set in backend environment                          | Required                |
| HTTPS enabled for public URLs                                               | Required                |
| Backend health endpoint verified                                            | Required                |
| Frontend public route verified signed out                                   | Required                |
| Production frontend URL recorded in [Release Identity](RELEASE_IDENTITY.md) | Required before release |
| Production backend URL recorded in [Release Identity](RELEASE_IDENTITY.md)  | Required before release |
| Deployed SHAs recorded                                                      | Required before release |
| Preview/production differences documented                                   | Required                |

## Product Workflow Verification

| Workflow                               | Status                    |
| -------------------------------------- | ------------------------- |
| Public landing                         | Manual smoke required     |
| Sign-in/sign-up                        | Manual smoke required     |
| Onboarding status                      | Manual/API smoke required |
| Clinic creation                        | Manual/API smoke required |
| Optional sample data                   | Manual/API smoke required |
| First-run checklist                    | Manual smoke required     |
| Clinic settings                        | Manual smoke required     |
| Doctor create/edit/list                | Manual smoke required     |
| Patient create/edit/list               | Manual smoke required     |
| Appointment booking/list/filter/status | Manual smoke required     |
| Queue entry creation/status/reorder    | Manual smoke required     |
| No-show risk display/explanation       | Manual smoke required     |
| Dashboard summary/high-risk/activity   | Manual smoke required     |
| Not-found and recovery/fallback states | Manual smoke required     |

## Documentation

| Doc                                                   | Status                                                    |
| ----------------------------------------------------- | --------------------------------------------------------- |
| [README](../../README.md)                             | Must link reviewer package/status/case study/release docs |
| [Docs index](../README.md)                            | Must include reviewer/case-study/release assets           |
| [PRD](../PRD.md), [HLD](../HLD.md), [LLD](../LLD.md)  | Must not contradict status dashboard                      |
| [Workflow Atlas](../workflows/README.md)              | Must remain implementation trace source                   |
| [Project Score Pack](../project-score/README.md)      | Must remain evidence/interview source                     |
| [Reviewer Package](../reviewer/README.md)             | Required                                                  |
| [Case Study](../case-study/README.md)                 | Required                                                  |
| [Known Limitations](../reviewer/known-limitations.md) | Required                                                  |
| [Screenshot Audit](../reviewer/screenshots.md)        | Required                                                  |
| [v0.2 Release Notes](V0_2_0_RELEASE_NOTES.md)         | Required                                                  |
| [Changelog](../../CHANGELOG.md)                       | Required                                                  |
| Internal links                                        | Must be checked                                           |
| Secrets/real data                                     | Must be absent                                            |
