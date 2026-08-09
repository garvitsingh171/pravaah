# Pravaah v0.2.0 Release Notes

Release name: Public Demo and Self-Service Clinic Onboarding.

Release state: release candidate. Documentation is prepared, but final release verification is pending.

Canonical reviewer status: [Project Status Dashboard](../reviewer/project-status.md).

## Summary

v0.2 turns Pravaah from an owner-provisioned MVP demo into a self-service product demonstration. A visitor can reach a public page, sign up with Clerk, enter an onboarding state without operational access, create a clinic, become that clinic's first Admin, optionally add fictional sample data, and continue into the existing clinic workflow.

The source tree contains the expected v0.2 implementation paths. This Codex documentation pass did not run tests, builds, manual browser workflow checks, deployment checks, migrations, or screenshot capture.

## Added

- Public landing page and public routes.
- Clerk sign-up route.
- Identity-only onboarding status API.
- Authenticated-but-unprovisioned state for first-run users.
- Transactional clinic plus first Admin bootstrap.
- Retry-safe orphan clinic prevention behavior.
- First-time clinic onboarding UI.
- Optional fictional sample data scoped to the new clinic.
- Onboarding-aware routing.
- Functional Admin clinic settings page.
- First-run setup checklist.
- Doctor edit workflow.
- Patient edit workflow.
- Manual queue reorder controls.
- Backend and frontend tests for critical v0.2 flows, with browser-based end-to-end testing intentionally deferred to a future release.
- Reorganized documentation, demo guide, interview pack, and asset manifest.
- Reviewer package with five-minute, fifteen-minute, and deep technical review paths.
- Canonical project status dashboard separating implementation state from deployment state.
- Technical evidence map linking product areas to exact frontend, backend, database, workflow, and test evidence.
- Full product case study, short portfolio case study, resume-ready summary, one-paragraph summary, and interview narrative.
- Release identity document, release checklist, reviewer demo guide, safe sample-data guide, screenshot audit, and reviewer diagrams.

## Preserved From v0.1

- Clerk sign-in for operational users.
- Internal `User` role, status, and clinic authorization.
- Doctor, patient, appointment, queue, dashboard, and starter no-show risk workflows.
- Rule-based no-show scoring with stored reasons and suggested actions.
- PostgreSQL/Prisma data model and demo seed path.

## Release Gate Classification

| Gate                            | Source inspection state                                   | Release state                                    |
| ------------------------------- | --------------------------------------------------------- | ------------------------------------------------ |
| Public landing page             | Present in frontend routes/features.                      | Needs browser verification.                      |
| Clerk sign-up                   | Present in frontend auth routes.                          | Needs Clerk environment verification.            |
| Identity-only onboarding        | Present in auth middleware/API paths.                     | Needs backend test run.                          |
| Onboarding status API           | Present as `GET /api/auth/onboarding-status`.             | Needs backend and manual workflow verification.  |
| Transactional clinic plus Admin | Present in auth onboarding repository/service.            | Needs test run against configured DB.            |
| Orphan prevention               | Present through transaction/idempotent conflict handling. | Needs regression verification.                   |
| Onboarding UI                   | Present in frontend onboarding feature.                   | Needs browser verification.                      |
| Sample data                     | Present as Admin clinic sample-data endpoint.             | Needs test run and manual isolation check.       |
| Onboarding-aware routing        | Present in protected app shell/routing.                   | Needs frontend and manual workflow verification. |
| Clinic settings                 | Present as Admin UI/API.                                  | Needs manual deployment smoke check.             |
| First-run checklist             | Present in frontend/dashboard onboarding state.           | Needs frontend verification.                     |
| Doctor edit                     | Present in frontend/backend.                              | Needs frontend and manual workflow verification. |
| Patient edit                    | Present in frontend/backend.                              | Needs frontend and manual workflow verification. |
| Queue reorder controls          | Present in frontend/backend.                              | Needs frontend and manual workflow verification. |
| Render build correction         | Present through backend production `tsconfig.build.json`. | Needs production build and dist inspection.      |

## Required Owner Commands

Run from the repository root unless noted:

```bash
npm install
npx prettier --check README.md "docs/**/*.md"
npm run lint
npm run test:web
npm run test:server
npm run build:web
npm run build:server
npm run check
find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)
git status
git diff --stat
```

Expected backend build dist check: no output.

## Deployment Verification

After deploying to the intended preview or production targets:

```bash
curl -fsS "$BACKEND_BASE_URL/api/health"
curl -fsS "$PUBLIC_FRONTEND_URL"
```

Manual browser checks:

- open public landing page signed out
- sign up through Clerk
- create clinic
- choose sample data decision
- reach dashboard
- update clinic settings as Admin
- add/edit doctor
- add/edit patient
- book appointment
- update and reorder queue
- confirm dashboard updates

Do not publish final release notes with placeholder URLs. Record verified URLs and deployed commit SHAs in [Release Identity](RELEASE_IDENTITY.md) only after the owner has verified the real deployed targets.

## Demo Assets

Screenshot capture is tracked in [v0.2 Assets](../assets/v0.2/README.md) and [Screenshot And Asset Audit](../reviewer/screenshots.md). No screenshot files are committed yet.

## Known Limitations

- No patient login or doctor login.
- No billing, prescriptions, inventory, full medical records, or communication automation.
- No trained ML model.
- No full multi-clinic membership model.
- No verified production URLs or screenshots committed yet.
- Backend lint script remains a placeholder.

## Release Decision

Current decision: documentation ready, release verification pending. Mark `v0.2.0` released only after the owner completes the commands, deployment smoke checks, and screenshot capture listed above.
