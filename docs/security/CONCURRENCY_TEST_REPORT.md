# Issue #302 verification report

Date: 31 October 2026. See [the concurrency audit](CONCURRENCY_AUDIT.md) for workflow invariants and source traces.

## Test environment and database safety

Tests ran against a newly created `postgres:16-alpine` Docker container named `pravaah-302-postgres`, bound only to `127.0.0.1:55432`. `docker ps` showed no pre-existing running containers. Before migration, inspection showed the expected container image and port, an anonymous container-owned PostgreSQL data volume, and `current_database() = pravaah_security_test` with the dedicated `pravaah_test` user. The 26 committed migrations were applied there through the guarded `security:migrate` script. Synthetic fixtures were reset only in that database. No production Neon connection, existing application database, or real patient data was used. The test-owned container is stopped after verification.

## Commands and results

| Command/check                                                                                                            | Result                                                                                      |
| ------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- |
| `npm run security:migrate -w apps/server` with guarded test environment                                                  | PASS; 26 migrations applied                                                                 |
| `npx vitest run --config vitest.security.config.ts -t 'PostgreSQL concurrency invariants'` with guarded test environment | PASS; 11 tests per run, five targeted runs after all scenarios were present (55 executions) |
| `npm run test:security -w apps/server` with guarded test environment                                                     | PASS; 72 tests, 0 failed                                                                    |
| `npm run test -w apps/server`                                                                                            | PASS; 513 passed, 2 skipped opt-in integration tests                                        |
| `npm run check -w apps/server`                                                                                           | PASS; TypeScript                                                                            |
| `npm run build`                                                                                                          | PASS; web and server                                                                        |
| `npm run lint`                                                                                                           | PASS as configured; web ESLint ran, server lint script only prints that it is unconfigured  |
| `npx prisma validate` with disposable test URL                                                                           | PASS                                                                                        |
| Prettier check and `git diff --check`                                                                                    | PASS                                                                                        |
| GitHub Actions remote run                                                                                                | NOT RUN locally; YAML parsed by Prettier, remote execution pending a push/PR                |

The original 61-test security suite passed before edits. No confirmed production defect was reproduced, so no production service, repository, or schema fix was made. The first reorder test draft accepted a no-op request and incorrectly expected a conflict. The test was corrected before final verification; this was a test error.

## Coverage and limitations

The 11 new tests cover same-slot and partial-overlap booking, independent clinics, booking versus cancellation and reschedule, foreign booking, simultaneous reorder and foreign entry, queue and appointment terminal status races, duplicate invitation acceptance, accept versus revoke, prediction worker claims and clinic scoping, and an injected booking rollback fault. They assert HTTP outcomes and persisted rows. The worker test checks one claim and prediction run after concurrent drains and no extra run on replay. The rollback test injects an exception using a temporary PostgreSQL trigger and removes it in `finally`.

The tests start operations concurrently through the real HTTP application and five-connection PostgreSQL pool. They do not force a barrier at each internal read/write point, so the five passing targeted runs are regression evidence rather than proof against every possible interleaving. The existing queue opt-in test expects a separate `pravaah_298_test` Unix-socket database and was skipped by the default server suite. The old Neon invitation integration test was also skipped; it was not pointed at any existing application database. Prediction lease expiration, stale acknowledgment, forced worker failure/retry, and all terminal status combinations remain untested against PostgreSQL. Shared Doctor scheduling across clinics is currently clinic-scoped and needs a product policy decision before a global conflict invariant is asserted.

## Issue acceptance criteria

| Criterion                                                  | Status   | Evidence or gap                                                                                                                         |
| ---------------------------------------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Review appointment, queue, invitation, prediction behavior | Complete | Audit source traces and matrix                                                                                                          |
| Isolated PostgreSQL integration tests                      | Complete | Verified disposable PostgreSQL 16 container and guard                                                                                   |
| Conflicting and non-conflicting booking outcomes           | Complete | Eight-contender, overlap, and independent clinic tests                                                                                  |
| Queue reorder final order                                  | Complete | Concurrent reorder test and committed order assertion                                                                                   |
| Appointment/queue status consistency                       | Partial  | Cancellation overlap tested; full transition matrix remains                                                                             |
| Invitation acceptance/revocation and duplicate membership  | Complete | Concurrent accept/revoke and duplicate accept tests                                                                                     |
| Prediction processing and retries avoid duplicate effects  | Partial  | Claim/replay tested; forced failure and lease recovery remain                                                                           |
| Multi-step rollback                                        | Complete | Queue insert fault and committed-state counts                                                                                           |
| Cross-clinic mutation prevention                           | Partial  | Foreign booking and queue entry tested concurrently; all other mutation combinations not exhaustively tested                            |
| Shared Doctor/Patient isolation                            | Partial  | Existing security tests cover scoped reads and shared profiles; new tests cover independent clinics; global Doctor schedule policy open |
| Reproducible fix for every confirmed defect                | Complete | No production defect confirmed; no production fix required                                                                              |
| Repeated concurrent runs                                   | Complete | 11 scenarios passed five targeted runs after additions                                                                                  |
| TypeScript, lint, build, existing regressions              | Complete | Commands above; server lint remains an unconfigured script                                                                              |
| CI integration                                             | Partial  | Existing PostgreSQL security workflow includes new tests; remote run unverified                                                         |
| Verification report                                        | Complete | This report and audit                                                                                                                   |
| No production or real data modification                    | Complete | Disposable target verified; no external database used                                                                                   |
