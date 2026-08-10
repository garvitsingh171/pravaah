# Changelog

All notable changes to Project Pravaah will be documented in this file.

The project uses `v0.1.0` as the frozen MVP baseline, keeps `v0.2.0` as historical release-candidate documentation, and records `v0.3.0` as the current released version after owner production verification.

## Unreleased

### Pending

- Actual calendar release date still needs owner-provided replacement for the placeholder `YYYY-MM-DD`.
- Git tag and GitHub Release URL are owner-controlled release actions and are not recorded in this repository yet.

## v0.3.0 - Released

Release state: production verified by owner with GO decision. Actual calendar release date was not provided; do not invent it.

### Added

- Canonical v0.3 release notes covering the current clinic-side product boundary.
- v0.3 release identity with production frontend/backend URLs and deployed SHAs.
- v0.3 release checklist with owner-reported production verification evidence.
- Release-control language for root product version `0.3.0` while preserving private workspace package versions at `0.1.0`.

### Verified For Production

- Source/main SHA: `6f8864c0e5ff46f15884fc2498cfafa214af4f03`.
- Frontend production URL: `https://pravaah.garvitsingh171.com`.
- Backend production URL: `https://pravaah-wmeh.onrender.com/`.
- Vercel deployed SHA: `6f8864c0e5ff46f15884fc2498cfafa214af4f03`.
- Render deployed SHA: `6f8864c0e5ff46f15884fc2498cfafa214af4f03`.
- Prisma migrate deploy, database connectivity, backend health, fresh Clerk signup, onboarding, clinic provisioning, Admin flow, Staff authorization, cross-clinic rejection, doctor, patient, appointment, no-show assistance, queue, manual reorder, dashboard, and production smoke: PASS.

### Known Limitations

- No patient login, doctor login, patient portal, or doctor portal.
- No billing, payments, prescriptions, inventory, full medical records, or hospital ERP workflow.
- No trained machine-learning model, accuracy metric, dataset, confidence probability, automatic cancellation, automatic no-show prioritization, or automatic queue reordering.
- No notification automation through SMS, WhatsApp, email, or voice.
- Current authorization uses one active `User.clinicId`; there is no mature multi-branch SaaS membership switcher.
- Appointment lifecycle enforcement blocks changes away from terminal states but does not implement a full transition matrix.
- Appointment booking does not enforce clinic opening/closing hours, slot-duration alignment, or buffer windows.
- `PatientClinic` attendance counters are read by no-show rules but are not automatically maintained by lifecycle changes.
- No browser E2E suite, no CI/CD workflow, and no production monitoring stack are present.

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
