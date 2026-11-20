# Interview documentation audit

Purpose: track the checked-out documentation against source. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Audience: maintainers and interviewers. Status: `VERIFIED_FROM_CODE` for paths cited below; production state needs owner evidence.

## Baseline and evidence

- Branch: `main`; root package `0.4.0`; web/server workspace packages `0.1.0`.
- `v0.3.0` has owner-reported GO and smoke verification in [release identity](../releases/RELEASE_IDENTITY.md). `v0.4.0` has a source release note, subject to release-gate verification. This audit does not infer deployment of HEAD.
- 153 tracked Markdown files reviewed by inventory and targeted contradiction search. `REVIEW_REQUIRED` means the older document was inventoried, not fully revalidated line by line.
- Source hierarchy: implementation → schema/migrations → tests → CI → current product docs → historical release records → owner deployment evidence → roadmap.

## Confirmed contradictions and disposition

| Claim                                       | Evidence                                                                          | Status                      | Action                                                  |
| ------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------- | ------------------------------------------------------- |
| Root version 0.3.0                          | `package.json` = 0.4.0                                                            | VERIFIED_FROM_CODE          | Corrected active document headers and release identity. |
| v0.3 still a candidate                      | Owner GO recorded in `docs/releases/RELEASE_IDENTITY.md`                          | HISTORICAL                  | Corrected interview index and cheatsheet.               |
| Exact-start-only conflicts                  | `appointment.scheduling.ts`, `appointment.repository.ts` use duration plus buffer | VERIFIED_FROM_CODE          | Added source-backed interview explanation.              |
| No HTTP limiter                             | `middleware/rateLimit.ts` and current routes                                      | VERIFIED_FROM_CODE          | Added current security note; deployment not inferred.   |
| Invite link returned directly               | `staff.service.ts` submits email and returns invitation metadata                  | VERIFIED_FROM_CODE          | Corrected PRD and LLD.                                  |
| 0.5 audits imply 0.5 release                | Only audit filenames, no verified release identity                                | UNKNOWN                     | Label 0.5 as audit/planning scope.                      |
| v0.4 source note implies current deployment | `V0_4_0_RELEASE_NOTES.md` says source release subject to verification             | OWNER_VERIFICATION_REQUIRED | Separate source identity and production identity.       |

## Gaps and remaining work

The existing pack was shallow on concurrency, security failures, scoring math, and worked exercises. New interview resources address these. Full endpoint-by-endpoint response and error verification, every active page's document-control block, and live production verification remain outstanding. Do not claim those are complete. Backend lint is a placeholder (`apps/server/package.json`); browser E2E is absent.

## Inventory

| File                                                                              | Area          | Classification   |
| --------------------------------------------------------------------------------- | ------------- | ---------------- |
| `.github/pull_request_template.md`                                                | root          | ACTIVE           |
| `CHANGELOG.md`                                                                    | root          | ACTIVE           |
| `README.md`                                                                       | root          | ACTIVE           |
| `apps/web/README.md`                                                              | root          | ACTIVE           |
| `docs/HLD.md`                                                                     | root          | ACTIVE           |
| `docs/LLD.md`                                                                     | root          | ACTIVE           |
| `docs/PRD.md`                                                                     | root          | ACTIVE           |
| `docs/README.md`                                                                  | root          | ACTIVE           |
| `docs/accessibility/v0.5-accessibility-verification.md`                           | accessibility | ACTIVE           |
| `docs/ai/AI_CONTEXT.md`                                                           | ai            | ACTIVE           |
| `docs/architecture/API_REFERENCE.md`                                              | architecture  | ACTIVE           |
| `docs/architecture/API_STRUCTURE.md`                                              | architecture  | ACTIVE           |
| `docs/architecture/ARCHITECTURE.md`                                               | architecture  | ACTIVE           |
| `docs/architecture/AUTH_AND_SECURITY.md`                                          | architecture  | ACTIVE           |
| `docs/architecture/BACKEND_STRUCTURE.md`                                          | architecture  | ACTIVE           |
| `docs/architecture/DATABASE_DESIGN.md`                                            | architecture  | ACTIVE           |
| `docs/architecture/FRONTEND_STRUCTURE.md`                                         | architecture  | ACTIVE           |
| `docs/architecture/PATIENT_CLINIC_ROUTING.md`                                     | architecture  | ACTIVE           |
| `docs/architecture/ROUTE_SEO_INVENTORY.md`                                        | architecture  | ACTIVE           |
| `docs/assets/v0.2/README.md`                                                      | assets        | HISTORICAL       |
| `docs/assets/v0.2/screenshots/README.md`                                          | assets        | HISTORICAL       |
| `docs/audits/DOCUMENTATION_DISCREPANCY_REGISTER.md`                               | audits        | REVIEW_REQUIRED  |
| `docs/audits/ENTITY_LIFECYCLE_2026_10.md`                                         | audits        | REVIEW_REQUIRED  |
| `docs/audits/FRONTEND_RESPONSIVE_PERFORMANCE_AUDIT.md`                            | audits        | REVIEW_REQUIRED  |
| `docs/audits/INTERNAL_UI_MODERNIZATION_2026_10.md`                                | audits        | REVIEW_REQUIRED  |
| `docs/audits/UI_UX_REFINEMENT_2026_10.md`                                         | audits        | REVIEW_REQUIRED  |
| `docs/audits/UX_AUDIT_V0_5.md`                                                    | audits        | REVIEW_REQUIRED  |
| `docs/audits/UX_FINDINGS_V0_5.md`                                                 | audits        | REVIEW_REQUIRED  |
| `docs/audits/UX_REDESIGN_BACKLOG_V0_5.md`                                         | audits        | REVIEW_REQUIRED  |
| `docs/audits/UX_WORKFLOW_BASELINES_V0_5.md`                                       | audits        | REVIEW_REQUIRED  |
| `docs/audits/V0.3_ROUTE_RELEASE_AUDIT.md`                                         | audits        | REVIEW_REQUIRED  |
| `docs/audits/follow-up-issues/F-001-appointment-status-transition-enforcement.md` | audits        | HISTORICAL       |
| `docs/audits/follow-up-issues/F-002-record-v0-3-release-verification-evidence.md` | audits        | HISTORICAL       |
| `docs/audits/follow-up-issues/F-003-backend-lint-release-gate.md`                 | audits        | HISTORICAL       |
| `docs/audits/follow-up-issues/F-004-frontend-clinic-id-path-encoding.md`          | audits        | HISTORICAL       |
| `docs/audits/follow-up-issues/F-005-queue-reorder-doctor-scope.md`                | audits        | HISTORICAL       |
| `docs/audits/follow-up-issues/F-006-queue-status-transition-enforcement.md`       | audits        | HISTORICAL       |
| `docs/audits/issue-298-implementation.md`                                         | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_API_SECURITY_MATRIX.md`                                | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_SECURITY_AUDIT.md`                                     | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_SECURITY_FINDINGS.md`                                  | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_SECURITY_REMEDIATION_BACKLOG.md`                       | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_SECURITY_TEST_PLAN.md`                                 | audits        | REVIEW_REQUIRED  |
| `docs/audits/security/V0_5_THREAT_MODEL.md`                                       | audits        | REVIEW_REQUIRED  |
| `docs/case-study/README.md`                                                       | case-study    | ACTIVE           |
| `docs/case-study/interview-narrative.md`                                          | case-study    | ACTIVE           |
| `docs/case-study/portfolio.md`                                                    | case-study    | ACTIVE           |
| `docs/case-study/resume-summary.md`                                               | case-study    | ACTIVE           |
| `docs/design/CONTENT_GUIDELINES.md`                                               | design        | ACTIVE           |
| `docs/design/FRONTEND_UI_GUIDE.md`                                                | design        | ACTIVE           |
| `docs/design/VISUAL_SYSTEM.md`                                                    | design        | ACTIVE           |
| `docs/diagrams/REVIEWER_DIAGRAMS.md`                                              | diagrams      | ACTIVE           |
| `docs/engineering/CODEBASE_CONSISTENCY_AUDIT.md`                                  | engineering   | ACTIVE           |
| `docs/engineering/CODE_ORGANIZATION.md`                                           | engineering   | ACTIVE           |
| `docs/guides/CONTRIBUTING.md`                                                     | guides        | ACTIVE           |
| `docs/guides/DEMO_GUIDE.md`                                                       | guides        | ACTIVE           |
| `docs/guides/DEPLOYMENT.md`                                                       | guides        | ACTIVE           |
| `docs/guides/ML_DATASET_EXPORT_V0_5.md`                                           | guides        | ACTIVE           |
| `docs/guides/SETUP.md`                                                            | guides        | ACTIVE           |
| `docs/guides/TESTING.md`                                                          | guides        | ACTIVE           |
| `docs/guides/TROUBLESHOOTING.md`                                                  | guides        | ACTIVE           |
| `docs/interview/ARCHITECTURE_AND_DECISIONS.md`                                    | interview     | ACTIVE_INTERVIEW |
| `docs/interview/AUTHORIZATION_AND_SECURITY.md`                                    | interview     | ACTIVE_INTERVIEW |
| `docs/interview/DATABASE_AND_TRANSACTIONS.md`                                     | interview     | ACTIVE_INTERVIEW |
| `docs/interview/INTERVIEW_GUIDE.md`                                               | interview     | ACTIVE_INTERVIEW |
| `docs/interview/PROJECT_OVERVIEW.md`                                              | interview     | ACTIVE_INTERVIEW |
| `docs/interview/QUESTIONS_AND_SIMULATIONS.md`                                     | interview     | ACTIVE_INTERVIEW |
| `docs/interview/README.md`                                                        | interview     | ACTIVE_INTERVIEW |
| `docs/interview/REVISION_CHEATSHEET.md`                                           | interview     | ACTIVE_INTERVIEW |
| `docs/interview/SCREEN_SHARE_GUIDE.md`                                            | interview     | ACTIVE_INTERVIEW |
| `docs/interview/TESTING_AND_DEPLOYMENT.md`                                        | interview     | ACTIVE_INTERVIEW |
| `docs/interview/TRADEOFFS_AND_IMPROVEMENTS.md`                                    | interview     | ACTIVE_INTERVIEW |
| `docs/interview/workflows/APPOINTMENT_WORKFLOW.md`                                | interview     | ACTIVE_INTERVIEW |
| `docs/interview/workflows/ONBOARDING_WORKFLOW.md`                                 | interview     | ACTIVE_INTERVIEW |
| `docs/interview/workflows/QUEUE_WORKFLOW.md`                                      | interview     | ACTIVE_INTERVIEW |
| `docs/product/DECISIONS.md`                                                       | product       | ACTIVE           |
| `docs/product/MVP.md`                                                             | product       | ACTIVE           |
| `docs/product/USER_ROLES.md`                                                      | product       | ACTIVE           |
| `docs/product/WORKFLOWS.md`                                                       | product       | ACTIVE           |
| `docs/project-score/CONCEPT_TRACKER.md`                                           | project-score | REVIEW_REQUIRED  |
| `docs/project-score/INTERVIEW_QUESTIONS.md`                                       | project-score | REVIEW_REQUIRED  |
| `docs/project-score/README.md`                                                    | project-score | REVIEW_REQUIRED  |
| `docs/project-score/SIMULATION_CHECKLIST.md`                                      | project-score | REVIEW_REQUIRED  |
| `docs/project-score/WORKFLOW_EVIDENCE.md`                                         | project-score | REVIEW_REQUIRED  |
| `docs/project-score/concepts/README.md`                                           | project-score | REVIEW_REQUIRED  |
| `docs/project-score/evidence-index.md`                                            | project-score | REVIEW_REQUIRED  |
| `docs/project-score/mandatory-concept-evidence.md`                                | project-score | REVIEW_REQUIRED  |
| `docs/project-score/mandatory-gap-register.md`                                    | project-score | REVIEW_REQUIRED  |
| `docs/project-score/optional-concept-evidence.md`                                 | project-score | REVIEW_REQUIRED  |
| `docs/project-score/optional-scoring-strategy.md`                                 | project-score | REVIEW_REQUIRED  |
| `docs/project-score/preparation-priority-board.md`                                | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/ai-assistance.md`                                    | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/appointments.md`                                     | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/architecture.md`                                     | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/authentication.md`                                   | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/database.md`                                         | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/last-hour-checklist.md`                              | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/mandatory-concepts.md`                               | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/no-show-assistance.md`                               | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/optional-concepts.md`                                | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/project-one-page.md`                                 | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/queue.md`                                            | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/top-25-questions.md`                                 | project-score | REVIEW_REQUIRED  |
| `docs/project-score/revision/trade-offs.md`                                       | project-score | REVIEW_REQUIRED  |
| `docs/project-score/screen-share/appointment.md`                                  | project-score | REVIEW_REQUIRED  |
| `docs/project-score/screen-share/authentication-authorization.md`                 | project-score | REVIEW_REQUIRED  |
| `docs/project-score/screen-share/database-er-diagram.md`                          | project-score | REVIEW_REQUIRED  |
| `docs/project-score/screen-share/queue.md`                                        | project-score | REVIEW_REQUIRED  |
| `docs/project-score/simulations/code-writing.md`                                  | project-score | REVIEW_REQUIRED  |
| `docs/project-score/simulations/debugging.md`                                     | project-score | REVIEW_REQUIRED  |
| `docs/project-score/simulations/demo-fallbacks.md`                                | project-score | REVIEW_REQUIRED  |
| `docs/project-score/viva-question-bank.md`                                        | project-score | REVIEW_REQUIRED  |
| `docs/project-score/workflow-interview-packs.md`                                  | project-score | REVIEW_REQUIRED  |
| `docs/releases/RELEASE_CHECKLIST.md`                                              | releases      | HISTORICAL       |
| `docs/releases/RELEASE_IDENTITY.md`                                               | releases      | HISTORICAL       |
| `docs/releases/V0.3_RELEASE_CHARTER.md`                                           | releases      | HISTORICAL       |
| `docs/releases/V0_1_0_MVP_FREEZE.md`                                              | releases      | HISTORICAL       |
| `docs/releases/V0_2_0_RELEASE_NOTES.md`                                           | releases      | HISTORICAL       |
| `docs/releases/V0_3_0_RELEASE_NOTES.md`                                           | releases      | HISTORICAL       |
| `docs/releases/V0_4_0_RELEASE_NOTES.md`                                           | releases      | HISTORICAL       |
| `docs/reviewer/README.md`                                                         | reviewer      | ACTIVE           |
| `docs/reviewer/demo-guide.md`                                                     | reviewer      | ACTIVE           |
| `docs/reviewer/known-limitations.md`                                              | reviewer      | ACTIVE           |
| `docs/reviewer/project-status.md`                                                 | reviewer      | ACTIVE           |
| `docs/reviewer/review-paths.md`                                                   | reviewer      | ACTIVE           |
| `docs/reviewer/sample-data-guide.md`                                              | reviewer      | ACTIVE           |
| `docs/reviewer/screenshots.md`                                                    | reviewer      | ACTIVE           |
| `docs/reviewer/technical-evidence-map.md`                                         | reviewer      | ACTIVE           |
| `docs/scope/PRAVAAH_V0_2_SCOPE_AND_TRANSITION.md`                                 | scope         | ACTIVE           |
| `docs/scope/ROADMAP.md`                                                           | scope         | ACTIVE           |
| `docs/scope/V0_2_SCOPE.md`                                                        | scope         | ACTIVE           |
| `docs/security/API_RATE_LIMITING.md`                                              | security      | ACTIVE           |
| `docs/security/CONCURRENCY_AUDIT.md`                                              | security      | ACTIVE           |
| `docs/security/CONCURRENCY_TEST_REPORT.md`                                        | security      | ACTIVE           |
| `docs/security/OBJECT_AUTHORIZATION_AUDIT.md`                                     | security      | ACTIVE           |
| `docs/security/SECURITY_COVERAGE_MATRIX.md`                                       | security      | ACTIVE           |
| `docs/security/SECURITY_TESTING.md`                                               | security      | ACTIVE           |
| `docs/ui-ux/COMPLETION_REPORT.md`                                                 | ui-ux         | ACTIVE           |
| `docs/ui-ux/WORKSPACE_REDESIGN.md`                                                | ui-ux         | ACTIVE           |
| `docs/workflows/README.md`                                                        | workflows     | ACTIVE           |
| `docs/workflows/appointment-management.md`                                        | workflows     | ACTIVE           |
| `docs/workflows/authentication-and-user-resolution.md`                            | workflows     | ACTIVE           |
| `docs/workflows/clinic-setup.md`                                                  | workflows     | ACTIVE           |
| `docs/workflows/cross-workflow-state-transitions.md`                              | workflows     | ACTIVE           |
| `docs/workflows/dashboard-and-operational-data.md`                                | workflows     | ACTIVE           |
| `docs/workflows/doctor-management.md`                                             | workflows     | ACTIVE           |
| `docs/workflows/implementation-audit.md`                                          | workflows     | ACTIVE           |
| `docs/workflows/no-show-risk-assistance.md`                                       | workflows     | ACTIVE           |
| `docs/workflows/onboarding-and-clinic-provisioning.md`                            | workflows     | ACTIVE           |
| `docs/workflows/patient-management.md`                                            | workflows     | ACTIVE           |
| `docs/workflows/public-routes-and-fallbacks.md`                                   | workflows     | ACTIVE           |
| `docs/workflows/queue-management.md`                                              | workflows     | ACTIVE           |
| `docs/workflows/staff-invitations-and-management.md`                              | workflows     | ACTIVE           |
