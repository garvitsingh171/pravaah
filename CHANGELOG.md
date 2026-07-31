# Changelog

All notable changes to Project Pravaah will be documented in this file.

The project uses `v0.1.0` as the frozen MVP baseline and `v0.2.0` as the current release candidate.

## Unreleased

### Changed

- Reorganized documentation into product, architecture, guides, scope, releases, interview, engineering, AI, and asset sections.
- Prepared v0.2 publication docs, demo checklist, release notes, and screenshot manifest.

## v0.2.0 - Release Candidate

Release state: documentation ready; final release verification pending.

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
- Playwright E2E flows for public routing, sign-up onboarding, sample data, edit workflows, queue reorder, and smoke journeys.
- Doctor edit workflow.
- Patient edit workflow.
- Manual queue reorder controls.

### Changed

- Split the server production TypeScript build from test-aware compiler settings and clean stale `dist` output before emitting.
- Updated product, setup, deployment, testing, troubleshooting, and interview documentation for the v0.2 candidate.

### Verification Required Before Release

- `npm run lint`
- `npm run test:web`
- `npm run test:server`
- `npm run test:e2e`
- `npm run build:web`
- `npm run build:server`
- deployed frontend smoke check
- deployed backend health check
- screenshot capture for the v0.2 asset manifest

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
