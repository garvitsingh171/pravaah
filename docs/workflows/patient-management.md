# Patient Management

## Workflow Summary

| Field                 | Evidence                                                                                                                                                               |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | List, search, create, edit, activate, and deactivate patient records                                                                                                   |
| Product status        | Implemented                                                                                                                                                            |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                             |
| Actor                 | Active internal `ADMIN` or `STAFF`                                                                                                                                     |
| Entry route           | `/patients`, `/patients/new`; patient selector in `/appointments`                                                                                                      |
| Frontend files        | `apps/web/src/features/patients/PatientsPage.tsx`, `PatientCreatePage.tsx`, `PatientForm.tsx`, `patientApi.ts`                                                         |
| Main frontend symbols | `PatientsPage`, `loadPatients`, `PatientEditPanel`, `handleStatusActionConfirm`, `PatientCreatePage`, `handleSubmit`, `listPatients`, `createPatient`, `updatePatient` |
| API endpoint          | `GET /api/clinics/:clinicId/patients`, `POST /api/clinics/:clinicId/patients`, `PATCH /api/clinics/:clinicId/patients/:patientId`                                      |
| Middleware            | `authenticateRequest`, `validateRequest`, `requireClinicAccess`, `requireClinicStaffRole`                                                                              |
| Authentication        | Clerk token plus active internal user required                                                                                                                         |
| Authorization         | Admin and Staff both allowed                                                                                                                                           |
| Clinic scoping        | Clinic route param checked by `requireClinicAccess`; service checks `PatientClinic` link for update                                                                    |
| Validation            | `patient.validation.ts -> createPatientSchema`, `updatePatientSchema`, `listPatientsQuerySchema`                                                                       |
| Controller            | `patient.controller.ts -> createPatientController`, `listPatientsByClinicController`, `updatePatientController`                                                        |
| Service               | `patient.service.ts -> createPatient`, `listPatientsByClinic`, `updatePatient`                                                                                         |
| Repository            | `patient.repository.ts -> createPatientWithClinicLink`, `listPatientsByClinic`, `updatePatientWithClinicDetails`                                                       |
| Database models       | `Patient`, `PatientClinic`, `Clinic`, plus appointment/queue/prediction references elsewhere                                                                           |
| Prisma operations     | `patient.create`, `patientClinic.create`, `patientClinic.findMany`, `patient.update`, `patientClinic.update`                                                           |
| Transaction           | Create wraps `Patient` and `PatientClinic` writes. Update wraps patient and clinic-specific details                                                                    |
| Concurrency control   | No explicit duplicate patient lock; `PatientClinic` has `@@unique([patientId, clinicId])`, but create always creates a new `Patient`                                   |
| State changes         | Patient row, clinic-specific notes/distance/history link; frontend refetches after edit/status changes                                                                 |
| Errors                | `CLINIC_NOT_FOUND`, `PATIENT_NOT_FOUND`, `PATIENT_NOT_LINKED_TO_CLINIC`, `VALIDATION_ERROR`                                                                            |
| Tests                 | `PatientsPage.test.tsx`, `patient.validation.test.ts`, `patient.statistics.repository.test.ts`                                                                         |
| Known gaps            | No patient login or manual reconciliation workflow                                                                                                                     |

## Create Patient Trace

```text
User opens /patients/new
    ↓
PatientCreatePage -> PatientForm
    ↓
PatientForm -> handleSubmit(event) -> props.onSubmit()
    ↓
PatientCreatePage -> handleSubmit()
    ↓
validatePatientForm()
    ↓
toCreatePatientRequest()
    ↓
patientApi.createPatient(clinicId, payload)
    ↓
POST /api/clinics/:clinicId/patients
    ↓
authenticateRequest -> validateRequest(params, body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
patient.controller.ts -> createPatientController()
    ↓
patient.service.ts -> createPatient()
    ↓
patient.repository.ts -> findClinicById()
    ↓
patient.repository.ts -> createPatientWithClinicLink()
    ↓
prisma.$transaction
    ↓
tx.patient.create(...)
    ↓
tx.patientClinic.create({ patientId, clinicId, notes, distanceFromClinicKm })
    ↓
201 { patient }
    ↓
PatientCreatePage navigates to /patients with statusMessage
```

## List, Search, Edit Trace

```text
/patients
    ↓
PatientsPage -> loadPatients()
    ↓
patientApi.listPatients(clinicId, { search, isActive })
    ↓
GET /api/clinics/:clinicId/patients?search=...&isActive=...
    ↓
validateRequest({ params, query: listPatientsQuerySchema })
    ↓
patient.service.ts -> listPatientsByClinic()
    ↓
patient.repository.ts -> listPatientsByClinic()
    ↓
prisma.patientClinic.findMany({ where: { clinicId, patient: patientWhere }, include: { patient: true } })
    ↓
patientApi.toPatientSummary() flattens PatientClinic history into frontend summaries
```

```text
User edits patient or toggles status
    ↓
PatientsPage -> PatientEditPanel.handleSubmit()
or PatientsPage -> handleStatusActionConfirm()
    ↓
patientApi.updatePatient(clinicId, patient.id, payload)
    ↓
PATCH /api/clinics/:clinicId/patients/:patientId
    ↓
patient.service.ts -> updatePatient()
    ↓
find clinic, find patient, find PatientClinic link
    ↓
patient.repository.ts -> updatePatientWithClinicDetails()
    ↓
prisma.$transaction
    ↓
tx.patient.update(...) when patient fields changed
    ↓
tx.patientClinic.update(...) when notes or distance changed
    ↓
tx.patient.findUnique({ include: { patientClinics: { where: { clinicId } } } })
    ↓
PatientsPage refreshes list via loadPatients()
```

## PatientClinic Relationship

`PatientClinic` stores clinic-specific patient data:

- `totalAppointments`
- `totalCompletedVisits`
- `totalNoShows`
- `totalLateArrivals`
- `lastVisitAt`
- `notes`
- `distanceFromClinicKm`
- `isActive`

Operational meanings are deliberately non-overlapping: `totalAppointments` counts successful bookings, `totalCompletedVisits` counts first transitions to `COMPLETED`, `totalNoShows` counts first transitions to `NO_SHOW`, `totalLateArrivals` counts late first arrivals, and `lastVisitAt` is the latest completion event time. Booking and lifecycle transactions maintain these aggregates atomically for the matching `(patientId, clinicId)` link. Normal patient create/update requests remain strict and do not accept any operational statistic as editable metadata.

The no-show risk workflow still reads `totalLateArrivals` and `distanceFromClinicKm` from `PatientClinic`, while completed/no-show inputs continue to be counted from `Appointment`. The statistics feature does not change prediction sources, weights, thresholds, or stored predictions.

## Privacy Boundary

Patients are records used by clinic-side Admin/Staff users. They are not authenticated users. The API returns only fields selected by each repository/API type; no patient portal or cross-clinic patient access exists in current implementation.

## How To Explain This Workflow

Patient records are split into a shared `Patient` row and a clinic-specific `PatientClinic` row. That lets the product store clinic-local notes and event-maintained attendance history separately from the base person record. The UI displays bookings, completed visits, no-shows, late arrivals, and last completed visit without exposing manual counter controls.

`AppointmentActivity` does not replace these aggregates. Timeline rows answer what happened to one appointment and who performed the action; `PatientClinic` remains the efficient clinic-scoped source for appointment, completion, no-show, late-arrival, and last-visit statistics. Patient APIs never derive these counters by scanning timeline rows, and activity insertion does not change prediction inputs or recalculation behavior.

Structured cancellation/no-show reasons do not change patient attendance aggregates. Cancellation still changes no counters. Only the first guarded transition to `NO_SHOW` increments `totalNoShows`, regardless of which no-show reason was selected; retries and reason metadata never create another attendance event. Reasons are raw appointment outcome facts and are not converted into responsibility or reliability scores.
