# Release Checklist

Use this checklist before marking `v0.3.0` as released. Keep repository-verifiable checks separate from owner/manual production checks.

## Repository-Verifiable Checks

| Check                      | Command or action                                                            | Status expectation                                       |
| -------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------- |
| Install dependencies       | `npm install`                                                                | Required before local validation                         |
| Product version            | Inspect `package.json` and `package-lock.json`                               | Root version must be `0.3.0`                             |
| Workspace versions         | Inspect `apps/web/package.json` and `apps/server/package.json`               | Private workspaces remain `0.1.0` unless policy changes  |
| Markdown formatting        | `npx prettier --check README.md "docs/**/*.md"`                              | Required                                                 |
| Workspace lint             | `npm run lint`                                                               | Required; backend lint currently prints placeholder text |
| Frontend tests             | `npm run test:web`                                                           | Required                                                 |
| Backend tests              | `npm run test:server`                                                        | Required                                                 |
| Frontend build             | `npm run build:web`                                                          | Required                                                 |
| Backend build              | `npm run build:server`                                                       | Required                                                 |
| Full workspace check       | `npm run check`                                                              | Required                                                 |
| Prisma schema validation   | `npx prisma validate --schema apps/server/prisma/schema.prisma`              | Required                                                 |
| Prisma client generation   | `npm run prisma:generate --workspace apps/server`                            | Required                                                 |
| Backend emitted test files | `find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)` | Required after backend build; expected no output         |
| Migration review           | Inspect [migrations](../../apps/server/prisma/migrations)                    | Required                                                 |
| Static config review       | Inspect env examples, `apps/web/vercel.json`, build config, and route config | Required                                                 |
| Documentation consistency  | Review README, docs index, changelog, release identity, and release notes    | Required                                                 |
| No accidental debug code   | Manual `git diff` review                                                     | Required                                                 |

## Owner/Manual Production Verification

Do not mark these complete from repository state alone.

| Area     | Check                                                                                  | Status before owner evidence |
| -------- | -------------------------------------------------------------------------------------- | ---------------------------- |
| Clerk    | Production instance selected                                                           | Pending                      |
| Clerk    | Public sign-up mode matches release intent                                             | Pending                      |
| Clerk    | Sign-up restrictions or allowlists reviewed                                            | Pending                      |
| Clerk    | Frontend publishable key configured                                                    | Pending                      |
| Clerk    | Backend secret key configured only on backend                                          | Pending                      |
| Clerk    | Production domain and redirects configured                                             | Pending                      |
| Clerk    | Sign-up, sign-in, sign-out, and onboarding redirect manually verified                  | Pending                      |
| Vercel   | Production frontend deployment completed                                               | Pending                      |
| Vercel   | Production frontend URL and custom domain recorded                                     | Pending                      |
| Vercel   | Deployed commit SHA recorded                                                           | Pending                      |
| Vercel   | Production `VITE_API_BASE_URL`, `VITE_CLERK_PUBLISHABLE_KEY`, and `VITE_SITE_URL` set  | Pending                      |
| Vercel   | Successful build and HTTPS verified                                                    | Pending                      |
| Vercel   | Direct route refresh verified for public, auth, onboarding, and protected paths        | Pending                      |
| Render   | Production backend deployment completed                                                | Pending                      |
| Render   | Production backend URL recorded                                                        | Pending                      |
| Render   | Deployed commit SHA recorded                                                           | Pending                      |
| Render   | Build result, migration result, start result, and health endpoint recorded             | Pending                      |
| Render   | `DATABASE_URL`, `CLERK_SECRET_KEY`, `CLIENT_URL`, and CORS origin verified             | Pending                      |
| Database | `npm run prisma:migrate:deploy --workspace apps/server` run in production environment  | Pending                      |
| Database | Database connectivity verified                                                         | Pending                      |
| Database | No production seed/reset/destructive migration performed                               | Pending                      |
| Product  | Public landing smoke test                                                              | Pending                      |
| Product  | Fresh sign-up, onboarding, clinic creation, first Admin creation, and setup verified   | Pending                      |
| Product  | Doctor, patient, appointment, no-show assistance, queue, reorder, and dashboard tested | Pending                      |
| Security | Anonymous rejection verified                                                           | Pending                      |
| Security | Admin permissions verified                                                             | Pending                      |
| Security | Staff permissions and Staff denied Admin-only action verified                          | Pending                      |
| Security | Cross-clinic rejection and trusted role/clinic identity verified                       | Pending                      |
| Release  | GO/NO-GO decision recorded                                                             | Pending                      |
| Release  | Actual release date recorded                                                           | Pending                      |
| Release  | Source SHA, deployed SHAs, and URLs recorded                                           | Pending                      |
| Release  | Release docs finalized from candidate to released state                                | Pending                      |
| Release  | Git tag `v0.3.0` created by owner                                                      | Pending                      |
| Release  | GitHub Release published by owner                                                      | Pending                      |
| Release  | Post-release smoke test completed                                                      | Pending                      |

## Manual Product Smoke Path

```txt
public landing
-> fresh sign-up
-> onboarding status
-> clinic creation
-> first Admin creation
-> first-run setup
-> doctor
-> patient
-> appointment
-> no-show assistance
-> arrival
-> queue
-> multiple queue entries
-> reorder
-> call
-> complete
-> dashboard
-> sign-out
```

## Production Safety Rules

- Do not run `prisma migrate reset`, `prisma db push`, development migrations, production seed commands, or destructive database actions against production.
- Do not expose `DATABASE_URL`, `CLERK_SECRET_KEY`, webhook secrets, or real credentials in committed files or frontend env vars.
- Do not create the Git tag, publish the GitHub Release, merge a release PR, or close the release issue until owner production verification is complete.
