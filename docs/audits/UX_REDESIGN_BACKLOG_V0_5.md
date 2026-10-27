# Pravaah v0.5 — Prioritized UX Improvement Backlog

This is a proposed issue map for product planning; it does not create GitHub issues or claim that existing issues are open/closed. Findings link to [UX_FINDINGS_V0_5.md](UX_FINDINGS_V0_5.md). Do not weaken backend workflows or protections listed in [the audit](UX_AUDIT_V0_5.md).

## Recommended issue map

| Proposed issue | Recommendation | Evidence / findings | Suggested priority | Dependencies |
|---|---|---|---|---|
| UX-02 Design system | Shrink to maintenance of existing tokens/primitives and accessibility states; no broad visual refresh | Current `components/ui`, forms, feedback, and prior #216/#222 source work | P2 / ongoing | UX-17 audit feedback |
| UX-03 Navigation | Defer major redesign; validate route discoverability with operators | Role-aware daily/Admin nav and mobile drawer already exist | P3 | UX study |
| UX-04 Dashboard | Keep metric definition clear and validate queue terminology | F-04; dashboard and queue counts differ operationally | P2 | None; no lifecycle change |
| UX-05 Appointment booking | Validate task baseline, then address only observed friction and booking reference search | Core booking safeguards already exist; no measured time | P1 research / implementation by evidence | Server availability workflow |
| UX-06 Appointment management | Combine with pagination API work and return-context review | F-02, F-07 | P1 | Backend API pagination/filter contract |
| UX-07 Reschedule/cancel | Keep focused on recoverable conflict and list context, not a new interaction model | Existing server slots, terminal reason dialog and tests | P2 | UX-06/API slot behavior |
| UX-08 Live queue | Prioritize stale/concurrent state clarity; no auto-refresh until safety behavior is specified | F-01, F-05 | P1 | Backend version/conflict semantics if needed |
| UX-09 Queue feedback/reordering | Merge into UX-08 as acceptance criteria unless separate scope needed for queue ordering | Server guarded reorder already exists; F-05 | P1 with UX-08 | Backend guards remain |
| UX-10 Risk dialogs | Defer redesign; retain current #287 explanation/provenance; fix only validated comprehension issues | Current dialogs and component tests | P2 / monitor | Rule-based risk semantics |
| UX-11 Patient management | Research patient lookup/intake; do not simplify fields without task evidence | Existing search/mobile cards/context; F-08 hypothesis | P2 research | UX-05 booking handoff |
| UX-12 Doctor management | Defer standalone redesign; verify schedule setup usability | Existing profile editor, on-demand availability, validation | P3 | UX-14 study |
| UX-13 Staff management | Clarify provider submission language and retry feedback | F-06 | P2 | Invitation service states |
| UX-14 Onboarding | Run first-time Admin task study before changing checklist | F-11 hypothesis; existing setup dock/checklist | P2 research | Test account/fixture |
| UX-15 Settings | Defer visual work; include settings in role/keyboard/zoom verification | Existing grouped form and impact dialog | P3 | UX-17/18 |
| UX-16 Forms/feedback | Targeted status/error wording refinements with feature owners | F-06 | P2 | UX-13 |
| UX-17 Accessibility | Prioritize verification and fixes across core workflows | F-03 | P1 | Authenticated test user; selected screen reader |
| UX-18 Responsive behavior | Merge verification into UX-17 and feature QA; standalone only for demonstrated layout defects | F-10; prior #228 code exists | P2 | Browser/device coverage |
| UX-19 Performance | Limit to appointment server pagination and profiling; defer speculative animation/bundle work | F-02; no audit metrics | P1 | API pagination; representative dataset |
| UX-20 Usability/browser tests | Create small authorized browser suite for critical tasks after safe demo environment exists | F-09 | P2 | Test tenant, auth, synthetic data |

## Sequencing

1. **Validation foundation:** UX-17 and UX-20 prerequisites: authorized non-production demo tenant, synthetic dataset, keyboard/screen-reader/browser matrix. In parallel, moderate UX-05/11/14 scenarios with 3–5 operators.
2. **Operational correctness and clarity:** UX-08/09 queue freshness/conflict feedback; UX-04 metric label clarity; UX-13 invitation submission language. UX-08 and UX-09 should be one scoped queue workstream unless ownership requires separate review.
3. **Scale:** UX-06 with UX-19: agree backend pagination/filter contract, then update list presentation, loading and return context. Do not call client slicing server pagination.
4. **Evidence-led feature work:** UX-05/07 booking and rescheduling only after task observation; UX-11 patient registration only after measuring which optional details interrupt work; UX-14 onboarding only after first-run study.
5. **Defer:** standalone navigation redesign, broad design-system rewrite, risk-dialog redesign, and speculative motion/performance initiatives. Revisit only if study or runtime evidence identifies a specific defect.

## Issue briefs

### UX-02 — Design system (maintenance scope)

1. **Problem:** Shared controls exist but need consistent state and accessibility upkeep as feature work lands; a wholesale refresh has no current evidence.
2. **Findings:** F-03, F-10 as verification-driven only; existing shared primitives are a strength.
3. **Recommended scope:** Document/reuse current tokens and primitives; add missing states only when a workflow audit finds a concrete gap.
4. **Affected components:** `components/ui/*`, `components/feedback/*`, `index.css`, `docs/design/VISUAL_SYSTEM.md`.
5. **Approach:** Inventory actual reuse, standardize focus/error/disabled/loading behavior, keep operational density and reduced motion.
6. **Dependencies:** UX-17 findings.
7. **Risks:** Over-general abstractions can make dense clinic workflows slower or obscure custom validation.
8. **Acceptance criteria:** Existing status/risk meanings remain distinguishable without color alone; inputs/buttons expose visible focus; reduced-motion preference honored; no workflow behavior changes are hidden in styling.
9. **Complexity:** S–M.
10. **Priority:** P2 / maintenance.
11. **Verification:** Component tests plus keyboard/zoom checks on one form, list, and dialog.

### UX-03 — Navigation (validate, do not redesign yet)

1. **Problem:** Discoverability and return paths have not been measured after existing role-aware/grouped navigation work.
2. **Findings:** No confirmed navigation failure; F-07 is a list-context question.
3. **Recommended scope:** Observe staff finding appointments, queue, and patient records, and Admin finding settings/staff.
4. **Affected components:** `Sidebar.tsx`, `Topbar.tsx`, `dashboardRoutes.tsx`, `AppLayout.tsx`.
5. **Approach:** Change labels/grouping only for demonstrated confusion; preserve role filtering and deep links.
6. **Dependencies:** Operator study and UX-17/18 checks.
7. **Risks:** More navigation items increase scanning and role ambiguity.
8. **Acceptance criteria:** 4/5 test participants locate each core task without facilitator guidance; Staff cannot be shown Admin-only actions as enabled.
9. **Complexity:** S if labels; M if IA changes.
10. **Priority:** P3 until validated.
11. **Verification:** Task-based findability, mobile drawer keyboard and touch testing.

### UX-04 — Dashboard

1. **Problem:** Operational counts must clearly distinguish appointment records from physical arrivals.
2. **Findings:** F-04.
3. **Recommended scope:** Align metric label, one-line definition, and destination link; use existing scoped data.
4. **Affected components:** `DashboardOverviewPage.tsx`, dashboard summary/API types, queue list destination.
5. **Approach:** Clarify terminology and link to matching list; investigate data semantics before changing aggregation.
6. **Dependencies:** Dashboard API definitions if text is insufficient.
7. **Risks:** Changing metric meaning can confuse existing users; no count logic should change without backend validation.
8. **Acceptance criteria:** Operators can explain each waiting/arrival metric; destination filter matches stated definition; counts remain clinic/timezone scoped.
9. **Complexity:** S–M.
10. **Priority:** P2.
11. **Verification:** Staff comprehension task and regression tests for current metric definitions.

### UX-05 — Appointment booking

1. **Problem:** Booking task time and error recovery have not been measured; no confirmed excess-step issue after patient search/return work.
2. **Findings:** Research action; F-02 secondary for data scale.
3. **Recommended scope:** Observe existing patient and new patient booking, locate exact repeated inputs, validate slot/conflict comprehension.
4. **Affected components:** `AppointmentsPage.tsx`, booking dialog/form, patient create return path, appointment API.
5. **Approach:** Optimize defaults and focus/order only where observed; maintain server-generated slot validity and booking conflicts.
6. **Dependencies:** Test dataset and stable authorized test environment.
7. **Risks:** Faster UI must not permit invalid slot, duplicate booking, or wrong-patient selection.
8. **Acceptance criteria:** At least 4/5 operators book correctly without help; no invalid slot accepted; booking confirmation clearly identifies patient, doctor, date/time; record baseline task time and errors.
9. **Complexity:** M.
10. **Priority:** P1 research; code priority follows evidence.
11. **Verification:** Moderated tasks, form/API tests, conflict recovery browser test.

### UX-06 — Appointment management

1. **Problem:** Client pages slice a full fetched result; filter state is transient.
2. **Findings:** F-02, F-07.
3. **Recommended scope:** Server pagination/filter support and useful list context on dialog close/return.
4. **Affected components:** Appointment page/API and backend list schema/service/repository; dashboard preview only if needed.
5. **Approach:** Contract first: page/cursor, stable sort, date/status/doctor/patient filters, total/next state; then UI loading/empty/error and context return.
6. **Dependencies:** Backend API contract and data volume profile; UX-19.
7. **Risks:** Inconsistent pages, hidden records, changed totals, time-zone mismatch; sensitive query strings.
8. **Acceptance criteria:** Only requested page data is fetched; filters are applied consistently server-side; stable ordering prevents duplicates/omissions between pages; dialog return restores chosen safe context; clinic isolation unchanged.
9. **Complexity:** L.
10. **Priority:** P1 for scale when representative clinic data warrants; sequence after profiling.
11. **Verification:** API contract tests, synthetic large dataset, browser pagination/filter and return tests.

### UX-07 — Rescheduling/cancellation

1. **Problem:** Need to validate recovery and context after a slot conflict or terminal action; current safety dialogs are in place.
2. **Findings:** F-07 applies to list return; no separate defect confirmed.
3. **Recommended scope:** Preserve selected appointment context and make conflict recovery actionable.
4. **Affected components:** `AppointmentsPage.tsx`, reschedule dialog, terminal reason dialog, API.
5. **Approach:** Re-fetch server slots when appropriate, show reason/error, retain the appointment identity and list filters.
6. **Dependencies:** Appointment API and UX-06 context model.
7. **Risks:** Bypassing slot/conflict checks or allowing invalid terminal transition.
8. **Acceptance criteria:** Failed reschedule leaves existing appointment intact; cancellation/no-show requires supported reason where current rules require; user returns to same list context.
9. **Complexity:** M.
10. **Priority:** P2.
11. **Verification:** Conflict, retry, terminal transition and keyboard dialog scenarios.

### UX-08 — Live queue

1. **Problem:** A manually refreshed board can become stale while several staff operate concurrently.
2. **Findings:** F-01, F-05.
3. **Recommended scope:** Show freshness/conflict state and a safe review/reload path. Poll/push is optional only after operational need and backend semantics are agreed.
4. **Affected components:** `QueuePage.tsx`, `queueApi.ts`, queue response/versioning if needed.
5. **Approach:** Keep visible last refresh time; when write conflicts occur, identify affected row, explain current state, refresh without replaying a non-idempotent action.
6. **Dependencies:** Current server conflict responses; backend version indicator if required.
7. **Risks:** No silent state overwrite, duplicate lifecycle action, doctor-scope violation, or false real-time promise.
8. **Acceptance criteria:** Two-session stale test gives explicit conflict and safe next action; successful status/reorder shows latest authoritative state; no automatic replay.
9. **Complexity:** M–L depending on API changes.
10. **Priority:** P1.
11. **Verification:** Two authorized synthetic sessions, network delay/failure, keyboard and phone viewport.

### UX-09 — Queue feedback and reordering

1. **Problem:** Queue freshness/conflict is a separate concern from the reorder control but shares one operation model.
2. **Findings:** F-05.
3. **Recommended scope:** Merge into UX-08 as long as backend-safe reorder remains one authoritative operation.
4. **Affected components:** Queue row/card and reorder controls/API feedback.
5. **Approach:** Show direction/position feedback and current row state after accepted change; reject cross-doctor or stale reorder clearly.
6. **Dependencies:** UX-08.
7. **Risks:** Reorder must not cross protected doctor scope or silently replace another operator's update.
8. **Acceptance criteria:** Move controls indicate valid directions; accepted order is visible; stale/invalid reorder returns stable server order with clear recovery.
9. **Complexity:** S–M (incremental).
10. **Priority:** P1 with UX-08.
11. **Verification:** Existing reorder tests plus browser keyboard, boundary and conflict scenarios.

### UX-10 — Risk dialogs

1. **Problem:** No new dialog layout issue confirmed after #287; comprehension should be checked, especially advisory semantics.
2. **Findings:** Existing implementation is a strength; monitor F-03 accessibility.
3. **Recommended scope:** Do not redesign absent usability evidence; address understanding of reason, provenance, and suggested action if users misinterpret it.
4. **Affected components:** `NoShowRiskDetailsDialog.tsx`, `RiskExplanation.tsx`, callers.
5. **Approach:** Keep reason text and rule-based advisory wording; no clinical prediction claim or automatic action.
6. **Dependencies:** Operator comprehension and accessibility study.
7. **Risks:** Staff may treat score as certainty or clinical judgment.
8. **Acceptance criteria:** Operators can explain score limitations and choose action themselves; dialog keyboard/focus works; no stored historical explanation is rewritten.
9. **Complexity:** S unless research shows larger issue.
10. **Priority:** P2 / monitor.
11. **Verification:** Comprehension prompts, screen-reader pass, existing component tests.

### UX-11 — Patient management

1. **Problem:** Intake breadth may slow register-then-book, but this is unmeasured.
2. **Findings:** F-08 hypothesis; prior mobile/search/context improvements already exist.
3. **Recommended scope:** Observe search, duplicate avoidance, patient creation, history review, archive/restore.
4. **Affected components:** Patient list/form/profile, appointment handoff.
5. **Approach:** Separate required-now from optional-later only if clinic workflows and API validation support it; preserve location/history and clinic scope.
6. **Dependencies:** UX-05 study and backend schema requirements.
7. **Risks:** Loss of emergency/contact details, duplicates, accidental archive.
8. **Acceptance criteria:** Staff find correct record, understand optional fields, retain unsaved-change protections, and no required data contract is bypassed.
9. **Complexity:** M.
10. **Priority:** P2 after observation.
11. **Verification:** Search/create/history/archive task scenarios and backend validation.

### UX-12 — Doctor management

1. **Problem:** No current high-confidence usability defect established.
2. **Findings:** Source patterns are sound; F-11 setup observations may surface schedule setup friction.
3. **Recommended scope:** Verify weekly schedule creation/edit and archive impact during Admin onboarding.
4. **Affected components:** `DoctorsPage.tsx`, `DoctorForm.tsx`, availability editor.
5. **Approach:** Keep recurring schedule semantics explicit, clinic timezone labels, split availability and safe validation.
6. **Dependencies:** UX-14 and backend availability contract.
7. **Risks:** Incorrect hours can expose invalid appointment slots.
8. **Acceptance criteria:** Admin correctly adds two periods and sees clinic-local schedule; invalid overlaps/out-of-clinic hours rejected; impact shown before archive.
9. **Complexity:** S–M.
10. **Priority:** P3 unless research raises it.
11. **Verification:** Scenario-based editor tests and booking slot cross-check.

### UX-13 — Staff management

1. **Problem:** Submitted email status can sound like delivered mail.
2. **Findings:** F-06.
3. **Recommended scope:** Clarify provider accepted/submitted state and safe retry guidance.
4. **Affected components:** Staff invitation list, create/resend result messaging, invite page.
5. **Approach:** Align terms to `NOT_SENT`/`SUBMITTED`/`FAILED`; explain invitee must use matching email and explicitly accept.
6. **Dependencies:** Existing backend email states; no new email system.
7. **Risks:** Never expose token or claim inbox delivery based solely on provider response.
8. **Acceptance criteria:** Admin can distinguish not sent, provider accepted, and failed; resend availability and effect are clear; invitation remains clinic/admin scoped.
9. **Complexity:** S.
10. **Priority:** P2.
11. **Verification:** UI state tests for each email status and staff comprehension test.

### UX-14 — Onboarding

1. **Problem:** Comprehension of first-run checklist/sample-data choice is unknown.
2. **Findings:** F-11 hypothesis.
3. **Recommended scope:** Observe setup from signup to first booked appointment before changing the current checklist.
4. **Affected components:** Onboarding page, setup checklist/dock, doctor/patient create, booking.
5. **Approach:** Use a new fictional clinic and note hesitation, backtracking, help requests and abandonment points.
6. **Dependencies:** Authorized demo account and moderator.
7. **Risks:** Changing provisioning order or sample data can create clinic state/security side effects.
8. **Acceptance criteria:** 4/5 new Admin participants reach first booking unaided; setup step labels match actual completion state; optional sample data remains explicit.
9. **Complexity:** S research, M implementation only if evidence supports.
10. **Priority:** P2 research.
11. **Verification:** Moderated study and onboarding status/API regression tests.

### UX-15 — Settings

1. **Problem:** Current grouped form appears coherent; no usability issue confirmed, but protected keyboard/zoom testing remains.
2. **Findings:** F-03, F-10 verification scope.
3. **Recommended scope:** Include settings save, reset, geocoding retry, and archive impact dialog in accessibility checks.
4. **Affected components:** `ClinicSettingsPage.tsx`, shared fields and confirmation dialog.
5. **Approach:** Correct only documented focus/label/reflow/feedback issues.
6. **Dependencies:** UX-17/18.
7. **Risks:** Clinic hours/timezone edits affect valid appointments; lifecycle effects must remain explicit.
8. **Acceptance criteria:** Admin can save/reset with keyboard; validation linked to field; archive impact and typed confirmation work at phone/zoom viewport.
9. **Complexity:** S–M.
10. **Priority:** P3 unless audit identifies blocker.
11. **Verification:** Admin account keyboard/zoom task; existing settings validation.

### UX-16 — Forms and feedback

1. **Problem:** Specific user-facing status wording needs clarity for invitation provider submission.
2. **Findings:** F-06.
3. **Recommended scope:** Targeted copy and accessible announcement review; no global form rewrite.
4. **Affected components:** Staff status feedback and shared field/error feedback if needed.
5. **Approach:** State what happened and what user can do next; errors retain relevant field/task context.
6. **Dependencies:** UX-13.
7. **Risks:** Avoid announcing success before provider delivery is confirmed.
8. **Acceptance criteria:** Provider state describes acceptance accurately; screen reader announces errors once.
9. **Complexity:** S.
10. **Priority:** P2.
11. **Verification:** Copy review and accessibility state test.

### UX-17 — Accessibility

1. **Problem:** End-to-end accessible task completion is not verified.
2. **Findings:** F-03.
3. **Recommended scope:** Audit booking, queue, patient lookup, terminal dialogs, staff invite, settings and responsive navigation.
4. **Affected components:** Shared primitives and owning feature screens; Clerk wrapper boundary.
5. **Approach:** Keyboard-only plus selected screen-reader browser pair; record severity and exact reproduction.
6. **Dependencies:** Authenticated demo identity; external Clerk states may require provider test configuration.
7. **Risks:** Source attributes can mask runtime focus/announcement failures; avoid checklist-only signoff.
8. **Acceptance criteria:** Critical tasks operable without pointer; focus visible and returns correctly; all dynamic errors/status changes discoverable; zoom/reflow checked; no unreviewed major blocker.
9. **Complexity:** M.
10. **Priority:** P1.
11. **Verification:** Documented browser/AT matrix, manual recordings and regression test where automatable.

### UX-18 — Responsive behavior

1. **Problem:** Existing responsive implementation is not verified for protected screens at runtime.
2. **Findings:** F-11.
3. **Recommended scope:** Validate current mobile cards, queue lanes/actions, filters, forms, dialogs and drawer.
4. **Affected components:** Protected shell and core feature page layouts.
5. **Approach:** Test 320/360/390 px, tablet and desktop, keyboard/touch and 200% zoom; log specific clipping/scroll/task issues.
6. **Dependencies:** UX-17 authenticated environment.
7. **Risks:** Duplicate desktop/mobile views can diverge; preserve semantic data and visible labels.
8. **Acceptance criteria:** Core task controls reachable and understandable; no unintended page-level horizontal overflow; controlled table scroll is labeled where intentionally used.
9. **Complexity:** M.
10. **Priority:** P2.
11. **Verification:** Screenshots and tasks with synthetic data across width matrix.

### UX-19 — Performance

1. **Problem:** Appointment client pagination follows a full result fetch; no audit-specific runtime measurements exist.
2. **Findings:** F-02.
3. **Recommended scope:** Profile representative synthetic clinic sizes and implement server pagination if data volume warrants; avoid speculative animation work.
4. **Affected components:** Appointment API/backend list path and frontend pagination; dashboard preview only by measured need.
5. **Approach:** Establish payload and interaction baseline, then paginate and measure again.
6. **Dependencies:** UX-06 API design and test dataset.
7. **Risks:** Cursor/sort instability, date-zone drift, query performance and changed row counts.
8. **Acceptance criteria:** Page request bounds returned rows; filters and ordering stable; no record omissions/duplicates between pages; publish before/after measurements from same environment.
9. **Complexity:** L.
10. **Priority:** P1 when scale profile confirms need.
11. **Verification:** Non-production synthetic dataset, API/browser traces and regression tests.

### UX-20 — Usability and browser tests

1. **Problem:** Component tests do not verify complete authenticated journeys; browser E2E suite is absent.
2. **Findings:** F-09.
3. **Recommended scope:** Establish safe browser test environment and cover the task-critical flows from the proposed workflow test plan.
4. **Affected components:** Test configuration and appointment, onboarding, queue, invite flows; no production data.
5. **Approach:** Add browser tooling only after test identity, seeded fictional clinic and cleanup policy are available; require auth normally.
6. **Dependencies:** CI/browser runtime and authorized non-production environment.
7. **Risks:** Leaking credentials/real patient data or relying on external provider availability.
8. **Acceptance criteria:** Test sign-in fixture is scoped and secret-safe; core booking, queue status/reorder, onboarding route, and return context have stable tests; no production mutations.
9. **Complexity:** L.
10. **Priority:** P2.
11. **Verification:** CI execution against isolated fixture; document skips/external dependencies.

## Cross-cutting constraints

- Preserve appointment and queue lifecycle validation and server-authoritative responses.
- Preserve doctor availability and generated slot checks; no UI-only slot authority.
- Preserve clinic isolation, Admin/Staff permissions, invitation token secrecy, and explicit invite acceptance.
- Preserve transactional consistency and manual queue reorder protections.
- Preserve no-show rules, history, provenance, and advisory/non-clinical language.
- Where an issue needs backend contract/state changes, identify the dependency and obtain workflow/security review through the normal team process; this UX audit itself does not change backend behavior.
