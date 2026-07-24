# Contributing

## Principle

Keep every change small, reviewable, and aligned with the implemented MVP:

```txt
Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter no-show risk scoring
```

Release status:

- `v0.1.0` is frozen.
- `v0.2.0` is active development.
- Active v0.2 scope source of truth: [V0_2_SCOPE.md](./V0_2_SCOPE.md).

## Issue Selection

Use existing issue templates in `.github/ISSUE_TEMPLATE`:

- bug report
- docs task
- feature task
- refactor task
- research task
- setup task
- test task

Before starting, confirm:

- goal
- scope
- out-of-scope items
- likely files affected
- acceptance criteria
- checks to run

## Branch Naming

Use short descriptive names:

```txt
docs/rebuild-current-codebase-docs
backend/add-queue-reorder-tests
frontend/add-patient-edit-page
fix/appointment-status-conflict
test/dashboard-backfill
```

## Commit Messages

Use:

```txt
type: short description
```

Common types:

- `docs`
- `feat`
- `fix`
- `test`
- `refactor`
- `setup`
- `chore`

Examples:

```txt
docs: rebuild API reference from routes
feat: add patient edit screen
fix: prevent queue status sync conflict
test: cover dashboard prediction backfill
```

## Pull Request Expectations

A PR should:

- link the issue/task
- describe the change clearly
- stay within scope
- avoid unrelated files
- include screenshots for UI changes
- mention migrations for schema changes
- update docs when behavior, setup, API, schema, or scope changes
- run relevant checks or explain why they were not run

Use `.github/pull_request_template.md`.

Onboarding and security work must include tests. Schema changes must include migration notes, rollback considerations, and documentation updates. PRs should remain small and focused on one issue or tightly related dependency group.

## Running Checks

Common commands:

```bash
npm run lint
npm run test -w apps/server
npm run check -w apps/server
npm run build -w apps/web
```

Root commands:

```bash
npm run format
npm run check
```

Be careful: `npm run format` writes across the repo, and root `npm run check` runs builds that can write `dist` outputs. For docs-only work, prefer a docs-only Prettier check unless the project owner wants generated build output touched.

## Docs Update Rule

Update docs in the same PR when changing:

- MVP scope
- API routes or response shape
- auth behavior
- role/clinic access rules
- Prisma schema or migrations
- setup/env vars/scripts
- frontend routes/pages/features
- deployment steps
- testing commands or coverage expectations

Never leave future ideas written as implemented behavior.

Source-of-truth documentation:

- Frozen MVP boundary: [MVP.md](./MVP.md)
- Active v0.2 scope: [V0_2_SCOPE.md](./V0_2_SCOPE.md)
- v0.1 release freeze record: [releases/V0_1_0_MVP_FREEZE.md](./releases/V0_1_0_MVP_FREEZE.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Roadmap: [ROADMAP.md](./ROADMAP.md)

Release-related documentation must stay aligned. Future feature PRs must not silently modify the v0.2 scope; scope changes need an explicit reviewed product decision.

## AI Assistant Usage Rule

AI tools may help, but they must follow the repo:

- scan current code before editing
- use `docs/AI_CONTEXT.md`
- keep the stack unchanged unless the task explicitly changes it
- distinguish implemented, partial, and future work
- avoid advanced AI claims for rule-based scoring
- avoid adding patient/doctor login unless approved
- avoid large unrelated rewrites

Review generated changes manually.

## Review Checklist

Before requesting review:

- code/docs match the issue scope
- no secrets or patient data are committed
- auth/security checks are not weakened
- Prisma schema and migrations match when schema changes
- API docs match actual routes
- frontend docs match actual pages
- tests/checks run or are explained
- known limitations are documented

## Definition Of Done

A task is done when:

- acceptance criteria are met
- implementation and docs agree
- relevant tests/checks pass or failures are documented
- no unrelated files are changed
- reviewer can understand what changed and why

## What Not To Change Casually

- runtime behavior in docs-only tasks
- database schema without a migration plan
- auth/authorization checks
- environment variable semantics
- source file names or folders without a clear reason
- MVP scope to include post-MVP features
