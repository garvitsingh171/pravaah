# SEC-19 security regression testing

The backend suite sends real HTTP requests through Express, Pravaah authentication and authorization middleware, controllers, services, repositories, Prisma, and a disposable PostgreSQL database. The only replacement is Clerk's external verification boundary: a small test double maps synthetic bearer tokens to synthetic Clerk IDs. It does not test Clerk's cryptographic token verification. Internal user lookup, status, role, clinic ownership, and all tested database writes use production code.

## Local setup

Use Node.js 24, npm, and Docker. The commands below were verified with a local `postgres:16-alpine` container. The `--rm` container contains only synthetic records. Never reuse a development or remote database.

```bash
docker run --rm -d --name pravaah-sec19-postgres \
  -e POSTGRES_USER=pravaah_test -e POSTGRES_PASSWORD=pravaah_test \
  -e POSTGRES_DB=pravaah_security_test \
  -p 127.0.0.1:55432:5432 postgres:16-alpine
export NODE_ENV=test SECURITY_TEST_MODE=1
export TEST_DATABASE_URL='postgresql://pravaah_test:pravaah_test@127.0.0.1:55432/pravaah_security_test'
DATABASE_URL="$TEST_DATABASE_URL" npm run prisma:generate -w apps/server
npm run security:migrate -w apps/server
npm run test:security -w apps/server
npm run test -w apps/web -- src/features/patients/PatientsPage.test.tsx src/features/doctors/DoctorsPage.test.tsx src/features/appointments/AppointmentsPage.test.tsx src/components/ui/RiskExplanation.test.tsx
docker stop pravaah-sec19-postgres
```

`prisma:generate` needs `DATABASE_URL` because Prisma's config reads it. The migration and test scripts map `TEST_DATABASE_URL` to `DATABASE_URL` only after the guard passes.

The guard requires `NODE_ENV=test`, `SECURITY_TEST_MODE=1`, a parsed PostgreSQL URL whose host is `127.0.0.1`, `localhost`, or the CI `postgres` service, and database name exactly `pravaah_security_test`. It rejects a mismatched `DATABASE_URL`, missing credentials, and URL host override parameters. Both migration and fixture cleanup call this guard. The suite truncates application tables only inside the dedicated database before each test and after the suite; no external database is contacted by the tests. Migrations are applied with `prisma migrate deploy`; failures stop the suite.

## Fixtures and failure interpretation

`apps/server/tests/security/fixtures.ts` creates fictional Sunrise and Riverside clinics, active Admin and Staff users, a suspended user, an active user without clinic membership, private and shared patients and doctors, multiple appointments and queue entries, LOW/MEDIUM/HIGH predictions, and a synthetic invitation. IDs are stable; dates are relative to the run date. Each test recreates fixtures, so order does not matter. Tests run in one worker to prevent truncation races. Resend and Geoapify keys are cleared before the application loads, so no provider request is made.

`stateSnapshot.ts` captures business fields and counts, including the entire queue order, global patient/doctor profiles, role and membership state, appointment status, prediction records and outcomes, feedback, invitation status, activity count, and refresh-work records. A denied response fails if any captured state changes. Timestamps and security logs are intentionally excluded. If a fixture reset fails, investigate database guard, migrations, schema drift, and PostgreSQL readiness before changing an assertion. A 403 alone does not demonstrate immutability.

To cover a new route, add a synthetic fixture for both clinics, exercise an allowed request, then make requests from the opposite clinic in both directions. Snapshot business state around denied mutations. If the route accepts free text or sorting, add a tailored injection case. If it renders user content, add a test on the real React component. Keep Clerk mocked only at its external boundary.

CI uses `.github/workflows/security-regression.yml` on main-branch pull requests and pushes, plus manual dispatch. Path filters are intentionally omitted so a required check is present on every pull request. The status check is **Security regression (PostgreSQL + XSS)**. Add this check to GitHub branch protection or a ruleset to require it. Branch protection has not been changed by this implementation. CI uses a PostgreSQL service and synthetic credentials; it does not need production Clerk or database secrets. The job fails on migration or test failures and writes step outcomes to the GitHub job summary.

See [SECURITY_COVERAGE_MATRIX.md](SECURITY_COVERAGE_MATRIX.md) for exact route coverage and remaining gaps. The broader route and risk inventory is in `docs/audits/security/V0_5_API_SECURITY_MATRIX.md`.
