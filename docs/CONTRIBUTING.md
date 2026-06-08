<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Contributing to Pravaah

## 1. Purpose

This guide explains how to contribute to Pravaah without making the repository messy.

It is meant for:

- Garvit as the project owner
- future collaborators
- AI coding assistants
- reviewers
- interview preparation

The goal is simple:

> Every change should be small, reviewable, and aligned with the locked Pravaah direction.

## 2. Project rules

Follow these rules:

- Treat Pravaah as a clinic appointment and queue management system.
- Keep the locked stack unchanged.
- Keep MVP scope focused.
- Use the feature-module backend structure.
- Keep docs and code aligned.
- Do not introduce unrelated app examples.
- Do not add advanced post-MVP features into MVP issues.
- Do not let AI tools rewrite the product direction casually.

## 3. Locked stack reminder

| Layer    | Choice                  |
| -------- | ----------------------- |
| Frontend | React + TypeScript      |
| Backend  | Express + TypeScript    |
| Auth     | Clerk                   |
| Database | Neon PostgreSQL         |
| ORM      | Prisma                  |
| Repo     | npm workspaces monorepo |

## 4. Source-of-truth docs

Core docs:

- `docs/ARCHITECTURE.md`
- `docs/MVP.md`
- `docs/DATABASE_DESIGN.md`
- `docs/ROADMAP.md`
- `docs/USER_ROLES.md`
- `docs/SETUP.md`
- `docs/AI_CONTEXT.md`

When docs conflict:

1. Architecture decides technical direction.
2. MVP decides product boundary.
3. Database design decides schema direction.
4. Roadmap decides implementation order.
5. AI_CONTEXT guides AI tools.

## 5. Work flow

1. Create or pick a clear issue.
2. Confirm the issue has:
    - goal
    - scope
    - tasks
    - acceptance criteria
    - notes/constraints
3. Create a focused branch.
4. Make one coherent change.
5. Run formatting and checks.
6. Open pull request.
7. Fill PR checklist honestly.
8. Review and merge only when ready.

## 6. Issue writing guidelines

Every issue should answer:

- What problem are we solving?
- Why does this matter for MVP?
- What is in scope?
- What is out of scope?
- What files/areas are likely affected?
- How do we know the work is complete?

### Good issue examples

```txt
[Database] Add Prisma schema for MVP entities
[Backend] Add appointment booking API
[AI] Add starter no-show risk scoring service
[Frontend] Add live queue screen
[Docs] Align MVP AI scope and database model
```

### Bad issue examples

```txt
Add everything
Improve app
Make AI better
Create dashboard stuff
Fix backend
```

## 7. Branch naming

Use short, descriptive branch names.

Examples:

```txt
docs/align-mvp-ai-database
setup/add-workspace-skeleton
database/add-core-schema
backend/add-appointment-api
frontend/add-queue-screen
ai/add-risk-scoring-service
fix/prevent-slot-conflict
```

## 8. Commit messages

Use this format:

```txt
type: short description
```

Common types:

- `docs`
- `setup`
- `feat`
- `fix`
- `refactor`
- `test`
- `database`
- `ai`
- `chore`

Examples:

```txt
docs: align MVP AI scope and database model
setup: add workspace package manifests
database: add prisma schema for core entities
feat: add appointment booking API
ai: add starter no-show risk scoring
fix: prevent duplicate doctor clinic link
```

## 9. Pull request rules

A pull request should be small enough to review quickly.

A PR should usually do one of these:

- update one related group of docs
- add one backend module
- add one UI feature
- add one database migration
- fix one bug
- improve one workflow

Do not combine unrelated work.

## 10. PR checklist

Every PR should confirm:

- linked issue is clear
- change stays within scope
- docs are updated if needed
- no unrelated files are included
- formatting was run
- checks were run or failure is explained
- acceptance criteria are met
- stack has not changed unexpectedly

## 11. Database contribution rules

Database changes are serious.

Before changing schema, ask:

- Does this support MVP?
- Does this break future multi-clinic growth?
- Does this need a join table?
- Does this require a migration?
- Does this need an index?
- Does this affect existing data?
- Does this require docs update?

Rules:

- Prisma schema is the source of truth.
- Commit migration files.
- Use meaningful migration names.
- Do not edit applied migrations casually.
- Do not store real patient data in seed files.
- Do not make Doctor/Patient directly clinic-locked when join tables are intended.

## 12. Backend contribution rules

Backend should stay feature-module based.

Each module can include:

- routes
- controller
- service
- repository
- validation
- types

Rules:

- Controllers should be thin.
- Services should hold business logic.
- Repositories should hold Prisma calls.
- Middleware should handle auth and shared request concerns.
- Role checks should happen in backend.
- Input validation should happen before business logic.
- Errors should be consistent.

## 13. Frontend contribution rules

Frontend should focus on clinic staff workflows.

Rules:

- Keep screens simple and useful.
- Show loading, empty, and error states.
- Do not hide backend errors silently.
- Do not treat frontend checks as final security.
- Keep API calls organized.
- Use TypeScript types clearly.
- Avoid over-polishing before core flow works.

## 14. AI assistant usage rules

AI tools can help, but they must be controlled.

When using ChatGPT, Copilot, Codex, Cursor, or similar tools:

- provide `AI_CONTEXT.md`
- ask AI to scan existing docs first
- ask AI to stay within MVP scope
- reject suggestions that change stack without reason
- reject suggestions that add patient portal or advanced AI into MVP
- ask AI to explain trade-offs
- review every generated change manually

Never blindly accept AI-generated architecture.

## 15. Testing expectations

Testing can grow gradually.

MVP priority:

- API health check
- validation tests for critical flows
- appointment conflict tests
- queue status transition tests
- no-show scoring unit tests
- auth middleware tests if practical

Manual testing is acceptable early, but critical logic should eventually have automated tests.

## 16. Documentation contribution rules

Update docs when:

- stack changes
- database changes
- MVP scope changes
- role rules change
- setup steps change
- deployment steps change
- AI context changes

Do not leave old decisions ambiguous. Mark rejected ideas clearly as post-MVP or deprecated.

## 17. Definition of done

A task is done when:

- the requested work is implemented
- acceptance criteria are satisfied
- code/docs are formatted
- checks are run or failure is explained
- related docs are updated
- no unrelated files are changed
- PR description explains the change clearly

## 18. Final contribution principle

Do less, but do it cleanly.

A small correct PR is better than a large confusing PR.
