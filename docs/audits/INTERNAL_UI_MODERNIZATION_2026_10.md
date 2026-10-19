# Internal application UI audit — October 2026

This audit uses the current React routes and components as the behavior source. The README, PRD, architecture and frontend design guides, workflow atlas, release notes, Express route guards, Prisma schema, and lifecycle policies were checked before implementation. Older release notes describe an earlier product boundary; the current code also includes entity lifecycle, appointment activity, structured terminal reasons, invitations, and rescheduling.

## Route and capability inventory

| Screen                                | Current capability                                                                   | Audit finding                                                                                                                                                                                 |
| ------------------------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dashboard `/dashboard`                | Server summary, high-risk list, activity, setup dock                                 | Strong source data; lacked a compact schedule preview and direct task shortcuts. Queue `WAITING` records can be created at booking, so that count must not be described as physical arrivals. |
| Appointments `/appointments`          | Booking with server slots, filters, state actions, reschedule, history, risk details | Patient selection relied on a long native list. List had no name/phone search, pagination, or compact mobile presentation.                                                                    |
| Queue `/queue`                        | Doctor and status filters, status actions, terminal reasons, guarded server reorder  | Refresh was manual without a freshness cue. Doctor index calculation repeated work for each entry.                                                                                            |
| Patients `/patients`, `/patients/new` | Search, filters, detail, edit, archive/restore, creation                             | Desktop table forced horizontal reading on phones. Creation from booking discarded booking context.                                                                                           |
| Doctors `/doctors`, `/doctors/new`    | Search, filters, availability, detail, edit, archive/restore                         | Desktop table forced horizontal reading on phones.                                                                                                                                            |
| Staff `/staff`                        | Admin invitation, member actions, confirmation, search                               | Existing card layout and role guard are retained.                                                                                                                                             |
| Clinic settings `/clinic-settings`    | Admin settings, geocoding status, lifecycle controls                                 | Existing grouped form and backend permission checks are retained.                                                                                                                             |
| Profile `/profile`                    | Account and access context                                                           | Existing account menu and profile route are retained.                                                                                                                                         |
| Auth/onboarding                       | Clerk and internal user resolution, recovery, clinic provisioning                    | Existing route guards and setup behavior are retained.                                                                                                                                        |

## Changes made

- Added workspace-scoped surface, border, text, radius, shadow, and focus treatments aligned with the navy and teal public identity.
- Reused the public navy token in the desktop sidebar, dashboard pulse, and authentication preview; removed release jargon from the sign-in experience.
- Added mobile card presentation to appointment, patient, and doctor tables while keeping semantic desktop tables and visible field labels.
- Increased compact button and queue move targets to 40 pixels and moved keyboard focus to the booking section when navigating to its direct link.
- Added patient name/phone search and 15-row pagination to the appointment list. Existing date, doctor, patient, and status filters still use the server API. Search results and insight calculations are memoized while staff fill the booking form.
- Added patient lookup within booking and a router-state return path through patient creation. The appointment draft and new patient selection return to booking without storing medical context in browser storage.
- Added dashboard quick actions, operational attention links, a five-row appointment preview, and a short active queue preview using existing clinic-scoped appointment data. Physical waiting counts now require an arrived or in-queue appointment status. A failed preview request leaves the dashboard summary available and marks the preview and waiting count unavailable.
- Added a manual refresh timestamp to the queue and reduced doctor-position indexing from repeated scans to one pass. Reorder remains server-authoritative.
- Prevented Admin-only links from appearing when the frontend role is unresolved; backend authorization remains authoritative.

## Remaining work and limits

- Appointment and dashboard previews load the existing full clinic/date list because the current API has no server pagination. The 15-row control limits rendered rows, not transferred records. Server pagination is the next scale improvement.
- The authenticated app has no browser screenshot or end-to-end harness in the repository; this pass has build, lint, and component/integration test evidence, but no measured viewport screenshots or screen-reader certification.
- Staff, settings, and onboarding received the shared workspace styling where applicable; their workflow layouts were already structured and were not rebuilt.
- There is no WebSocket queue feed. The UI explicitly says manual refresh.
- This code is not deployed by the audit. Production appearance and data behavior require an authenticated environment check after release.

## Safety checks

No REST contract, Prisma model, authorization middleware, appointment transition policy, queue transition policy, or reorder transaction was changed. The appointment and queue preview use clinic-scoped authenticated API calls. No risk result is generated in the client.
