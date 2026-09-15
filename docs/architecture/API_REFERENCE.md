# API Reference

This reference is based on the current route files in `apps/server/src/modules/**`. For route ownership, validation boundaries, transactions, and persistence details, read the [backend/database LLD section](../LLD.md#backend-database-and-workflow-implementation).

Base URL in local development:

```txt
http://localhost:5000/api
```

Protected endpoints require:

```txt
Authorization: Bearer <Clerk session token>
```

## Response Shapes

Success:

```json
{
    "success": true,
    "message": "Message",
    "data": {}
}
```

Error:

```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Message"
    }
}
```

Validation errors include `error.details`.

## Health

| Method | Path          | Auth | Summary               |
| ------ | ------------- | ---- | --------------------- |
| GET    | `/api/health` | No   | Backend health check. |

Response data:

```json
{
    "success": true,
    "message": "Pravaah API is healthy"
}
```

## Auth

### Get Onboarding Status

| Field             | Value                                                      |
| ----------------- | ---------------------------------------------------------- |
| Method            | GET                                                        |
| Path              | `/api/auth/onboarding-status`                              |
| Auth              | Required, valid Clerk identity; internal user not required |
| Params/query/body | None                                                       |

This read-only endpoint derives provisioning state from the existing internal `User`
and assigned `Clinic` records. It does not create a clinic, create an internal user,
assign a role, or provision sample data.

Response shape, abbreviated:

```json
{
    "success": true,
    "message": "Onboarding status retrieved successfully",
    "data": {
        "onboarding": {
            "status": "NOT_STARTED",
            "nextStep": "CREATE_CLINIC",
            "isComplete": false
        },
        "user": null,
        "clinic": null,
        "setup": null
    }
}
```

When onboarding is completed, `data.setup` contains the server-derived first-run
setup status used by the Admin dashboard checklist:

```json
{
    "clinicSettingsComplete": true,
    "hasDoctor": false,
    "hasPatient": false,
    "hasAppointment": false
}
```

`setup` is `null` for `NOT_STARTED` and `RECOVERY_REQUIRED` states.

States:

| Status              | Meaning                                                        | Next step          |
| ------------------- | -------------------------------------------------------------- | ------------------ |
| `NOT_STARTED`       | Valid Clerk identity exists, but no internal Pravaah user does | `CREATE_CLINIC`    |
| `COMPLETED`         | Active Admin/Staff user has an active assigned clinic          | `OPEN_APPLICATION` |
| `RECOVERY_REQUIRED` | Internal user exists, but role/status/clinic state is invalid  | `RECOVER_ACCOUNT`  |

Main errors:

- `AUTHENTICATION_REQUIRED`
- `INVALID_AUTH_TOKEN`

### Create Clinic Onboarding

| Field        | Value                                                      |
| ------------ | ---------------------------------------------------------- |
| Method       | POST                                                       |
| Path         | `/api/auth/onboarding/clinic`                              |
| Auth         | Required, valid Clerk identity; internal user not required |
| Params/query | None                                                       |

This endpoint is the first-time onboarding bootstrap path. It is not the ordinary
Admin-only `POST /api/clinics` endpoint. The backend uses the trusted Clerk user
ID from the authenticated request to look up the Clerk user server-side, then
creates the clinic and first internal Admin in one Prisma transaction.
Completed retries are idempotent: if the current Clerk identity already has a
completed onboarding state, the endpoint returns that existing account and
clinic instead of creating, updating, or comparing against the retry body.

Body:

```txt
name, slug required
phone, email, address fields optional
country default India
timezone default Asia/Kolkata; must be a valid IANA time zone
openingTime default 09:00
closingTime default 18:00
slotDurationMinutes default 15
bufferMinutes default 0
```

The request body accepts clinic profile fields only. The clinic `email` field is
clinic contact data and is not used as the internal Admin email. The internal
Admin email, first name, and last name are resolved from Clerk on the backend.
The backend sets `role = ADMIN`, `status = ACTIVE`, and links the user to the
new clinic. Client-supplied role, status, user ID, Clerk user ID, clinic ID, or
ownership fields are rejected by validation.

First successful creation returns `201 Created`:

```json
{
    "success": true,
    "message": "Clinic onboarding completed successfully",
    "data": {
        "onboarding": {
            "status": "COMPLETED",
            "nextStep": "OPEN_APPLICATION",
            "isComplete": true
        },
        "user": {
            "id": "internal-user-id",
            "fullName": "Clinic Admin",
            "email": "admin@example.com",
            "role": "ADMIN",
            "status": "ACTIVE"
        },
        "clinic": {
            "id": "clinic-id",
            "name": "Example Clinic",
            "slug": "example-clinic"
        },
        "setup": {
            "clinicSettingsComplete": true,
            "hasDoctor": false,
            "hasPatient": false,
            "hasAppointment": false
        }
    }
}
```

Completed replay returns `200 OK` with the same data shape and this message:

```json
{
    "success": true,
    "message": "Clinic onboarding already completed",
    "data": {
        "onboarding": {
            "status": "COMPLETED",
            "nextStep": "OPEN_APPLICATION",
            "isComplete": true
        },
        "user": {
            "id": "existing-user-id",
            "fullName": "Existing User",
            "email": "user@example.com",
            "role": "ADMIN",
            "status": "ACTIVE"
        },
        "clinic": {
            "id": "existing-clinic-id",
            "name": "Existing Clinic",
            "slug": "existing-clinic"
        },
        "setup": {
            "clinicSettingsComplete": true,
            "hasDoctor": true,
            "hasPatient": true,
            "hasAppointment": true
        }
    }
}
```

If a unique constraint conflict occurs during provisioning, the backend re-reads
the current Clerk identity before mapping the error. A completed current account
wins over the submitted slug and returns the idempotent replay response. An
existing inconsistent account returns a recovery conflict.

Main errors:

- `AUTHENTICATION_REQUIRED`
- `INVALID_AUTH_TOKEN`
- `VALIDATION_ERROR`
- `CLINIC_SLUG_ALREADY_EXISTS`
- `CLINIC_PROVISIONING_CONFLICT`
- `CLERK_IDENTITY_DATA_MISSING`
- `INTERNAL_USER_ALREADY_EXISTS`
- `CLINIC_PROVISIONING_FAILED`

### Get Current User

| Field             | Value          |
| ----------------- | -------------- |
| Method            | GET            |
| Path              | `/api/auth/me` |
| Auth              | Required       |
| Params/query/body | None           |

Response summary:

```txt
data.user:
  id, fullName, email, role, status, clinicId, clinic
```

Main errors:

- `AUTHENTICATION_REQUIRED`
- `INVALID_AUTH_TOKEN`
- `INTERNAL_USER_NOT_FOUND`
- `USER_NOT_ACTIVE`

## Clinics

### Create Clinic Disabled

| Field  | Value           |
| ------ | --------------- |
| Method | POST            |
| Path   | `/api/clinics`  |
| Auth   | Required, Admin |

Standalone clinic creation is disabled in v0.2 because it can create a clinic
without creating and linking an owning Admin. First-time clinic creation must use
`POST /api/auth/onboarding/clinic`.

The endpoint remains protected for compatibility, but it does not validate a
create body and does not call Prisma.

Main errors:

- `STANDALONE_CLINIC_CREATION_DISABLED`
- `ADMIN_REQUIRED`

### Provision Sample Data

| Field  | Value                                |
| ------ | ------------------------------------ |
| Method | POST                                 |
| Path   | `/api/clinics/:clinicId/sample-data` |
| Auth   | Required, own active clinic, Admin   |

This endpoint provisions fictional demonstration records for the authenticated
Admin's clinic after onboarding has completed. It does not run the development
seed script and does not reuse fixed seed IDs. The backend uses the authenticated
internal user as `createdByUserId`, creates the sample records in one transaction,
and returns an idempotent success response when sample data is already present.

Body:

```json
{}
```

Response summary:

```txt
data.outcome: CREATED | ALREADY_PROVISIONED
data.summary:
  doctors, patients, appointments, noShowPredictions, queueEntries,
  todayQueueEntries, today
```

Main errors:

- `AUTHENTICATION_REQUIRED`
- `INTERNAL_USER_NOT_FOUND`
- `USER_NOT_ACTIVE`
- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `INVALID_CLINIC_TIMEZONE`
- `ADMIN_REQUIRED`
- `VALIDATION_ERROR`

### Get Clinic Settings

| Field  | Value                              |
| ------ | ---------------------------------- |
| Method | GET                                |
| Path   | `/api/clinics/:clinicId`           |
| Auth   | Required, own active clinic, Admin |

Params:

- `clinicId` UUID-shaped string

Response summary:

```txt
data.clinic:
  id, name, slug
  phone, email
  addressLine1, addressLine2, city, state, country, pincode
  timezone, openingTime, closingTime
  slotDurationMinutes, bufferMinutes, lateArrivalGraceMinutes
  createdAt, updatedAt
```

The response does not include clinic activation controls, ownership, Clerk identity,
internal user identity, role, status, or clinic relationship data.

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `ADMIN_REQUIRED`
- `VALIDATION_ERROR`

### Update Clinic

| Field  | Value                              |
| ------ | ---------------------------------- |
| Method | PATCH                              |
| Path   | `/api/clinics/:clinicId`           |
| Auth   | Required, own active clinic, Admin |

Params:

- `clinicId` UUID-shaped string

Body summary:

- any supported settings field except read-only `slug`
- at least one field required
- optional text fields may be sent as `null` to clear them

Supported fields:

```txt
name
phone, email
addressLine1, addressLine2, city, state, country, pincode
timezone, openingTime, closingTime
slotDurationMinutes, bufferMinutes, lateArrivalGraceMinutes
```

`lateArrivalGraceMinutes` must be an integer greater than or equal to `0`. Future first arrivals are marked late only when their signed delay exceeds this value.

Response summary:

```txt
data.clinic
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `ADMIN_REQUIRED`
- `VALIDATION_ERROR`

## Doctors

### Create Doctor

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | POST                                     |
| Path   | `/api/clinics/:clinicId/doctors`         |
| Auth   | Required, own active clinic, Admin/Staff |

Body summary:

```txt
fullName required
specialization, qualification, registrationNumber optional
phone, email optional
gender optional: MALE, FEMALE, OTHER
experienceYears optional non-negative integer
```

Response summary:

```txt
data.doctor
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_STAFF_REQUIRED`
- `VALIDATION_ERROR`

### List Doctors

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | GET                                      |
| Path   | `/api/clinics/:clinicId/doctors`         |
| Auth   | Required, own active clinic, Admin/Staff |

Response summary:

```txt
data.doctors[]
  doctorClinicId, clinicLinkIsActive, doctor fields
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_STAFF_REQUIRED`

### Update Doctor

| Field  | Value                                      |
| ------ | ------------------------------------------ |
| Method | PATCH                                      |
| Path   | `/api/clinics/:clinicId/doctors/:doctorId` |
| Auth   | Required, own active clinic, Admin/Staff   |

Body summary:

- any create-doctor field plus `isActive`
- at least one field required
- nullable optional fields may be sent as `null` to clear them

Main errors:

- `DOCTOR_NOT_FOUND`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `CLINIC_ACCESS_DENIED`
- `VALIDATION_ERROR`

### Get Doctor Availability

| Field  | Value                                                   |
| ------ | ------------------------------------------------------- |
| Method | GET                                                     |
| Path   | `/api/clinics/:clinicId/doctors/:doctorId/availability` |
| Auth   | Required, own active clinic, Admin/Staff                |

This returns the doctor's recurring weekly working schedule for the scoped clinic.
Availability is owned by the `DoctorClinic` link, not the global `Doctor` row.
Times are clinic-local `HH:mm` wall-clock values interpreted in the returned
`timezone`.

Response shape:

```json
{
    "availability": {
        "doctorId": "doctor-id",
        "doctorClinicId": "doctor-clinic-id",
        "clinicId": "clinic-id",
        "timezone": "Asia/Kolkata",
        "days": [
            {
                "weekday": "MONDAY",
                "periods": [
                    {
                        "id": "period-id",
                        "startTime": "09:00",
                        "endTime": "13:00"
                    }
                ]
            },
            {
                "weekday": "TUESDAY",
                "periods": []
            }
        ]
    }
}
```

The response always returns all seven weekdays in Monday-through-Sunday order.
Periods within a day are ordered by `startTime`.

Main errors:

- `DOCTOR_NOT_FOUND`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `CLINIC_ACCESS_DENIED`
- `CLINIC_STAFF_REQUIRED`
- `VALIDATION_ERROR`

### Replace Doctor Availability

| Field  | Value                                                   |
| ------ | ------------------------------------------------------- |
| Method | PUT                                                     |
| Path   | `/api/clinics/:clinicId/doctors/:doctorId/availability` |
| Auth   | Required, own active clinic, Admin/Staff                |

This replaces the full recurring week atomically. The body must include each
weekday exactly once. Empty `periods` means no recurring availability for that
weekday. Multiple periods per weekday are allowed.

Request body, abbreviated:

```json
{
    "days": [
        {
            "weekday": "MONDAY",
            "periods": [
                {
                    "startTime": "09:00",
                    "endTime": "13:00"
                },
                {
                    "startTime": "15:00",
                    "endTime": "18:00"
                }
            ]
        },
        {
            "weekday": "TUESDAY",
            "periods": []
        }
    ]
}
```

Validation:

- weekdays must use `MONDAY` through `SUNDAY`
- all seven weekdays must be present exactly once
- times must be strict zero-padded `HH:mm`
- `startTime < endTime`
- duplicate and overlapping periods are rejected per weekday
- adjacent half-open intervals such as `09:00-12:00` and `12:00-15:00` are valid
- periods must fit within `Clinic.openingTime` and `Clinic.closingTime`

Response shape matches Get Doctor Availability.

Main errors:

- `DOCTOR_NOT_FOUND`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `CLINIC_OPERATING_HOURS_INVALID`
- `DOCTOR_AVAILABILITY_OUTSIDE_CLINIC_HOURS`
- `CLINIC_ACCESS_DENIED`
- `CLINIC_STAFF_REQUIRED`
- `VALIDATION_ERROR`

This endpoint does not generate appointment slots, enforce appointment booking
availability, cancel existing appointments, reschedule appointments, or change
queue/prediction data.

## Patients

### Create Patient

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | POST                                     |
| Path   | `/api/clinics/:clinicId/patients`        |
| Auth   | Required, own active clinic, Admin/Staff |

Body summary:

```txt
fullName required
phone required
email, gender, dateOfBirth, age optional
address, city optional
emergencyContactName, emergencyContactPhone optional
notes optional
distanceFromClinicKm optional
```

Response summary:

```txt
data.patient
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_STAFF_REQUIRED`
- `VALIDATION_ERROR`

### List Patients

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | GET                                      |
| Path   | `/api/clinics/:clinicId/patients`        |
| Auth   | Required, own active clinic, Admin/Staff |

Query:

- `search` optional non-empty string
- `isActive` optional `true` or `false`

Response summary:

```txt
data.patients[]
  PatientClinic item including nested patient
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `VALIDATION_ERROR`

### Update Patient

| Field  | Value                                        |
| ------ | -------------------------------------------- |
| Method | PATCH                                        |
| Path   | `/api/clinics/:clinicId/patients/:patientId` |
| Auth   | Required, own active clinic, Admin/Staff     |

Body summary:

- any create-patient field plus nullable optional fields and `isActive`
- at least one field required
- `notes` and `distanceFromClinicKm` update `PatientClinic`

Main errors:

- `PATIENT_NOT_FOUND`
- `PATIENT_NOT_LINKED_TO_CLINIC`
- `CLINIC_ACCESS_DENIED`
- `VALIDATION_ERROR`

## Appointments

### Get Available Appointment Slots

| Field  | Value                                                   |
| ------ | ------------------------------------------------------- |
| Method | GET                                                     |
| Path   | `/api/clinics/:clinicId/appointments/available-slots`   |
| Auth   | Required, own active clinic, Admin/Staff                |

Query:

- `doctorId` required UUID
- `date` required `YYYY-MM-DD`
- `durationMinutes` required positive integer

Response summary:

```txt
data:
  clinicId, doctorId, date, timezone
  durationMinutes, slotDurationMinutes, bufferMinutes
  slots[]:
    scheduledAt ISO datetime
    endsAt ISO datetime
    localDate
    localStartTime
    localEndTime
```

Slots are generated from clinic operating hours, `Clinic.slotDurationMinutes`,
`Clinic.bufferMinutes`, the selected doctor's recurring weekly
`DoctorAvailabilityPeriod` rows, and existing active appointments.

Main errors:

- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `DOCTOR_NOT_FOUND`
- `DOCTOR_INACTIVE`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `CLINIC_OPERATING_HOURS_INVALID`
- `CLINIC_SLOT_DURATION_INVALID`
- `CLINIC_BUFFER_INVALID`
- `VALIDATION_ERROR`

### Create Appointment

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | POST                                     |
| Path   | `/api/clinics/:clinicId/appointments`    |
| Auth   | Required, own active clinic, Admin/Staff |

Body summary:

```txt
doctorId required
patientId required
scheduledAt ISO datetime required
durationMinutes positive integer, default 15
reason, notes optional
bookingSource default RECEPTION; allowed RECEPTION, PHONE, WEB, WALK_IN
```

`scheduledAt` should come from the available-slots endpoint. Creation revalidates
that the requested time is still a generated slot and then checks active
appointment overlaps using appointment duration plus clinic buffer.

Response summary:

```txt
data.appointment
data.queueEntry
data.noShowPrediction
```

Main errors:

- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `DOCTOR_NOT_FOUND`
- `DOCTOR_INACTIVE`
- `PATIENT_NOT_FOUND`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `PATIENT_NOT_LINKED_TO_CLINIC`
- `APPOINTMENT_SLOT_UNAVAILABLE`
- `APPOINTMENT_SLOT_CONFLICT`
- `VALIDATION_ERROR`

### List Appointments

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | GET                                      |
| Path   | `/api/clinics/:clinicId/appointments`    |
| Auth   | Required, own active clinic, Admin/Staff |

Query:

- `date` optional `YYYY-MM-DD`
- `doctorId` optional UUID
- `patientId` optional UUID
- `status` optional appointment status

Response summary:

```txt
data.appointments[]
  appointment fields
  arrival fields: arrivedAt, arrivalOffsetMinutes, isLateArrival, lateArrivalGraceMinutes
  doctor summary
  patient summary
  queueEntry summary
  noShowPrediction response or null
```

Main errors:

- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `DOCTOR_NOT_FOUND`
- `PATIENT_NOT_FOUND`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `PATIENT_NOT_LINKED_TO_CLINIC`
- `VALIDATION_ERROR`

### Get Appointment Reschedule Slots

| Field  | Value                                                              |
| ------ | ------------------------------------------------------------------ |
| Method | GET                                                                |
| Path   | `/api/appointments/:appointmentId/reschedule-slots`                |
| Auth   | Required, Admin/Staff, appointment's clinic must match user clinic |

Query:

- `date` required `YYYY-MM-DD`

Response summary:

```txt
data.availability:
  appointmentId, clinicId, doctorId, date, timezone
  durationMinutes, slotDurationMinutes, bufferMinutes
  currentScheduledAt
  slots[]:
    scheduledAt ISO datetime
    endsAt ISO datetime
    localDate
    localStartTime
    localEndTime
```

The backend derives clinic, doctor, duration, and the current appointment ID from the persisted appointment. The current appointment is excluded from conflict reads internally, but callers cannot provide an arbitrary exclusion. Returned slots omit the exact current `scheduledAt`.

Main errors:

- `APPOINTMENT_NOT_FOUND`
- `CLINIC_ACCESS_DENIED`
- `APPOINTMENT_RESCHEDULE_NOT_ALLOWED`
- `DOCTOR_NOT_FOUND`
- `DOCTOR_INACTIVE`
- `DOCTOR_NOT_LINKED_TO_CLINIC`
- `APPOINTMENT_SLOT_UNAVAILABLE`
- `VALIDATION_ERROR`

### Reschedule Appointment

| Field  | Value                                                              |
| ------ | ------------------------------------------------------------------ |
| Method | PATCH                                                              |
| Path   | `/api/appointments/:appointmentId/reschedule`                      |
| Auth   | Required, Admin/Staff, appointment's clinic must match user clinic |

Body:

```json
{
    "scheduledAt": "2026-09-17T09:00:00.000Z",
    "currentScheduledAt": "2026-09-15T09:00:00.000Z"
}
```

Only destination `scheduledAt` and the user-confirmed `currentScheduledAt` version are accepted. Doctor, patient, clinic, duration, status, source, reason, and notes are derived from the existing appointment and are not mutable through this endpoint.

Response summary:

```txt
data.appointment
```

The mutation preserves appointment identity and lifecycle status. It revalidates current status, queue state, clinic settings, doctor availability, slot grid, active overlaps, the confirmed current timestamp, and queue destination position inside one transaction. Same-timestamp requests return the current appointment as a no-op when `currentScheduledAt` still matches persisted state.

Main errors:

- `APPOINTMENT_NOT_FOUND`
- `CLINIC_ACCESS_DENIED`
- `APPOINTMENT_RESCHEDULE_NOT_ALLOWED`
- `APPOINTMENT_RESCHEDULE_CONFLICT`
- `APPOINTMENT_SLOT_UNAVAILABLE`
- `APPOINTMENT_SLOT_CONFLICT`
- `QUEUE_ENTRY_NOT_FOUND`
- `STATUS_SYNC_CONFLICT`
- `QUEUE_REORDER_CONFLICT`
- `VALIDATION_ERROR`

### Update Appointment Status

| Field  | Value                                                              |
| ------ | ------------------------------------------------------------------ |
| Method | PATCH                                                              |
| Path   | `/api/appointments/:appointmentId/status`                          |
| Auth   | Required, Admin/Staff, appointment's clinic must match user clinic |

Body:

```txt
status: SCHEDULED | CONFIRMED | ARRIVED | IN_QUEUE | CALLED | COMPLETED | CANCELLED | NO_SHOW
```

Response summary:

```txt
data.appointment
```

Clients submit only the requested status. When the valid transition reaches `ARRIVED`, `IN_QUEUE`, or `CALLED`, the backend records the first arrival timestamp, signed offset, late classification, and grace snapshot if no arrival was previously recorded. `CANCELLED`, `NO_SHOW`, and `COMPLETED` do not create arrival facts by themselves.

Main errors:

- `APPOINTMENT_NOT_FOUND`
- `CLINIC_ACCESS_DENIED`
- `APPOINTMENT_STATUS_FINAL`
- `APPOINTMENT_STATUS_TRANSITION_INVALID`
- `QUEUE_ENTRY_NOT_FOUND`
- `PATIENT_CLINIC_LINK_NOT_FOUND`
- `STATUS_SYNC_CONFLICT`
- `VALIDATION_ERROR`

## Queue

### List Queue By Date

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | GET                                      |
| Path   | `/api/clinics/:clinicId/queue`           |
| Auth   | Required, own active clinic, Admin/Staff |

Query:

- `date` required `YYYY-MM-DD`

Response summary:

```txt
data.queueEntries[]
  queue entry fields
  appointment summary including arrival fields
  doctor summary
  patient summary
  noShowPrediction response or null
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `VALIDATION_ERROR`

### Reorder Queue

| Field  | Value                                    |
| ------ | ---------------------------------------- |
| Method | PATCH                                    |
| Path   | `/api/clinics/:clinicId/queue/reorder`   |
| Auth   | Required, own active clinic, Admin/Staff |

Body:

```txt
date required YYYY-MM-DD
queueEntryIds required non-empty unique array of UUID-shaped ids
```

Response summary:

```txt
data.queueEntries[]
```

Main errors:

- `QUEUE_ENTRY_NOT_FOUND`
- `QUEUE_ENTRY_CLINIC_MISMATCH`
- `QUEUE_ENTRY_FINAL_STATUS`
- `QUEUE_REORDER_INCOMPLETE`
- `QUEUE_REORDER_INVALID_ENTRIES`
- `QUEUE_REORDER_CONFLICT`
- `VALIDATION_ERROR`

Frontend note: this endpoint is exposed through manual queue move controls in `apps/web/src/features/queues/QueuePage.tsx`.

### Update Queue Status

| Field  | Value                                               |
| ------ | --------------------------------------------------- |
| Method | PATCH                                               |
| Path   | `/api/clinics/:clinicId/queue/:queueEntryId/status` |
| Auth   | Required, own active clinic, Admin/Staff            |

Body:

```txt
status: ARRIVED | WAITING | CALLED | COMPLETED | CANCELLED | NO_SHOW
```

Response summary:

```txt
data.queueEntry
```

Queue status changes synchronize the linked appointment status in the same transaction. A booking-created `WAITING` queue entry does not establish arrival by itself; arrival is recorded only when the synchronized appointment status is presence-establishing.

Main errors:

- `QUEUE_ENTRY_NOT_FOUND`
- `QUEUE_ENTRY_CLINIC_MISMATCH`
- `QUEUE_ENTRY_FINAL_STATUS`
- `QUEUE_STATUS_TRANSITION_INVALID`
- `APPOINTMENT_STATUS_TRANSITION_INVALID`
- `PATIENT_CLINIC_LINK_NOT_FOUND`
- `STATUS_SYNC_CONFLICT`
- `VALIDATION_ERROR`

## Dashboard

### Get Dashboard Summary

| Field  | Value                                      |
| ------ | ------------------------------------------ |
| Method | GET                                        |
| Path   | `/api/clinics/:clinicId/dashboard/summary` |
| Auth   | Required, own active clinic, Admin/Staff   |

Query:

- `date` optional `YYYY-MM-DD`; defaults to today's date in clinic timezone

Response summary:

```txt
data.dashboardSummary:
  clinicId, date
  appointmentSummary
  queueSummary
  noShowRiskSummary
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `VALIDATION_ERROR`

### Get High-Risk Appointments

| Field  | Value                                                     |
| ------ | --------------------------------------------------------- |
| Method | GET                                                       |
| Path   | `/api/clinics/:clinicId/dashboard/high-risk-appointments` |
| Auth   | Required, own active clinic, Admin/Staff                  |

Query:

- `date` optional `YYYY-MM-DD`; defaults to today's date in clinic timezone

Response summary:

```txt
data.clinicId
data.date
data.highRiskAppointments[]
```

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`
- `VALIDATION_ERROR`

### Get Today's Activity

| Field  | Value                                             |
| ------ | ------------------------------------------------- |
| Method | GET                                               |
| Path   | `/api/clinics/:clinicId/dashboard/today-activity` |
| Auth   | Required, own active clinic, Admin/Staff          |

Response summary:

```txt
data.clinicId
data.date
data.activityItems[]
```

Activity types:

- `APPOINTMENT_BOOKED`
- `APPOINTMENT_CANCELLED`
- `APPOINTMENT_NO_SHOW`
- `QUEUE_JOINED`
- `PATIENT_CALLED`
- `VISIT_COMPLETED`
- `QUEUE_CANCELLED`
- `QUEUE_NO_SHOW`

Main errors:

- `CLINIC_ACCESS_DENIED`
- `CLINIC_NOT_FOUND`
- `CLINIC_INACTIVE`

## Root Welcome

| Method | Path | Auth | Summary                                   |
| ------ | ---- | ---- | ----------------------------------------- |
| GET    | `/`  | No   | Returns a welcome message outside `/api`. |

Response:

```json
{
    "success": true,
    "message": "Welcome to the Pravaah API"
}
```
