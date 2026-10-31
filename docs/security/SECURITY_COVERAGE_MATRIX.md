# SEC-19 route coverage matrix

Status: **Covered** = focused executable HTTP/DOM proof for the stated behavior; **Partially covered** = representative or one-sided proof; **Not covered** = no new SEC-19 proof; **Not applicable** = category does not apply. A route is Partially covered when at least one SEC-19 test directly exercises it but important categories remain untested. `A` = authentication, `R` = role, `T` = tenant isolation, `M` = denied mutation state, `S` = SQL input, `X` = frontend rendering. The table uses `C`, `P`, `N`, `–` for these four statuses. All protected routes use Clerk identity; `/api/auth/onboarding-*` and invitation acceptance resolve identity before an internal active user exists. Existing unit tests are supplementary and are not counted as database integration coverage.

`I` is `apps/server/tests/security/security.integration.test.ts`; `W` is the four component test files named in [SECURITY_TESTING.md](SECURITY_TESTING.md). Routes below come from the current `*.routes.ts` files. Clinic parameters derive authorization from the internal user's persisted `clinicId`; object-only appointment and prediction routes resolve the owning clinic in a service. Admin is required for clinic settings, lifecycle management, and staff management. Staff or Admin is allowed for daily patient, doctor, appointment, queue, dashboard, and prediction feedback operations. Critical risk denotes a direct mutation or sensitive cross-clinic data path; high risk denotes a sensitive read or management path.

| Method and route | Role / boundary | Operation and side effect | Risk | A | R | T | M | S | X | Overall / SEC-19 test |
|---|---|---|---|---|---|---|---|---|---|---|---|
| GET `/api/health` | Public | Health read | Low | – | – | – | – | – | – | Not applicable |
| GET `/api/auth/onboarding-status` | Clerk identity | Onboarding read | High | N | – | – | – | – | – | Not covered |
| POST `/api/auth/onboarding/clinic` | Clerk identity | Provision clinic and Admin | Critical | N | N | N | N | N | – | Not covered |
| GET `/api/auth/me` | Internal active user | Profile read | High | P | – | – | – | – | – | Partially covered / I indirectly |
| POST `/api/clinics` | Admin, service ownership | Create clinic | Critical | P | N | N | N | N | – | Not covered |
| GET `/api/clinics/:clinicId/lifecycle-impact` | Admin, service ownership | Impact read | High | P | N | P | – | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/deactivate` | Admin, service ownership | Deactivate clinic and links | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/restore` | Admin, service ownership | Restore clinic and links | Critical | P | N | P | C | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId` | Admin, clinic ID | Settings read | High | P | C | C | – | – | P | Partially covered / I |
| PATCH `/api/clinics/:clinicId` | Admin, clinic ID | Settings mutation | Critical | P | C | P | C | P | P | Partially covered / I |
| POST `/api/clinics/:clinicId/geocode` | Admin, clinic ID | External geocode and update | High | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/sample-data` | Admin, clinic ID | Synthetic sample writes | High | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/doctors` | Staff+, clinic ID | Doctor and link create | Critical | P | N | N | N | N | – | Not covered |
| GET `/api/clinics/:clinicId/doctors` | Staff+, clinic ID | Linked doctor list | High | P | P | C | – | N | C | Partially covered / I, W |
| PATCH `/api/clinics/:clinicId/doctors/:doctorId` | Staff+, clinic and doctor link | Profile/link update | Critical | P | P | P | C | N | C | Partially covered / I, W |
| GET `/api/clinics/:clinicId/doctors/:doctorId` | Staff+, clinic and doctor link | Doctor detail | High | P | P | P | – | – | C | Partially covered / I, W |
| GET `/api/clinics/:clinicId/doctors/:doctorId/lifecycle-impact` | Admin, doctor link | Impact read | High | P | N | P | – | – | – | Partially covered / I |
| DELETE `/api/clinics/:clinicId/doctors/:doctorId` | Admin, doctor link | Archive link/profile | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/doctors/:doctorId/restore` | Admin, doctor link | Restore link/profile | Critical | P | N | P | C | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId/doctors/:doctorId/availability` | Staff+, doctor link | Availability read | High | P | N | P | – | – | – | Partially covered / I |
| PUT `/api/clinics/:clinicId/doctors/:doctorId/availability` | Staff+, doctor link | Replace schedule | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/patients` | Staff+, clinic ID | Patient/link create | Critical | P | N | N | N | N | C | Not covered / W render only |
| POST `/api/clinics/:clinicId/patients/:patientId/route` | Staff+, patient link | External route and update | High | P | N | P | C | – | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/patients/:patientId` | Staff+, patient link | Patient/profile update | Critical | P | P | P | C | N | C | Partially covered / I, W |
| POST `/api/clinics/:clinicId/patients/:patientId/geocode` | Staff+, patient link | External geocode and update | High | P | N | P | C | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId/patients` | Staff+, clinic ID | Linked list and search | High | C | P | C | – | C | C | Partially covered / I, W |
| GET `/api/clinics/:clinicId/patients/:patientId` | Staff+, patient link | Patient detail | High | P | P | P | – | P | C | Partially covered / I, W |
| GET `/api/clinics/:clinicId/patients/:patientId/lifecycle-impact` | Admin, patient link | Impact read | High | P | N | P | – | – | – | Partially covered / I |
| DELETE `/api/clinics/:clinicId/patients/:patientId` | Admin, patient link | Archive link/profile | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/patients/:patientId/restore` | Admin, patient link | Restore link/profile | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/appointments` | Staff+, patient/doctor links | Create, prediction and queue work | Critical | P | P | P | C | N | C | Partially covered / I, W |
| GET `/api/clinics/:clinicId/appointments/available-slots` | Staff+, doctor link | Availability read | High | P | N | P | – | N | – | Partially covered / I |
| GET `/api/clinics/:clinicId/appointments` | Staff+, clinic ID | Appointment list/filter | High | C | P | C | – | P | C | Partially covered / I, W |
| PATCH `/api/appointments/:appointmentId/status` | Staff+, resolved appointment clinic | Appointment, queue, outcome and activity writes | Critical | C | P | C | C | P | – | Partially covered / I |
| GET `/api/appointments/:appointmentId/activities` | Staff+, resolved appointment clinic | Activity history read | High | P | P | C | – | C | – | Partially covered / I |
| GET `/api/appointments/:appointmentId/reschedule-slots` | Staff+, resolved appointment clinic | Slot read | High | P | N | P | – | N | – | Partially covered / I |
| PATCH `/api/appointments/:appointmentId/reschedule` | Staff+, resolved appointment clinic | Schedule/activity/prediction writes | Critical | P | P | C | C | P | – | Partially covered / I |
| GET `/api/clinics/:clinicId/queue` | Staff+, clinic ID | Queue and patient read | High | C | P | C | – | N | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/queue/reorder` | Staff+, queue membership | All queue positions | Critical | P | P | C | C | P | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/queue/:queueEntryId/status` | Staff+, queue ownership | Queue and appointment writes | Critical | P | P | C | C | P | – | Partially covered / I |
| GET `/api/clinics/:clinicId/dashboard/summary` | Staff+, clinic ID | Aggregate counts | High | C | P | C | – | P | – | Partially covered / I |
| GET `/api/clinics/:clinicId/dashboard/high-risk-appointments` | Staff+, clinic ID | Risk and patient read | High | P | P | C | – | N | – | Partially covered / I |
| GET `/api/clinics/:clinicId/dashboard/no-show-intelligence` | Staff+, clinic ID | Attendance aggregate | High | P | P | C | – | N | – | Partially covered / I |
| GET `/api/clinics/:clinicId/dashboard/today-activity` | Staff+, clinic ID | Activity aggregate | High | P | P | P | – | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId/staff` | Admin, clinic ID | Staff roster read | High | P | C | P | – | – | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/staff/:userId/status` | Admin, staff link | Suspend/activate | Critical | P | C | P | C | N | – | Partially covered / I |
| POST `/api/clinics/:clinicId/staff/invitations/:invitationId/resend` | Admin, invitation link | Email and invite state | Critical | P | N | P | C | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId/staff/invitations` | Admin, clinic ID | Invitation metadata read | High | P | C | P | – | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/staff/invitations` | Admin, clinic ID | Token hash, invitation and email | Critical | P | C | P | C | N | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/staff/invitations/:invitationId/revoke` | Admin, invitation link | Revoke invitation | Critical | P | P | P | C | – | – | Partially covered / I |
| GET `/api/clinics/:clinicId/staff/:userId` | Admin, staff link | Member detail read | High | P | N | P | – | – | – | Partially covered / I |
| PATCH `/api/clinics/:clinicId/staff/:userId` | Admin, staff link | Member profile update | Critical | P | N | P | C | N | – | Partially covered / I |
| DELETE `/api/clinics/:clinicId/staff/:userId` | Admin, staff link | Remove staff access | Critical | P | N | P | C | – | – | Partially covered / I |
| POST `/api/clinics/:clinicId/staff/:userId/restore` | Admin, staff link | Restore staff access | Critical | P | N | P | C | – | – | Partially covered / I |
| GET `/api/staff/invitations/:token` | Clerk identity, email/token | Limited invitation preview | High | P | – | P | – | N | – | Partially covered / I |
| POST `/api/staff/invitations/:token/accept` | Clerk identity, email/token | One-time membership claim | Critical | P | P | P | C | N | – | Partially covered / I |
| GET `/api/predictions/:predictionId/feedback` | Staff+, resolved prediction clinic | Own feedback read | High | P | P | C | – | C | N | Partially covered / I |
| PUT `/api/predictions/:predictionId/feedback` | Staff+, resolved prediction clinic | Parameterized feedback upsert | Critical | P | P | C | C | C | N | Partially covered / I |

The suite does not test prediction regeneration or export as HTTP routes because these are not implemented. A dataset-export CLI exists and needs separate CLI authorization and data-scoping review. It also does not prove Clerk token cryptography or browser-level script execution; the XSS checks prove these React components render payloads as text with no injected script, SVG, image, or event-handler DOM nodes. No `dangerouslySetInnerHTML` or direct `innerHTML` write was found in `apps/web/src` during this implementation.

Issue #300 extends the SEC-19 HTTP/PostgreSQL suite with shared-profile mutation checks in both clinic directions. The current suite passes 61 tests; the new cases confirm foreign shared Doctor/Patient profile writes and geocoding are denied without business-state changes, while clinic-local patient notes remain writable. The audit found and fixed this shared-profile integrity issue. Patient and appointment list responses are bounded and paginated in current source; older SEC-F-01 notes that say otherwise are historical. Remaining gaps include positive cross-association creation flows and deployment-side controls. The `apps/server` lint script currently prints a placeholder message, so it cannot serve as an enforcement gate. See [OBJECT_AUTHORIZATION_AUDIT.md](OBJECT_AUTHORIZATION_AUDIT.md).
