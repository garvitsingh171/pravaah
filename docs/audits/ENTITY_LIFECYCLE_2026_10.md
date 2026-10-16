# Entity lifecycle audit — October 2026

Source of truth: current Prisma schema, Express routes/services, React feature pages, v0.3 release notes, and the existing authentication and workflow tests. The older MVP guide describes the v0.1 boundary; onboarding, invitations, rescheduling, activity history, and versioned predictions are already implemented in later releases.

| Entity           | Create                                                                  | Read                                             | Update                                                                     | Delete/lifecycle before this work          | Frontend before this work                     | Missing work                                                                              |
| ---------------- | ----------------------------------------------------------------------- | ------------------------------------------------ | -------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Clinic           | Transactional clinic + first Admin onboarding; standalone POST disabled | Admin GET settings                               | Admin PATCH settings                                                       | `isActive` exists, no operation            | Settings page                                 | Impact review, Admin deactivation, recovery path, audit                                   |
| Admin account    | First account through onboarding                                        | Profile and Admin team list                      | No role/profile management API                                             | None                                       | Profile, team list                            | Protect sole Admin; no ordinary delete                                                    |
| Staff            | Invitation acceptance creates or activates internal user                | Admin team/invitation list                       | Admin suspend/reactivate                                                   | No removal state                           | Invite, suspend/reactivate, revoke invitation | Detail/edit/remove, durable access revocation                                             |
| Doctor           | Clinic create also creates DoctorClinic                                 | Clinic list, availability                        | Global profile PATCH and availability PUT; PATCH accepts global `isActive` | No clinic-link archive/restore             | Create/edit/list/status filtering             | Scoped detail and archive/restore; block unresolved visits; remove global status mutation |
| DoctorClinic     | Created with Doctor                                                     | Included in list                                 | Availability replace                                                       | `isActive` exists but no route             | Link status displayed                         | Scoped lifecycle                                                                          |
| Patient          | Clinic create also creates PatientClinic                                | Clinic list/search                               | Global profile + clinic notes PATCH; PATCH accepts global `isActive`       | No clinic-link archive/restore             | Create/edit/list/status filtering             | Scoped detail and archive/restore; block unresolved visits; remove global status mutation |
| PatientClinic    | Created with Patient                                                    | Included in list                                 | Clinic notes                                                               | `isActive` exists but no route             | History/status displayed                      | Scoped lifecycle                                                                          |
| Appointment      | Booked with queue and prediction                                        | List, activity, slots                            | Valid status transitions and reschedule                                    | Cancellation/no-show are terminal states   | Booking, list/detail, status, reschedule      | Keep workflow semantics; no physical delete                                               |
| QueueEntry       | Created with booking                                                    | Clinic-date queue                                | Valid status and reorder                                                   | Terminal status via appointment/queue flow | Live queue                                    | Keep workflow semantics; no physical delete                                               |
| NoShowPrediction | Generated on booking/backfill/reschedule and refresh work               | Explanations through appointment/dashboard/queue | Immutable versioned runs                                                   | None by design                             | Risk indicators and reasons                   | Keep immutable; no generic delete                                                         |

## Safety decisions

- `User.clinicId` is the current single-clinic access model. Clerk proves identity; each protected request reloads the internal active user. Staff role is never client controlled.
- Doctor and patient archiving applies to `DoctorClinic.isActive` and `PatientClinic.isActive`. Their global profiles and other clinic links remain intact. Historical appointments, queue entries, predictions, and attendance counters remain intact.
- New bookings already require active clinic, profile, and clinic link. Normal active lists and selectors must use the clinic link status; archived records remain available in explicit inactive views.
- Doctor and patient lifecycle operations must reject unresolved future appointments and active queue work under a transaction lock. Users must resolve the visits explicitly; lifecycle actions do not silently cancel them.
- Clinic deactivation must preserve every record, block ordinary clinic work, and leave an Admin-only recovery route. It must not be exposed as ordinary deletion.
- Staff removal revokes internal authorization without deleting Clerk identity or historical creator attribution. A distinct removal status is needed because suspension and removal have different recovery rules.
- Ordinary CRUD must not hard-delete clinical history. Privacy erasure requires a separate retention and authorization design.
- `AppointmentActivity` is the existing visit audit log. Non-appointment lifecycle changes need a small durable clinic-scoped event model, written in the same transaction as state changes.

## Schema and integrity observations

`DoctorClinic` and `PatientClinic` have cascade relations to global profiles and Clinic, but Appointment, QueueEntry, NoShowPrediction, and AppointmentActivity use restrictive relations. No lifecycle endpoint should invoke a physical delete. The existing global `isActive` field on Doctor/Patient is separate from the clinic link and must not be writable through a clinic-scoped edit route. The partial active doctor-slot unique index and queue reorder locks must remain untouched.

## Implemented capability matrix

| Entity                    | Create                    | Read                                  | Update                                  | Lifecycle                                            | UI                                                |
| ------------------------- | ------------------------- | ------------------------------------- | --------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Clinic                    | First Admin onboarding    | Admin settings; inactive Admin impact | Admin settings                          | Admin confirmed deactivate/restore                   | Settings danger zone and inactive-clinic recovery |
| Admin                     | First Admin onboarding    | Own profile; team listing             | Existing profile flow only              | No ordinary removal route; sole Admin preserved      | Profile and team context                          |
| Staff                     | Invitation and acceptance | Admin team, invitation list, detail   | Admin name/phone and suspend/reactivate | Admin remove/restore; internal `REMOVED` blocks APIs | Team search/filter, detail/edit, confirmations    |
| Doctor and DoctorClinic   | Existing create           | List/detail and impact                | Existing profile/availability edit      | Admin archive/restore clinic link                    | Active/inactive search and actions                |
| Patient and PatientClinic | Existing create           | List/detail and impact                | Existing profile and clinic notes edit  | Admin archive/restore clinic link                    | Active/archived search and actions                |
| Appointment               | Existing booking          | Existing list/activity                | Existing status/reschedule              | Cancel/no-show terminal transitions; no hard delete  | Existing booking and workflow controls            |
| QueueEntry                | Booking workflow          | Existing live queue                   | Existing state/reorder                  | Terminal visit workflow; no hard delete              | Existing queue actions                            |
| NoShowPrediction          | Generated                 | Existing risk/explanation views       | Versioned recalculation path            | Immutable history; no delete                         | Existing risk displays                            |

The current `User.clinicId` model supports one clinic per internal user. There is no independent multi-clinic list endpoint or Admin role reassignment. Those operations would require a membership redesign, so the existing onboarding and invitation flows remain the supported creation paths. Doctor and patient profile edits still affect their global profile, while archive/restore affects only the requested clinic link.

## Permissions and behavior

All lifecycle APIs authenticate a verified Clerk bearer token and reload the active internal user. Doctor and patient archive/restore, staff management, and clinic lifecycle require Admin. Staff may continue their existing booking, patient-editing, appointment, and queue workflows. The backend derives role, actor, and clinic membership; request bodies cannot set them. `REMOVED` and `SUSPENDED` users fail the active-user check on every protected request. The Clerk identity remains intact. An invitation does not reactivate a removed member; an Admin must explicitly restore them. Pending invitation acceptance is blocked while the clinic is inactive. Admin accounts cannot be targeted through Staff status or removal routes, which also protects the sole clinic Admin.

Doctor/patient archive operates on `DoctorClinic.isActive` or `PatientClinic.isActive`. It rejects an association with unresolved appointments or active queue entries, leaves other clinic links unchanged, and preserves appointments, attendance counters, queue history, and predictions. Booking and rescheduling acquire shared membership locks before committing, so a concurrent archive cannot leave a newly booked visit on an archived association. Default management views show active records, with inactive filters available for history and restoration.

Clinic deactivation requires an exact name confirmation and rejects unresolved appointments or active queue work. It pauses protected clinic operations through the existing access check. An active Admin can access only the impact and restore endpoints while the clinic is inactive; the web shell provides the recovery action. Staff see a paused-clinic notice. No visit is silently cancelled. Appointment cancellation and queue transitions remain the existing auditable workflow, and prediction versions remain immutable.

`LifecycleEvent` records actor, clinic, entity, action, timestamp, and limited metadata for clinic, staff, invitation, doctor link, and patient link transitions. Appointment activity remains in `AppointmentActivity`. No patient names, invitation tokens, or clinical notes are placed in lifecycle metadata.

## API additions

All paths below are under `/api` and use the existing `{ success, message, data }` response envelope. All IDs are UUIDs. `GET /clinics/:clinicId` and `PATCH /clinics/:clinicId` already existed.

| Method           | Path                                                      | Access      | Meaning                                             |
| ---------------- | --------------------------------------------------------- | ----------- | --------------------------------------------------- |
| GET              | `/clinics/:clinicId/lifecycle-impact`                     | Admin       | Clinic and active/future visit counts               |
| POST             | `/clinics/:clinicId/deactivate`                           | Admin       | Body `{ "confirmClinicName": "Exact clinic name" }` |
| POST             | `/clinics/:clinicId/restore`                              | Admin       | Empty body `{}`; works while inactive               |
| GET/PATCH/DELETE | `/clinics/:clinicId/staff/:userId`                        | Admin       | Detail, allowed profile edit, access removal        |
| POST             | `/clinics/:clinicId/staff/:userId/restore`                | Admin       | Restore removed Staff                               |
| GET              | `/clinics/:clinicId/doctors/:doctorId`                    | Clinic user | Scoped detail                                       |
| GET              | `/clinics/:clinicId/doctors/:doctorId/lifecycle-impact`   | Admin       | Archive impact                                      |
| DELETE           | `/clinics/:clinicId/doctors/:doctorId`                    | Admin       | Archive clinic link                                 |
| POST             | `/clinics/:clinicId/doctors/:doctorId/restore`            | Admin       | Restore clinic link                                 |
| GET              | `/clinics/:clinicId/patients/:patientId`                  | Clinic user | Scoped detail                                       |
| GET              | `/clinics/:clinicId/patients/:patientId/lifecycle-impact` | Admin       | Archive impact                                      |
| DELETE           | `/clinics/:clinicId/patients/:patientId`                  | Admin       | Archive clinic link                                 |
| POST             | `/clinics/:clinicId/patients/:patientId/restore`          | Admin       | Restore clinic link                                 |

Examples, with an Admin bearer token:

```bash
curl -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/clinics/$CLINIC_ID/doctors/$DOCTOR_ID/lifecycle-impact"
curl -X DELETE -H "Authorization: Bearer $TOKEN" "$API_BASE_URL/clinics/$CLINIC_ID/doctors/$DOCTOR_ID"
curl -X POST -H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{"confirmClinicName":"Pravaah Family Clinic"}' "$API_BASE_URL/clinics/$CLINIC_ID/deactivate"
```

Conflicts return 409 with a domain code and, for active visits, numeric impact details. Repeated lifecycle transitions return a conflict so the caller refreshes state. Inaccessible clinic associations return 404 after clinic authorization.

## Migration and rollout

Deploy the additive `20261016000000_entity_lifecycle` migration before serving code that writes `REMOVED` or `LifecycleEvent`. It adds one enum value and a restrictive audit table with indexes; existing rows need no backfill, and no production data deletion is required. Generate the Prisma client during build. Apply migrations through the project's normal reviewed deployment process. Rollback should restore the prior application version and retain the added enum value/table until a separate data-preserving cleanup is approved; PostgreSQL enum values are not safely removed by a simple down migration. No database reset or production migration was run during implementation.

Ordinary archive is not a privacy-erasure operation. A future erasure workflow must define retention, authorization, and downstream data handling separately. This release does not provide physical deletion, multi-clinic user memberships, Admin reassignment, or a lifecycle event viewer.
