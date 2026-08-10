# Release Checklist

This checklist records the `v0.3.0` release-finalization state.

## Repository-Verifiable Checks

| Check                      | Command or action                                                            | Status                                                              |
| -------------------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Product version            | Inspect `package.json` and `package-lock.json`                               | `0.3.0`                                                             |
| Workspace versions         | Inspect `apps/web/package.json` and `apps/server/package.json`               | Private workspaces remain `0.1.0`                                   |
| Markdown formatting        | `npx prettier --check README.md "docs/**/*.md"`                              | Passed during release preparation                                   |
| Workspace lint             | `npm run lint`                                                               | Passed during release preparation; backend lint placeholder remains |
| Frontend tests             | `npm run test:web`                                                           | Passed during release preparation                                   |
| Backend tests              | `npm run test:server`                                                        | Passed during release preparation                                   |
| Frontend build             | `npm run build:web`                                                          | Passed during release preparation                                   |
| Backend build              | `npm run build:server`                                                       | Passed during release preparation                                   |
| Full workspace check       | `npm run check`                                                              | Passed during release preparation                                   |
| Prisma schema validation   | `npx prisma validate --schema apps/server/prisma/schema.prisma`              | Passed during release preparation                                   |
| Prisma client generation   | `npm run prisma:generate --workspace apps/server`                            | Passed during release preparation                                   |
| Backend emitted test files | `find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)` | Passed during release preparation; no matching files                |
| Static config review       | Env examples, `apps/web/vercel.json`, build config, and route config         | Reviewed during release preparation                                 |
| Documentation consistency  | README, docs index, changelog, release identity, release notes               | Finalized for v0.3.0                                                |

## Owner Production Verification

| Area     | Check                                                                  | Status |
| -------- | ---------------------------------------------------------------------- | ------ |
| Clerk    | Fresh external Clerk signup                                            | PASS   |
| Clerk    | Fresh-user onboarding redirect and flow                                | PASS   |
| Vercel   | Production frontend deployment at `https://pravaah.garvitsingh171.com` | PASS   |
| Vercel   | Deployed commit SHA `6f8864c0e5ff46f15884fc2498cfafa214af4f03`         | PASS   |
| Render   | Production backend deployment at `https://pravaah-wmeh.onrender.com/`  | PASS   |
| Render   | Deployed commit SHA `6f8864c0e5ff46f15884fc2498cfafa214af4f03`         | PASS   |
| Render   | Backend `/api/health`                                                  | PASS   |
| Database | Prisma migrate deploy                                                  | PASS   |
| Database | Database connectivity                                                  | PASS   |
| Product  | Clinic provisioning                                                    | PASS   |
| Product  | Doctor flow                                                            | PASS   |
| Product  | Patient flow                                                           | PASS   |
| Product  | Appointment flow                                                       | PASS   |
| Product  | No-show assistance                                                     | PASS   |
| Product  | Queue workflow                                                         | PASS   |
| Product  | Manual reorder                                                         | PASS   |
| Product  | Dashboard                                                              | PASS   |
| Security | Admin flow                                                             | PASS   |
| Security | Staff authorization                                                    | PASS   |
| Security | Cross-clinic rejection                                                 | PASS   |
| Release  | Production smoke                                                       | PASS   |
| Release  | GO/NO-GO decision                                                      | GO     |

## Release Actions

| Action                       | Status                                           |
| ---------------------------- | ------------------------------------------------ |
| Actual release date recorded | Missing; owner supplied `YYYY-MM-DD` placeholder |
| Git tag `v0.3.0`             | Owner action; not created by Codex               |
| GitHub Release               | Owner action; URL not provided                   |
| Post-release smoke test      | Production smoke reported PASS                   |

## Production Safety Rules

- Do not run `prisma migrate reset`, `prisma db push`, development migrations, production seed commands, or destructive database actions against production.
- Do not expose `DATABASE_URL`, `CLERK_SECRET_KEY`, webhook secrets, or real credentials in committed files or frontend env vars.
- Do not invent missing release date or GitHub Release URL values.
