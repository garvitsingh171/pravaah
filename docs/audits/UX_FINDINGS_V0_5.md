# Pravaah v0.5 — UX Findings Register

Source inspection at `main` (`add6687`), October 26, 2026. P1 = material core-workflow risk/friction; P2 = notable efficiency, clarity or access issue; P3 = lower-frequency improvement. “Hypothesis” findings are not confirmed usability problems and require operator validation.

## Findings summary

| ID | Severity | Screen/Feature | Finding | User Impact | Evidence | Recommendation | Effort | Related Issue |
|---|---|---|---|---|---|---|---|---|
| F-01 | P1 | Queue | Queue updates are manually refreshed, so a busy operator can act on a stale board | Receptionist may miss a status or position change made by another operator | `QueuePage.tsx:884-919,1178-1185`; `queue-management.md` documents no WebSocket feed and guarded server reorder | Add explicit stale/concurrent-change feedback; consider safe polling or push only with server version/conflict handling | M | UX-08/09 |
| F-02 | P1 | Appointments | Client pagination slices after fetching the appointment list | Transfer and client work grow with clinic history; paging does not bound data retrieval | `AppointmentsPage.tsx:1803-1809`; `appointmentApi.ts:224-236`; `INTERNAL_UI_MODERNIZATION_2026_10.md` explicitly says current API has no server pagination | Define server pagination/filter/sort contract, retain clinic scope and stable ordering, then expose page/loading context | L | UX-05/06 |
| F-03 | P1 | Accessibility, all core routes | No end-to-end keyboard or screen-reader verification is recorded | Barriers and unannounced state changes may prevent safe independent operation | Existing component tests are selective; prior audits explicitly state no screen-reader certification/authenticated keyboard run | Run keyboard and screen-reader task audit; fix evidenced failures under UX-17 | M |
| F-04 | P2 | Dashboard / queue handoff | Queue distribution “Waiting” label should remain distinct from physical arrival language | Staff may confuse a queue status category with who has physically arrived | `DashboardOverviewPage.tsx:653-662` labels queue distribution; separate summary count filters arrived/in-queue at `:122-126`, and pulse says “arrived and waiting” around `:490-498` | Keep queue status labels and arrival counts visibly distinct; confirm wording with receptionists | S | UX-04 |
| F-05 | P2 | Queue | A manual refresh timestamp improves orientation but does not identify a changed item or stale write conflict before action | Staff may need to re-read/retry or unknowingly act on old context | `QueuePage.tsx:858,884-919,1178-1185`; `queue-management.md` describes server-authoritative reorder and manual refresh | Show clear changed-since-refresh/conflict state while preserving pending input until accepted/refetched | M | UX-08/09 |
| F-06 | P2 | Staff invitation | Email provider acceptance is not the same as delivery, while invitation status can be interpreted as completed delivery | Admin may assume invitee received access instructions and not follow up | `staff-invitations-and-management.md`; `StaffManagementPage.tsx:324-334,665-683` says “submitted” without defining provider acceptance | Label submitted as “sent to email provider”/“submission accepted”; explain follow-up and resend outcome without claiming inbox delivery | S | UX-13/16 |
| F-07 | P2* | Appointments | Filters live in component state, not a durable list context | Returning after leaving/reloading may require rebuilding date/status/search filters | `AppointmentsPage.tsx` local `useState` filters; no URL serialization shown in route | Persist only useful non-sensitive filters in URL or navigation state; preserve scroll/selection where observation supports it | M | UX-06 |
| F-08 | P2* | Patient create | Patient form exposes many optional sections in the registration path; actual burden is unknown | Potential slow intake/duplicate completion during register-and-book task | `PatientForm.tsx` includes demographics, location, emergency contact, notes; `PatientCreatePage.tsx`; no completed task observation | Measure required vs optional fields with staff; defer nonessential optional sections without weakening server validation | M | UX-11/16 |
| F-09 | P2 | QA coverage | No browser E2E suite is present for authenticated appointment, queue, or onboarding journeys | Regressions in multi-step workflows may escape component-level checks | `apps/web/package.json` scripts include Vitest but no browser runner; `docs/workflows/implementation-audit.md` notes browser E2E gap | Add a small authorized demo-data browser suite for task-critical flows after test environment exists | L | UX-20 |
| F-10 | P3 | Responsive core views | Mobile layouts exist in source, but current authenticated route behavior has no audit screenshots or live viewport verification | Layout regressions at narrow widths can remain unknown | Previous `FRONTEND_RESPONSIVE_PERFORMANCE_AUDIT.md` and `INTERNAL_UI_MODERNIZATION_2026_10.md` mark protected views as not runtime checked | Verify 320/360/390 px, tablet, zoom and touch operation; fix only demonstrated failures | M | UX-18 |
| F-11 | Hypothesis | New clinic onboarding | First-run checklist and sample-data choice exist, but novice comprehension and usefulness are unmeasured | New clinic may need outside help despite a working setup path | `ClinicOnboardingPage.tsx`, `FirstRunSetupChecklist.tsx`, `FloatingSetupDock.tsx`; no user study evidence | Observe first-time clinic setup and measure completion/help requests before redesign | S research | UX-14 |

`*` P2 findings are confirmed implementation characteristics whose user impact/frequency needs validation before implementation priority is treated as final. F-08 is a hypothesis, not a claim that the form is objectively too long.

## Detailed evidence and rationale

### F-01 — Queue freshness during concurrent operation

**Evidence:** `apps/web/src/features/queues/QueuePage.tsx:884-919` loads and timestamps a manual refresh; `:1178-1185` labels it “Manual refresh”. `docs/workflows/queue-management.md` documents no WebSocket feed; reordering is server-authoritative and guarded. This confirms the information model is snapshot/manual refresh rather than live. It does not prove an observed mistake or lost update.

**Impact:** In a clinic with two staff members, one operator's screen may not show another operator's latest queue status. Staff can act on stale context or repeat a check. The safe response is visible staleness and explicit recovery, not optimistic overwriting.

**Recommendation:** Define an acceptable freshness interval with operators. Add changed-since-refresh/conflict messaging at row/action scope and refresh on a safe lifecycle boundary. If polling/push is later introduced, retain server conflict responses, queue doctor scope, and pending action clarity. Verify with two independent sessions.

### F-02 — Full list transfer before client pagination

**Evidence:** `apps/web/src/features/appointments/AppointmentsPage.tsx:1803-1809` sets `pageSize = 15` and uses array `slice` over `filteredAppointments`. The internal audit states that current appointment/dashboard preview requests load the existing full clinic/date list because API pagination is absent; `apps/web/src/features/appointments/appointmentApi.ts:224-236` constructs the list request. The 15-row control limits rows rendered, not records transferred.

**Impact:** As historical or broad date results grow, the browser must receive/filter the full result before showing pages. This can increase payload and interaction work; no measured latency or scale threshold is claimed.

**Recommendation:** Add API pagination and server-side supported filters/sorts in a separately reviewed contract change. Preserve clinic scoping, timezone semantics, stable ordering, status constraints, and the ability to locate a just-created/rescheduled appointment. UX-06 depends on backend/API work; UI-only pagination must not be presented as a scale solution.

### F-03 — Accessibility verification gap

**Evidence:** Forms and dialogs use labels, error descriptions, semantic roles, and focus utilities in source. Tests exist for specific reusable controls/dialogs and some pages. The existing October audit says the protected app still needs authenticated keyboard/visual checks and no screen-reader certification is recorded. The repository lacks an end-to-end browser runner.

**Impact:** Correct attributes do not prove focus order, keyboard reachability, live feedback, zoom/reflow, modal return focus, or third-party Clerk behavior. The issue is a verification gap, not a blanket assertion that accessibility is broken.

**Recommendation:** Execute a keyboard-only pass and at least one screen-reader pass over booking, queue status/reorder, terminal action, patient lookup, staff invitation, and settings. Record browser/AT/version and repeatable outcomes. Prioritize blockers and state announcement issues before visual polish.

### F-04 — Distinguishing booked waiting records from arrived patients

**Evidence:** `apps/web/src/features/dashboard/DashboardOverviewPage.tsx:653-662` renders queue distribution categories, including “Waiting”. The separate headline patient count filters for arrived/in-queue states (`:122-126`) and the pulse explicitly says “arrived and waiting” (`:490-498`). This is a wording distinction to preserve and validate, not evidence that the current headline count is wrong.

**Impact:** Receptionists answer questions based on what is on the dashboard. A count label that reads like an arrival count could overstate who is physically present.

**Recommendation:** Keep the metric name and definition adjacent (for example, appointments in a booked/waiting state versus arrived patients) and link to the relevant filtered operational view. Validate wording with clinic staff; do not change lifecycle logic as a labeling fix.

### F-05 — Row-level queue change awareness

**Evidence:** The manual refresh cue indicates when the list was loaded; source does not show a subscription or per-item “changed by another operator” indicator. The backend guard protects reorder consistency, but a failed/stale write still needs clear recovery.

**Impact:** A whole-board timestamp requires staff to infer whether one specific patient row is current. Concurrent staff operation makes this more relevant than decorative freshness text.

**Recommendation:** Surface a conflict response with the changed item and clear next action (refresh/review/retry). Do not silently resubmit a destructive or lifecycle action. Depend on backend conflict/version semantics where necessary.

### F-06 — Invitation email status language

**Evidence:** `docs/workflows/staff-invitations-and-management.md` distinguishes `NOT_SENT`, `SUBMITTED`, and `FAILED`, and expressly says submitted means provider acceptance, not inbox arrival. `StaffManagementPage.tsx:324-334` toasts “Invitation email submitted” and `:665-683` displays “submitted” without the provider-acceptance qualifier.

**Impact:** Admin may believe a Staff member has received a message and wait for acceptance. This is a communication expectation gap, not a failed invitation security model.

**Recommendation:** Make the status wording match evidence and provide a safe resend path where eligible. Keep raw tokens and invitation URLs out of the management UI and logs.

### F-07 — Transient appointment list context

**Evidence:** Date, doctor, patient, status, and patient text search are local React state in `AppointmentsPage.tsx`. Route navigation does not serialize these values as query parameters. The page already preserves a targeted appointment return state in a separate flow.

**Impact:** Leaving/reloading the page can require reapplying filters. Frequency and scroll loss have not been measured; classify as a usability risk to validate before adding URL complexity.

**Recommendation:** In a future UX-06 pass, identify the minimum useful context (likely date/status/search plus target appointment) and test it. Avoid putting sensitive patient details in shared URLs; consider ID-safe navigation state or carefully scoped query behavior.

### F-08 — Patient form breadth (hypothesis)

**Evidence:** `apps/web/src/features/patients/PatientForm.tsx` includes personal details, location, emergency contacts, and notes; many are optional. Booking can route to `/patients/new` and return. No data indicates which fields operators routinely skip or need before a first booking.

**Impact:** A long intake can interrupt a time-sensitive appointment booking, but shortening without evidence can lose useful clinic data or create more edits later.

**Recommendation:** Observe several registration cases, identify required-for-booking versus optional-for-later fields, and preserve validation/security rules. Do not fold this into a redesign purely to reduce visible fields.

### F-09 — Critical browser workflow coverage

**Evidence:** `apps/web/package.json` defines Vite/Vitest scripts; no Playwright/Cypress/Webdriver package or browser suite is declared. The workflow implementation audit records no browser E2E coverage. This is a validation/maintenance gap, not an end-user defect.

**Impact:** Component tests may not catch route, auth, multi-step return, responsive, and browser focus regressions together.

**Recommendation:** Add the smallest useful end-to-end suite after a non-production fictional clinic and test identity are available. Never seed production or bypass authentication. Include booking-slot conflict and queue stale-update recovery only in authorized test fixtures.

### F-10 — Protected responsive evidence gap

**Evidence:** Code contains responsive table/card and layout classes. Prior audits explicitly label protected route visual behavior as not runtime-checked. Public landing captures do not verify authenticated screens.

**Impact:** CSS inspection cannot establish that queue actions remain discoverable, filters wrap usefully, focus remains visible, or dialogs fit on actual devices.

**Recommendation:** Capture representative authenticated layouts at phone/tablet/desktop widths during UX-18 validation, with fictional data and no personal information. Include zoom and touch target checks.

### F-11 — Setup guidance comprehension (hypothesis)

**Evidence:** Setup progress, dashboard dock, optional sample data, and first-run tasks exist in source and tests. No observed first-time clinic user evidence is present.

**Impact:** A technically complete checklist may still be difficult to interpret, but there is no evidence to justify replacing it.

**Recommendation:** Run the planned usability session with a clinic Admin unfamiliar with the product; observe the first usable appointment before editing the flow.

## Existing improvements and historical issue reconciliation

Current source and local merged history show prior work relevant to the requested historical issues: reusable design primitives and tokens; onboarding/dashboard/appointment updates; doctor/patient/form consistency work; responsive work; grouped protected shell/navigation; risk dashboard and appointment/queue improvements (#285); risk dialog layout and dataset follow-up (#287). The source also contains compact list views, patient search with booking return, queue refresh timestamp, dialog focus utilities, reduced-motion setup, and setup checklist. The exact live GitHub issue status and labels for #216/#221/#222/#228/#271/#285/#287 could not be verified from local files; this register does not claim those issues are closed beyond merged code evidence.

The public contact page is not a finding: it explicitly says submission opens the user's email app, sending happens only there, and provides a fallback address if the draft does not open (`apps/web/src/features/marketing/DetailPages.tsx:788-893`).
