# Changelog

All notable changes to Project Pravaah will be documented in this file.

The format follows a simple Keep a Changelog style. This project uses `v0.1.0` as the frozen MVP baseline and `v0.2.0` as the active development release.

## Unreleased

### Added

- Initialized v0.2 documentation scope for Public Demo and Self-Service Clinic Onboarding.
- Documented the planned onboarding architecture boundaries, including authenticated-but-unprovisioned user state.
- Documented planned transactional clinic and first Admin provisioning rules for v0.2.

### Changed

- Marked v0.1.0 as the stable frozen MVP release in documentation.

### Planned

- Public landing page and public routes.
- Clerk sign-up flow.
- Onboarding status API.
- Clinic and first Admin transactional bootstrap.
- Orphan clinic prevention.
- First-time clinic onboarding UI.
- Isolated sample clinic data.
- Onboarding-aware routing.
- Functional clinic settings page.
- First-run setup checklist.
- Hardened public onboarding APIs.
- Backend, frontend, and end-to-end onboarding tests.
- Doctor edit workflow.
- Patient edit workflow.
- Queue reorder controls.

## v0.1.0 - MVP Complete And Deployed

### Added

- Clerk sign-in for manually provisioned Admin and Staff users.
- Internal Pravaah `User` mapping for role, status, and clinic access.
- Dashboard, doctor, patient, appointment, queue, and starter no-show risk workflows.
- Rule-based no-show prediction storage with explainable reasons.
- Prisma/PostgreSQL schema and demo seed data.
- Backend Vitest coverage for critical MVP behavior.

### Known Limitations

- Public sign-up and self-service onboarding are not included.
- Internal users and clinic access require manual provisioning.
- Clinic settings UI is a placeholder.
- Doctor and patient edit screens are not implemented in the frontend.
- Queue reorder exists in the backend API but is not exposed in the frontend UI.
- Patient login and doctor login are not included.
- No trained machine-learning model; no-show scoring is deterministic rule logic.

### Release References

- Release freeze record: `docs/releases/V0_1_0_MVP_FREEZE.md`
- GitHub release: `<GITHUB_RELEASE_URL>`
- Vercel deployed commit: `<VERCEL_DEPLOYED_COMMIT_SHA>`
- Render deployed commit: `<RENDER_DEPLOYED_COMMIT_SHA>`
- Database snapshot: `<NEON_SNAPSHOT_NAME>`
