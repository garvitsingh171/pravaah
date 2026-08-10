# Changelog

All notable changes to Project Pravaah will be documented in this file.

The project uses `v0.1.0` as the frozen MVP baseline, keeps `v0.2.0` as historical release-candidate documentation, and now prepares `v0.3.0` as the active release candidate pending production verification.

## Unreleased

### Pending

- Owner production verification, GO/NO-GO decision, Git tag, and GitHub Release publication for `v0.3.0`.

## v0.3.0 - Release Candidate / Production Verification Pending

Release state: repository-local release preparation; final production verification pending.

### Added

- Canonical v0.3 release notes covering the current clinic-side product boundary.
- v0.3 release identity state with production URLs, deployed SHAs, release date, Git tag, and GitHub Release marked pending owner verification.
- v0.3 release checklist separating repository-verifiable checks from owner/manual production verification.
- Release-control language for root product version `0.3.0` while preserving private workspace package versions at `0.1.0`.

### Verified From Source During Release Preparation

- Public landing, Clerk auth routes, onboarding, protected route gating, and SPA fallback configuration are present in source.
- Clerk identity, internal active `User` resolution, Admin/Staff roles, and backend clinic isolation are implemented.
- Clinic provisioning creates the clinic and first Admin transactionally from trusted Clerk identity data.
- Appointment creation validates clinic/doctor/patient ownership, checks exact same-time active doctor conflicts, and creates appointment, queue entry, and no-show prediction in one transaction.
- Queue status updates and manual reorder are human-controlled and backend-validated.
- No-show assistance is deterministic, rule-based, explainable, and advisory; it is not trained machine learning.
- Browser E2E coverage remains intentionally absent.

### Verification Required Before Release

- `npm install`
- `npx prettier --check README.md "docs/**/*.md"`
- `npm run lint`
- `npm run test:web`
- `npm run test:server`
- `npm run build:web`
- `npm run build:server`
- `npm run check`
- `npx prisma validate --schema apps/server/prisma/schema.prisma`
- `npm run prisma:generate --workspace apps/server`
- production frontend deployment and smoke check
- production backend deployment, migration, health, and database connectivity checks
- Clerk production configuration and auth smoke checks
- Admin, Staff, cross-clinic, onboarding, appointment, queue, and dashboard smoke checks
- owner GO/NO-GO decision
- Git tag and GitHub Release publication by owner after GO

## v0.2.0 - Historical Release Candidate

Release state: historical candidate documentation. Superseded as the active candidate by `v0.3.0`; retained for release history.

### Added

- Public landing page and public routing.
- Clerk sign-up route.
- Identity-only onboarding status API.
- Authenticated-but-unprovisioned onboarding state.
- Transactional clinic and first Admin provisioning.
- Orphan clinic prevention through transactional bootstrap and idempotent replay handling.
- First-time clinic onboarding UI.
- Optional fictional sample clinic data.
- Onboarding-aware application routing.
- Functional Admin clinic settings page.
- First-run setup checklist.
- Backend tests for onboarding, authorization, provisioning, validation, and related service behavior.
- Frontend tests for onboarding-aware routing, onboarding UI, checklist, doctor edit, patient edit, queue reorder, and API behavior.
- Historical note: this candidate previously included Playwright browser E2E flows, but the current repository has intentionally removed browser-based E2E testing and defers it to a future release.
- Doctor edit workflow.
- Patient edit workflow.
- Manual queue reorder controls.

### Changed

- Split the server production TypeScript build from test-aware compiler settings and clean stale `dist` output before emitting.
- Updated product, setup, deployment, testing, troubleshooting, and interview documentation for the v0.2 candidate.

## v0.1.0 - MVP Complete And Frozen

### Added

- Clerk sign-in for manually provisioned Admin and Staff users.
- Internal Pravaah `User` mapping for role, status, and clinic access.
- Dashboard, doctor, patient, appointment, queue, and starter no-show risk workflows.
- Rule-based no-show prediction storage with explainable reasons.
- Prisma/PostgreSQL schema and demo seed data.
- Backend Vitest coverage for critical MVP behavior.

### Historical Limitations

- Public sign-up and self-service onboarding were not included.
- Internal users and clinic access required manual provisioning.
- Clinic settings UI was a placeholder in the frozen v0.1 release.
- Doctor and patient edit screens were not implemented in the frozen v0.1 frontend.
- Queue reorder existed in the backend API but was not exposed in the frozen v0.1 frontend UI.
- Patient login and doctor login were not included.
- No trained machine-learning model; no-show scoring was deterministic rule logic.

### Release References

- Release freeze record: `docs/releases/V0_1_0_MVP_FREEZE.md`
- GitHub release: `<GITHUB_RELEASE_URL>`
- Vercel deployed commit: `<VERCEL_DEPLOYED_COMMIT_SHA>`
- Render deployed commit: `<RENDER_DEPLOYED_COMMIT_SHA>`
- Database snapshot: `<NEON_SNAPSHOT_NAME>`
