# Pravaah v0.5 — Workflow Baselines and Test Scenarios

These are source-derived journeys and proposed future usability checks. No clinic operator study, stopwatch timing, or live browser run was performed for this audit. Counts below distinguish source-defined steps from observed completion time.

## Core task inventory

| Persona | Core task | Current entry |
|---|---|---|
| New clinic user / Admin | Create clinic and reach first usable appointment | `/sign-up/*` → `/onboarding/clinic` |
| Admin | Add doctor and weekly availability | `/doctors/new` or `/doctors` profile edit |
| Receptionist / Staff | Find existing patient and book a valid appointment slot | `/appointments` booking dialog |
| Receptionist / Staff | Register a patient while booking and return to the draft | Booking dialog → `/patients/new` → booking context |
| Receptionist / Staff | Find today's appointment and explain/update its status | `/appointments` |
| Receptionist / Staff | Mark arrival, call next patient, complete visit | `/queue` |
| Receptionist / Staff | Reorder queue entry and recover from stale/conflicting state | `/queue` |
| Receptionist / Staff | Review appointment activity and explainable no-show reasons | Appointment action / risk dialog |
| Admin | Invite and onboard Staff; understand delivery state | `/staff` → `/invite/:token` |
| Admin | Update clinic hours or recover an inactive clinic | `/clinic-settings` / protected shell recovery |

## Current journey baselines

### A. First clinic setup

**Current path (source-confirmed):** Sign up → complete Clerk identity flow → clinic onboarding status check → fill and submit clinic details → decide whether to add sample data → protected workspace → follow setup dock → create doctor → create/find patient → book first appointment.

**Count:** at least 7 distinct screens/decisions before the first appointment when sample data is skipped (signup, onboarding form, sample-data decision, dashboard, doctor create, patient create/find, booking). This count excludes individual inputs, auth-provider substeps, dashboard return navigation, and validation retries; it is a route/decision count, not an observed click count.

**Potential mistakes:** leaving a required clinic field unresolved; choosing sample data without recognizing it is fictional; missing the setup dock; creating duplicate doctor/patient records; using an unavailable schedule slot.

**Recovery:** onboarding field errors and API error/retry; optional sample-data decision; first-run checklist; doctor/patient list search; booking availability reloaded from backend. Runtime recovery was not exercised.

### B. Book appointment for an existing patient

**Current path:** Open `/appointments` → open booking dialog → select patient (search/filter supported) → select doctor and date → wait for available slots → choose slot → enter remaining supported booking details → submit → see confirmation and updated list.

**Count:** at least 7 user decisions/actions after opening the dialog (patient, doctor, date, slot, remaining details, submit, locate/confirm). This is a source-derived minimum, not a click count; number of keystrokes depends on the form values and user.

**Potential mistakes:** selecting a similarly named patient; choosing a date in the wrong clinic-local day; attempting to use a stale slot; overlooking booking confirmation.

**Recovery:** patient search supports name/phone; backend validates generated slot and conflicts; form surfaces validation/API errors; success refreshes list. No booking was submitted in a browser.

### C. Book while creating a patient

**Current path:** Start booking → choose add patient → complete PatientForm → submit → return to booking with created patient context → select doctor/date/slot → submit booking.

**Count:** at least 8 decision/actions excluding patient form inputs: open booking, add patient, complete and submit patient form, return to draft, select doctor, date, slot, submit appointment. Confirming/locating the booked row adds another action if needed.

**Potential mistakes:** losing booking context; overfilling optional patient details; duplicate patient creation after a search miss; failing to notice return confirmation.

**Recovery:** router state carries the booking return context; no medical context is stored in browser storage; patient search and field errors are available. User comprehension and draft persistence across refresh are not verified.

### D. Find and manage an appointment

**Current path:** Open `/appointments` → set date and optional patient/doctor/status filters → search by patient name/phone → inspect row → choose supported status action or open activity/reschedule/terminal/risk dialog → submit/close → continue list work.

**Count:** 2 actions minimum to filter and inspect; each status/reschedule action adds one or more confirmation steps. Exact counts depend on starting state and filter combination. Filters are component state; persistence across navigation/reload is not provided by the current route.

**Potential mistakes:** interpreting a booked `WAITING` record as a physical arrival; missing a filter that hides a target; choosing a terminal action without adequate reason; stale result after another operator acts.

**Recovery:** clear filters, reload list, row-specific errors, terminal confirmation, activity history, backend lifecycle/availability validation. Cross-route state retention should be observed, not assumed.

### E. Operate queue under a busy shift

**Current path:** Open `/queue` → identify doctor lane and patient → confirm status/position → perform permitted transition or reorder → read feedback → refresh as needed.

**Count:** 2 actions minimum to locate and act on an already-visible entry; reorder also requires position change and confirmation/submission as implemented. This is an action model, not a tested click count.

**Potential mistakes:** working from a stale board; confusing next patient with another doctor's queue; repeating a transition after a delayed response; manually moving an entry outside allowed scope.

**Recovery:** refresh timestamp/action, per-action pending/error feedback, server-authoritative reorder guard. No two-user conflict test was run. UX-08/09 should include a controlled stale-update test.

### F. Admin invites Staff

**Current path:** Open `/staff` → enter invitee email → submit invitation → inspect provider submission state → invitee opens token link → authenticates with matching identity → reviews and accepts.

**Potential mistakes:** assuming provider submission means inbox delivery; invitee authenticates under a different email; expired/revoked invitation; repeated invitation submission.

**Recovery:** status and resend/revoke paths; invite preview/accept errors; switch account; sign out; expired/invalid messaging. Email inbox delivery is not guaranteed by provider status.

## Baseline metrics: measured versus unmeasured

| Metric | Baseline |
|---|---|
| Registered routes | 28 explicit route entries including redirect/protected; wildcard fallback separately (code inventory in `UX_AUDIT_V0_5.md`) |
| Appointment page size | 15 rows rendered per client page in source; entire requested result currently fetched before slicing |
| Appointment booking time | Not measured |
| Patient registration time | Not measured |
| Queue action time / stale action frequency | Not measured |
| First clinic setup completion rate/time | Not measured |
| Search success / duplicate registration rate | Not measured |
| Keyboard-only task completion | Not tested |
| Screen-reader task completion | Not tested |
| Protected responsive defect rate | Not measured; source inspected, no current authenticated screenshots |
| API latency or bundle performance | Not measured for this audit; no new numeric claims |

## Representative fictional test data

Use only a non-production, clinic-scoped demo tenant and fictional records. Example dataset:

- Clinic: “Harbor Family Clinic”, timezone `Asia/Kolkata`, weekdays 09:00–17:00.
- Doctors: Dr. Asha Rao (General Medicine, morning availability), Dr. Kabir Sen (Pediatrics, split availability).
- Patients: Aditi Mehta (phone ending 0142), Arjun Mehta (similar name, phone ending 9142), Noor Ali (no prior visits), and fictional archived patient record.
- Appointments: today — one scheduled, one arrived/in queue, one called, one completed; future day — one high-risk rule explanation; one reschedule conflict fixture.
- Queue: two doctor lanes with at least four active entries each; one status change performed by a second authorized Staff session during concurrency testing.
- Invitations: one pending valid invitation, one expired fixture, one provider submission failure fixture. Never expose actual invitation token or email secrets in test output.

Data must be clearly synthetic, contain no real patient details, and be reset only through an approved test environment fixture. No production test records should be created.

## Proposed post-redesign targets

These are targets to validate, not current results or committed SLOs.

| Task | Proposed target |
|---|---|
| Find a patient by name or phone | At least 4/5 operators find the correct record within 30 seconds without selecting a similar-name decoy |
| Book standard existing-patient appointment | At least 4/5 complete without facilitator help; median under 90 seconds after entering `/appointments` |
| Register then book | Booking draft returns with intended patient selected in 5/5 cases; no operator repeats previously completed booking fields |
| Complete queue transition | 5/5 operators identify the correct doctor lane and next valid action; stale conflict produces no silent overwrite |
| First setup | At least 4/5 first-time Admin participants reach a booked fictional first appointment without facilitator instruction |
| Accessibility verification | All core tasks are completable by keyboard; no focus trap/dead end; status and error changes are announced in selected screen reader/browser pair |
| Appointment list scale | A paginated response displays the first useful page without fetching unrequested historical pages; numeric performance target set after dataset profiling |

## Future moderated usability study (3–5 clinic operators)

Recruit 3–5 receptionists/clinic staff and, if available, one clinic Admin from small or medium clinics. Do not count this proposal as completed research. Use a facilitator plus note-taker, consent before recording, fictional clinic records, and no real patient information. Avoid teaching the UI; ask participants to think aloud and record completion, time, errors, backtracks, help requests, and confidence after each task.

### Scenario script

1. **Find a patient:** “Aditi Mehta called to book; find the right patient record.” Include the similar-name decoy and ask how they decide.
2. **Book:** “Book a visit with the appropriate doctor for this date. If the patient is not present, add the fictional record and return to finish booking.” Observe slot understanding, draft retention, and confirmation.
3. **Manage:** “The patient called to cancel; update this appointment appropriately and find who last changed it.” Observe valid actions, terminal reason, activity/history and list context.
4. **Queue:** “Mark this patient arrived, call the next person for Dr. Rao, then complete a visit.” In a second run, another Staff session changes an entry and observe recovery.
5. **Admin setup (Admin participant):** “Invite a new receptionist, then explain what the invitation status tells you and what the invitee must do.”

Follow with a short confidence/usability rating and ask what felt slow or unsafe. Separate observed issue from participant suggestion. Do not combine a visually preferred layout with an assumed workflow fix.

## Future QA scenarios

| ID | Preconditions and action | Expected result |
|---|---|---|
| QA-01 | New signed-in user with no internal clinic opens protected route | Clear loading then onboarding; no blank workspace or loop |
| QA-02 | Submit onboarding with invalid required field, then correct and retry | Field-linked error, preserved valid input, one successful submission |
| QA-03 | Book for similar-name patients using phone search | Correct record visible and distinguishable; no wrong patient silently selected |
| QA-04 | Choose unavailable slot and submit against changed availability | Server rejects safely; clear recovery/reload; no duplicate appointment |
| QA-05 | Add patient from booking and return | New patient appears in intended booking draft; no sensitive details in URL/storage |
| QA-06 | Apply appointment filters, inspect activity, close dialog | Operator can return to the same useful list context |
| QA-07 | Two Staff sessions modify same queue scope | One stale action receives clear conflict/reload message; no silent overwrite |
| QA-08 | Keyboard-only complete booking and queue transition | Logical focus order, visible focus, dialog focus containment/return, no keyboard trap |
| QA-09 | Screen reader follow status error and successful queue action | Error/success announced once with target patient/action context |
| QA-10 | Invite status SUBMITTED and FAILED cases | Copy does not claim delivery; eligible retry/resend is clear and safe |
| QA-11 | Patient/doctor/appointment/queue at phone widths and 200% zoom | Core actions remain reachable; content reflows or has labeled controlled scroll |
| QA-12 | Risk dialog open from dashboard and appointment row | Reasons/provenance/advisory status are understandable; no implied clinical certainty |

Related prioritized work and dependencies are in [the UX backlog](UX_REDESIGN_BACKLOG_V0_5.md).
