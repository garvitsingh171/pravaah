# Pravaah v0.5 — Application UX Audit

**Issue:** UX-01 — Complete Application Usability and Interaction Audit

**Audit basis:** source inspection at `main` (`add6687`), checked October 26, 2026

**Release baseline:** tag `v0.4.0` at `31b1ca4`; `main` contains follow-up merges through #289. The tag verifies the v0.4 source release; production deployment of the current `main` SHA was not verified.

## Executive summary

Pravaah has a coherent clinic-side workflow foundation: role-aware workspace navigation, shared form and feedback primitives, clinic timezone handling, guarded lifecycle actions, appointment history, queue reorder protections, and explainable advisory risk displays. The v0.4 work already addressed several earlier UX issues: compact daily dashboard actions, mobile card views for key records, patient lookup and booking return context, manual queue freshness feedback, first-run setup guidance, focus-managed dialogs, and more readable risk explanations. Those improvements are not repeated as new backlog items.

The remaining highest-value work is operational reliability and task efficiency: make data freshness and concurrent changes more visible at the point of action; improve appointment list scale without transferring a full result set; establish tested keyboard/screen-reader behavior across the authenticated workspace; help operators recognize the distinction between queued appointments and physically arrived patients; and validate booking and queue tasks with clinic staff. The current source supports review of behavior and states but cannot establish actual task time, visual breakpoints in a running protected session, or assistive-technology outcomes.

No P0 finding was confirmed. Three P1 findings, six P2 findings, one P3 validation gap, and two unconfirmed hypotheses are recorded. See [the detailed register](UX_FINDINGS_V0_5.md).

## Scope and methodology

Reviewed registered route definitions in `apps/web/src/App.tsx` and `apps/web/src/routes/dashboardRoutes.tsx`; followed routes into page components and significant dialogs, drawers, tabs, conditional states, and forms. Cross-checked the current implementation against README, PRD/HLD/LLD, workflow atlas, release notes, design guide, prior UI/refinement/responsive audits, current frontend tests, and available backend workflow validation where it informs the safety of a recommendation.

This is primarily a source-based audit. Chromium and Playwright are installed, but `npm run dev -w apps/web -- --host 127.0.0.1` could not bind the local Vite server (`listen EPERM` on port 5173), so browser inspection could not start. No authenticated browser session or authorized demo identity was used. Environment variable names are documented in `apps/web/README.md` and `.env.example`; local env files were not read for credentials. Existing public landing screenshots in `docs/assets/ui-refinement/` are historical evidence from the October refinement, not screenshots captured for this audit. No new visual or screen-reader results are claimed.

Ratings:

- **Good:** source evidence indicates a sensible workflow and recovery pattern; runtime verification can still be outstanding.
- **Needs improvement:** a confirmed friction, scale, orientation, or accessibility risk remains.
- **Critical:** a confirmed problem likely to cause severe harm, data loss, or blocked core work. None was confirmed in this audit.

Severity means P1 = material risk or recurrent operational friction in a core task; P2 = notable efficiency, clarity, or access gap; P3 = polish or lower-frequency improvement. These are prioritization labels, not a claim of measured incidence.

## Repository and release baseline

- Git history has a `v0.4.0` tag and merge commits for #285 and #287; current `main` is beyond the release tag through #289. The source baseline is verifiable, while production deployment status for current `main` is not.
- Root `README.md` and `docs/releases/RELEASE_IDENTITY.md` still describe v0.3 as current, while Git tags/releases include v0.4.0. Treat those files as historical documentation and use the current code/tag as the audit baseline; deployment of post-v0.3 code is not verified by those records.
- React 19, TypeScript, Vite, Tailwind, React Router, Clerk, and Motion are declared in `apps/web/package.json`. Frontend server data is fetched by feature API modules and React state; there is no query/cache package.
- Existing design foundations include `docs/design/VISUAL_SYSTEM.md`, `FRONTEND_UI_GUIDE.md`, shared `components/ui`, shared feedback states, responsive record presentations, and reduced-motion configuration in the protected shell.
- Prior completed-in-source improvements are described in `UI_UX_REFINEMENT_2026_10.md` and `INTERNAL_UI_MODERNIZATION_2026_10.md`. Issue #228's responsive audit, #285's risk dashboard, and #287's risk dialog updates are reflected in current source. GitHub issue status metadata for #216, #221, #222, #228, #271, #285, and #287 was not independently queried; merged PR evidence and current source were used instead.
- The workflow atlas describes core clinic routes and feature capabilities. This report expands its inventory to include all public marketing routes, auth routes, aliases, fallbacks, and major component-level interactions.

## Personas

| Persona | Main jobs | UX needs and audit lens |
|---|---|---|
| Receptionist / Staff | Find/register patients, book or change visits, check arrivals, operate queue, answer status questions | Fast search, low typing, clear valid actions, fresh queue state, recoverable failures |
| Clinic Admin | Configure clinic and doctors, invite/manage staff, inspect operations, handle exceptions | Safe control, visible impact, role clarity, clear save/restore state |
| New clinic user | Sign up, provision clinic, add doctor and patient, book first visit | Progress, helpful empty states, sensible next action, no dead end |

## Route and screen inventory

Inventory status below reflects code inspection. API dependencies are the frontend feature API or Clerk where named; specific loading, empty, error, and interaction states are described where implemented. Protected responsive behavior is inferred from markup and CSS classes, not visually verified in a live browser.

| Route / component | Source | Users / purpose / primary actions | Entry and exit | Data, state and responsive evidence | UX status |
|---|---|---|---|---|---|
| `/` — HomePage in MarketingLayout | `features/marketing/HomePage.tsx`, `MarketingLayout.tsx` | Public; understand the clinic product; follow product, feature, contact, login or signup links | Direct/public nav; exits to public content or Clerk | Static content plus Clerk-dependent CTA; lazy route and shared marketing shell; responsive styles and historical captures exist | Good; runtime here unverified |
| `/product` — ProductPage | `features/marketing/DetailPages.tsx` | Public; understand product capabilities | Public nav; onward to features/auth | Static marketing page, shared shell and lazy route | Good; runtime here unverified |
| `/features` — FeaturesIndexPage | `features/marketing/DetailPages.tsx` | Public; browse capabilities | Public nav; feature detail pages | Static; shared shell | Good; runtime here unverified |
| `/features/appointments` — FeaturePage | `features/marketing/DetailPages.tsx` | Public; learn appointment capability | Features index or direct link; product/auth links | Static feature content; `slug="appointments"` | Good; runtime here unverified |
| `/features/live-queue` — FeaturePage | `features/marketing/DetailPages.tsx` | Public; learn live queue capability | Features index or direct link | Static feature content; `slug="live-queue"` | Good; runtime here unverified |
| `/features/no-show-risk` — FeaturePage | `features/marketing/DetailPages.tsx` | Public; understand advisory risk assistance | Features index or direct link | Static content; source and release docs state rule-based/advisory semantics | Good; ensure semantics stay explicit |
| `/features/clinic-management` — FeaturePage | `features/marketing/DetailPages.tsx` | Public; learn clinic administration | Features index or direct link | Static feature content | Good; runtime here unverified |
| `/features/team-management` — FeaturePage | `features/marketing/DetailPages.tsx` | Public; learn staff access | Features index or direct link | Static feature content | Good; runtime here unverified |
| `/solutions` — SolutionsPage | `features/marketing/DetailPages.tsx` | Public; evaluate fit | Public nav; product/auth links | Static marketing content | Good; runtime here unverified |
| `/how-it-works` — HowItWorksPage | `features/marketing/DetailPages.tsx` | Public/new clinic user; understand setup and daily flow | Public nav; auth links | Static steps; not a live onboarding state | Good; verify claims against setup flow during content updates |
| `/faq` — FaqPage | `features/marketing/DetailPages.tsx` | Public; resolve product questions | Public nav; contact/auth links | Static FAQ; interaction semantics not browser-verified | Needs runtime keyboard check |
| `/about` — AboutPage | `features/marketing/DetailPages.tsx` | Public; learn product/project context | Public nav | Static content | Good; runtime here unverified |
| `/contact` — ContactPage | `features/marketing/DetailPages.tsx` | Public; initiate contact | Public nav; email client handoff | `mailto:` handoff; explicit “opens your email app” copy, send-by-user explanation, and fallback email link | Good boundary and user expectation setting |
| `/login/*` — LoginPage | `features/auth/LoginPage.tsx`, `AuthPageLayout.tsx` | Public/new user; sign in and account recovery via Clerk | Public CTA or protected redirect; post-auth resolution/redirect | Clerk-hosted interaction, lazy route, shared auth layout and fallback; provider-internal error/empty behavior not audited | Needs external runtime verification |
| `/sign-up/*` — SignUpPage | `features/auth/SignUpPage.tsx`, `AuthPageLayout.tsx` | Public/new clinic user; create identity | Public CTA or invitation flow; onboarding/invitation | Clerk interaction, lazy route; provider-internal states not audited | Needs external runtime verification |
| `/onboarding` — redirect | `App.tsx` | New clinic user; canonical setup entry | Auth redirect; `/onboarding/clinic` | Replace redirect under error boundary | Good |
| `/onboarding/clinic` — ClinicOnboardingPage | `features/onboarding/ClinicOnboardingPage.tsx` | New user/Admin; create clinic, complete required details, decide on sample data | Authenticated unprovisioned identity; dashboard or retry/recovery | Onboarding status/API, validation, loading/error/retry, setup steps, optional sample-data decision; responsive form classes, no runtime viewport check | Good foundation; first-run completion unmeasured |
| `/invite/:token` — StaffInvitationPage | `features/staff/StaffInvitationPage.tsx` | Invitee; inspect invitation, switch account or accept | Invitation link; dashboard/sign-in/up/recovery | Invitation preview/accept API; loading, invalid/expired/error and account mismatch states; no real email inbox test | Good safety boundaries; state clarity needs operator validation |
| Protected shell / authenticated but unprovisioned | `app/ProtectedAppShell.tsx` | New clinic user; get directed to setup | Any protected URL after auth; onboarding | Checks internal account and onboarding status; loading, recovery, onboarding redirect and API error/retry branches; auth runtime unavailable | Good guarded routing; recovery support is admin-assisted |
| Inactive/suspended account and inactive clinic recovery | `app/ProtectedAppShell.tsx` | Admin/Staff; understand access block, sign out or restore clinic when authorized | Protected route; recovery/signout/dashboard | User/clinic state; Admin restore impact confirmation and failure state; Staff cannot restore | Good safety; runtime unverified |
| `/dashboard` — DashboardOverviewPage | `features/dashboard/DashboardOverviewPage.tsx`, `NoShowRiskIntelligence.tsx`, `FloatingSetupDock.tsx` | Admin/Staff; orient to today, inspect counts/attention/risk, jump to operations; Admin follows setup | Workspace nav, post-onboarding; appointments, queue, doctor/patient/admin | Summary, high-risk, activity, appointment/queue previews, retry/partial-data states and Admin setup status; responsive grid in source | Good after #221/#285 work; queued-vs-arrived distinction and freshness remain important (F-04/F-05) |
| `/doctors` — DoctorsPage | `features/doctors/DoctorsPage.tsx`, `DoctorProfileDialog.tsx`, `DoctorAvailabilityEditor.tsx` | Admin/Staff; search/filter, inspect/edit profile and weekly hours; Admin archive/restore | Workspace nav, booking doctor setup; appointments/settings | Doctor list and on-demand availability; loading/empty/filtered-empty/error/retry/toast; profile/edit/status dialogs; mobile cards/table responsive classes | Good; preserve availability validation |
| `/doctors/new` — DoctorCreatePage / DoctorForm | `features/doctors/DoctorCreatePage.tsx`, `DoctorForm.tsx` | Admin/Staff; add doctor | Doctors or first-run setup; doctors list | Create API, client/backend validation, submitting/error/success; form stacks responsively in source | Good; task success path unmeasured |
| `/patients` — PatientsPage | `features/patients/PatientsPage.tsx`, `PatientProfileDialog.tsx` | Admin/Staff; search/filter, inspect/edit, view history/location, archive/restore (Admin) | Workspace nav, booking; appointments/queue | Clinic-scoped patient search/list; loading/empty/filtered-empty/error/retry/toast; profile/edit/lifecycle/geocoding/routing dialogs; mobile card/table presentation | Good; preserve low-friction lookup and history integrity |
| `/patients/new` — PatientCreatePage / PatientForm | `features/patients/PatientCreatePage.tsx`, `PatientForm.tsx` | Admin/Staff; register patient | Patients or booking's create-patient handoff; patients/booking return | Form validation/submission, address/emergency contact/notes; booking draft/return context in router state; mobile stacked sections | Needs improvement: optional field load and task time need observation (F-08 hypothesis) |
| `/appointments` — AppointmentsPage | `features/appointments/AppointmentsPage.tsx` | Admin/Staff; filter/search, book, inspect activity/risk, update valid status, reschedule/cancel/no-show | Workspace nav, dashboard, patient return; dashboard/queue/patient return | Appointment, doctor/patient references and available-slot APIs; loading/empty/filtered-empty/error/retry/success/error status feedback; patient search, date/doctor/patient/status filters; page size 15; responsive mobile cards/table | Needs improvement at scale and during concurrent operations (F-01/F-02); core lifecycle safeguards should remain |
| Booking dialog/form | `features/appointments/AppointmentBookingDialog.tsx`, `AppointmentBookingForm.tsx`, `AppointmentsPage.tsx` | Admin/Staff; choose patient, doctor/date/slot, enter visit detail and submit | Appointments header, dashboard quick action; appointment list | Patient/doctor refs, server-generated slots, appointment create; validation, loading, conflict/error, success state; focus-managed modal and patient-create return path | Good safeguards; measure task efficiency before redesign |
| Reschedule dialog / slots | `features/appointments/AppointmentsPage.tsx` | Admin/Staff; choose a valid replacement slot and confirm | Appointment row action; refreshed list | Slot API, reschedule API; loading/error/conflict/confirm state | Good safety; preserve server slot validation and original context |
| Terminal reason / cancellation / no-show dialog | `features/appointments/TerminalAppointmentReasonDialog.tsx`, `AppointmentsPage.tsx` | Admin/Staff; explain cancellation/no-show terminal action | Appointment status action; updated appointment | Validation and status API; focus, errors and confirmation | Good safety pattern; runtime keyboard behavior needs verification |
| Appointment activity dialog | `features/appointments/AppointmentActivityDialog.tsx` | Admin/Staff; review who changed appointment and when | Appointment row action; close to list | Activity API; loading/error/empty/history states | Good traceability; visually unverified |
| No-show risk details dialog | `components/ui/NoShowRiskDetailsDialog.tsx`, `RiskExplanation.tsx` | Admin/Staff; understand rule-based score/reasons and suggested follow-up | Dashboard, appointments, queue | Stored prediction and explanation; dialog has tests and focus behavior; no prediction is generated in UI | Good; keep advisory and provenance copy explicit |
| `/queue` — QueuePage | `features/queues/QueuePage.tsx` | Admin/Staff; see today's doctor-scoped lanes, mark arrivals/call/complete/no-show, reorder | Workspace nav, dashboard, arrival/status operations; appointments/dashboard | Queue API and doctor filters; loading/empty/error/retry/status/reorder feedback; manual refresh timestamp, mobile responsive classes | Needs improvement: freshness/concurrency feedback (F-01); do not auto-overwrite guarded updates |
| `/staff` — StaffManagementPage | `features/staff/StaffManagementPage.tsx` | Admin; invite, inspect, resend/revoke invitations, suspend/reactivate Staff | Admin nav; invite link acceptance | Staff/invitation APIs; list/search/loading/error/confirmation/email submission state | Good safety and status distinction; source says provider submission is not inbox delivery |
| `/clinic-settings` — ClinicSettingsPage | `features/clinics/ClinicSettingsPage.tsx` | Admin; edit clinic identity/address/hours, retry geocoding, archive/restore | Admin nav; settings | Settings and lifecycle impact APIs; loading/error/validation/saved/reset/retry/confirmation states | Good grouped form and impact guard; runtime keyboard/viewport check missing |
| `/profile` — ProfilePage / ProfileDialog | `features/profile/ProfilePage.tsx`, `components/ui/ProfileDialog.tsx` | Admin/Staff; inspect user/account/access context | Topbar menu; workspace return | Active clinic and internal user context; dialog semantics in source | Good; screen reader review outstanding |
| `*` — NotFoundPage | `routes/NotFoundPage.tsx` | Public or authenticated user; recover from unknown path | Invalid/deep link; home or relevant app CTA | Clerk state for CTA; not-found heading/action | Good; protected deep-link behavior should be checked after auth |
| Route chunk loading / public error boundary | `App.tsx`, `PublicErrorBoundary.tsx` | All users; understand pending page or recover from render failure | Any lazy route; retry/navigation | Suspense loading state and public boundary; protected shell has its own loading/error states | Good source pattern; runtime/failure injection unverified |

**Route count:** 28 explicit path entries including `/onboarding` redirect and protected routes, plus the wildcard fallback. The component-level inventory above includes the registered interactions and materially different conditional states rather than treating each modal as a URL.

## Workflow-by-workflow evaluation

### 1. New clinic setup — New clinic user / Admin

Current source journey: `/sign-up/*` (Clerk) → `/onboarding/clinic` (status resolution and validated clinic form) → optional sample data decision → protected shell checks provisioned user/clinic → dashboard with first-run setup dock → `/doctors/new` → `/patients/new` → `/appointments` booking. The setup checklist and sample data action reduce the initial blank-state problem. Clinic onboarding exposes progress and associated field errors. Patient creation from booking returns to the booking flow through router state instead of browser storage.

Assessment: the main path exists and has loading, validation, recovery, error, and retry states. No source-only finding proves a dead end. Actual completion time, comprehension of the optional sample-data choice, and whether setup checklist language is sufficient for first-time staff are unmeasured. Validate with a new clinic operator before reshaping required fields. See [baseline scenarios](UX_WORKFLOW_BASELINES_V0_5.md).

### 2. Appointment booking — Receptionist / Staff

Current source journey: open booking from appointment page or dashboard → choose/search an existing patient or add one and return → choose doctor and date → load server-validated slots → enter booking details → submit → success and appointment list refresh/locate. Code uses clinic timezone for date defaults and lets staff navigate to a newly-created patient without discarding the booking return context. Slot generation/availability is server-backed; the UI does not replace that authority.

Assessment: the flow has strong validation and error recovery, but the audit cannot prove action count or time without browser tasks. A backend conflict or stale slot must remain recoverable and must never be replaced by a permissive client-side slot dropdown. The full list retrieval and on-page pagination concern is mainly appointment management at scale (F-02).

### 3. Appointment management — Receptionist / Staff

Current source journey: date defaults to clinic-local today → patient name/phone search and date/doctor/patient/status filters → row actions for supported status, reschedule, terminal reason, activity, and risk details → refresh and continue. The route resets list state on page reload/navigation; filters are component state, not shareable URL state. A cross-page transition uses router state where implemented.

Assessment: status action availability and terminal dialogs reduce invalid operator choices; appointment activity supplies traceability. The list is paginated in the client at 15 rows after data is fetched, and source/workflow notes say server pagination is unavailable. This is a confirmed transfer/render scaling gap, not a claim that current small clinics are slow. Filter persistence after leaving the route is unverified as a user pain; record as validation item only.

### 4. Live queue — Receptionist / Staff

Current source journey: arrive/check appointment → see active queue grouped/scoped by doctor → use allowed status action to call/complete/no-show → reorder within permitted doctor scope → observe success/error and manually refresh when needed. Reorder is server-authoritative and guards concurrent writes. The queue shows a manual refresh timestamp rather than claiming a real-time feed.

Assessment: interaction intent is clearer after the v0.4 queue work, and the absence of an auto-refresh feature is disclosed. A timestamp can become stale during a shift and does not by itself tell staff whether another operator has just changed an entry. Improve freshness/conflict context while retaining safe, explicit, server-accepted updates (F-01). Keep the queue-distribution “Waiting” status distinct from the headline's arrived-and-waiting patient count (F-04).

### 5. Patient management — Receptionist / Staff

Current source journey: search/filter active or archived records → open profile/history → edit supported fields or archive/restore with impact guard. Booking supports patient search and a return path through patient creation. Patient list uses mobile presentation and loading/empty/error states.

Assessment: current improvements cover the previously noted mobile table and booking-context loss. The patient form exposes a broad set of optional demographic, address, emergency contact and notes fields; source alone does not establish that they burden the receptionist or are unnecessarily required. Test realistic “register and book now” cases; any reduction must preserve server-required data and privacy boundaries (F-08, hypothesis).

### 6. Doctor management — Admin / Staff

Current source journey: list/search/filter active or archived → create or open doctor profile → edit validated details and on-demand weekly availability → save and refresh; Admin controls clinic link archive/restore. Doctor creation is separately routable and linked from setup/booking. Availability uses clinic-local wall-clock values and may have split periods.

Assessment: profile and availability are grouped in an on-demand edit path, which avoids per-doctor availability fetches on the list. Preserve doctor schedule validation and clinic relationship protections. No confirmed severe friction found; observe setup and recurring schedule edits during usability validation.

### 7. Staff management — Admin

Current source journey: Admin opens `/staff` → invites by email → sees invitation status and submission result → invitee opens `/invite/:token`, authenticates with matching trusted identity, reviews, and explicitly accepts → Admin can revoke/resend or suspend/reactivate.

Assessment: security boundaries and explicit invite acceptance are good patterns. Invitation `SUBMITTED` means provider accepted the request; it is not proof of inbox delivery. The UI must preserve this distinction (F-06), and any future improvements must not expose raw tokens or overstate delivery.

### 8. Settings and exceptional states — Admin

Current source journey: grouped identity/address/hours settings form → validate and save → geocoding retry if needed → clinic lifecycle impact review and typed confirmation before archive/restore. Inactive clinic restoration is handled in the protected shell for Admin. Non-Admin direct access redirects to dashboard; server role/clinic checks remain authoritative.

Assessment: impact confirmation and explicit Admin-only navigation are appropriate. No workflow change recommended without authenticated role testing. All settings keyboard labels and field errors appear in source but need assistive-technology validation.

## Information architecture findings

Protected navigation has a small set of daily tasks and Admin controls, role-aware routes, a profile affordance in the topbar, and a setup dock. Direct create routes are hidden from global navigation and should remain reachable from relevant list pages and setup steps. Keep this separation and ensure dashboard links target tasks, not just metrics.

Open assessment: the summary count, operational pulse, and queue distribution use related but distinct terms. Keep the queue status “Waiting” distinct from the physical arrival count in labels and explanations (F-04).

## Visual consistency, forms, and interaction

The repository already has reusable tokens and primitives, shared field sizing, common button/card/status/risk styles, form sections, error/empty/loading components, confirmation dialogs, responsive mobile presentations, toast feedback, and explicit contact handoff copy. The prior v0.4 refinement describes the changes and its screenshot evidence. No visual redesign is justified from this source-only pass.

The current interaction model appropriately favors explicit actions and status-specific confirmations for operational tasks. Do not convert appointment lifecycle into a free-form status selector, bypass server slot validation, or let stale queue clients overwrite updates. Focus management is implemented in the mobile navigation and dialogs, and selected risk/booking interactions have frontend tests. Coverage across all dialogs and navigation remains incomplete (F-03).

## Responsive usability

Responsive behavior is implemented in classes and includes mobile cards for appointment, patient, and doctor lists, wrapping filters, stacked forms, a keyboard-managed mobile drawer, and dialog sizing. Prior public page images and multi-width inspection are recorded in `UI_UX_REFINEMENT_2026_10.md`; the authenticated pages have no current audit browser capture. Treat responsive behavior as source-inspected rather than visually verified. Validate queue actions, large appointment filters, settings forms, and modal focus at 320–390 px and tablet widths (F-03).

## Accessibility

Positive evidence includes associated labels and field errors, `aria-invalid` / `aria-describedby` in many forms, semantic tables, named navigation, status/alert roles, dialog titles, focus utilities, 40px compact button / queue move targets documented in prior audit, and reduced-motion support in protected shell configuration.

Remaining gap: no cross-product keyboard and screen-reader audit is recorded, and the existing frontend tests cover only selected focus and status behavior. A source scan cannot prove focus order, live region timing, visible focus, zoom/reflow, target sizing in rendered contexts, or Clerk widget behavior. UX-17 should be a verification-led pass and document reproducible fixes rather than assume every aria attribute is missing (F-03).

## Motion and perceived performance

Routes are lazy-loaded and show a pending state; the protected shell configures Motion; previous refinement work reduced the initial marketing bundle and deferred protected shell code from the public route. No current runtime timings were collected. Avoid adding motion to high-frequency queue/list actions unless it communicates a state transition and respects reduced motion. Main unmeasured performance concern is full-result appointment retrieval before client pagination (F-02); do not infer a slow response or a numerical bundle regression from source.

## Strong patterns to preserve

- Backend-authoritative booking slots and availability/conflict checks.
- Appointment and queue lifecycle action constraints, terminal reasons, and clear save/error state.
- Clinic timezone-aware appointment dates.
- Guarded queue reorder and explicit manual freshness cue.
- Booking-to-patient-create return context without storing sensitive clinical data in browser storage.
- Admin-only staff/settings controls and explicit invitation acceptance.
- Lifecycle impact dialogs for archive/restore and inactive clinic recovery.
- Rule-based risk explanation with human-controlled action, provenance and no automatic status mutation.
- Shared field feedback, empty/error/loading states, focus-managed modal primitives, and reduced-motion configuration.

## Top ten highest-impact problems

| Rank | ID | Problem | Affected task | Priority |
|---:|---|---|---|---|
| 1 | F-01 | Queue freshness and concurrent change state are not live; operators must refresh and can act on stale context | Queue operations | P1 |
| 2 | F-02 | Appointment list pagination limits rendering after a full result set is fetched | Search/manage appointments as records grow | P1 |
| 3 | F-03 | Keyboard/screen-reader behavior is not verified across the authenticated workflow surface | All users, especially assistive technology users | P1 |
| 4 | F-04 | Queue distribution “Waiting” label needs separation from physical arrivals | Dashboard-to-queue handoff | P2 |
| 5 | F-05 | Queue freshness cue does not communicate whether other staff changed an item since display | Queue operations | P2 |
| 6 | F-06 | Invitation provider submission can be mistaken for successful email delivery | Admin staff onboarding | P2 |
| 7 | F-07 | Appointment filters are transient page state, making return-to-list context fragile | Appointment management | P2, validate frequency |
| 8 | F-08 | Patient registration form's breadth may slow “register then book” but burden is unmeasured | Patient intake / booking | P2 hypothesis |
| 9 | F-09 | There is no browser E2E path for authenticated critical workflows in the repo | Future release QA | P2 |
| 10 | F-10 | Authenticated responsive layouts have no current audit screenshots or live viewport verification | Core operational screens | P3 |

## Key trade-offs and risks

- Live queue updates improve awareness but must not silently replace locally pending actions or create false certainty; preserve server ownership, conflict response and operator confirmation.
- Server pagination improves scale and network use but needs API contract/validation and stable filtering/sorting. It is not a reason to add pagination blindly for current small datasets.
- Retaining list context improves speed but URL state may expose search terms and can complicate deep links. Choose which non-sensitive filters persist based on observation.
- Simplifying forms can exclude operationally important data or encourage duplicate records. Measure field necessity and preserve backend validation.
- Risk explanations must remain advisory; neither colors nor numbers should imply clinical validation or probability calibration.

## Unverified areas and limitations

- No signed-in browser session, authorized fictional clinic, or production environment was used; protected screens were code-inspected only.
- No actual receptionist/Admin usability sessions, timed tasks, error rates, screenshot capture, mobile device test, keyboard-only run, screen-reader run, or zoom test occurred.
- No backend availability or concurrency failure was simulated; related findings are grounded in current request/state patterns and workflow documentation.
- GitHub issue labels/statuses for historical issues were not available in local repository evidence. Merged PRs/current implementation were checked; see backlog for issue ownership recommendations.
- Current `main` production deployment and actual clinic data scale are unknown.
- Proposed targets in workflow baselines are planning thresholds, not measured results or commitments.

## Final recommendations

Prioritize UX-01 follow-through in this order: (1) verify accessible keyboard and mobile operation across authenticated core paths; (2) add explicit, safe queue freshness/conflict feedback; (3) define appointment list API pagination and preserve useful return context; (4) clarify dashboard metric definitions; (5) run moderated tasks with 3–5 clinic operators before changing patient form scope or onboarding. Combine small cross-cutting feedback and responsive work with the owning feature issue, and defer visual polish or motion until the task evidence identifies a specific need.

Related deliverables: [findings register](UX_FINDINGS_V0_5.md), [workflow baselines and QA scenarios](UX_WORKFLOW_BASELINES_V0_5.md), and [prioritized backlog](UX_REDESIGN_BACKLOG_V0_5.md).
