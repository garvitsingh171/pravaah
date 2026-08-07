# Doctor Management

## Workflow Summary

| Field                 | Evidence                                                                                                                                                        |
| --------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Workflow              | List, create, edit, activate, and deactivate doctor records                                                                                                     |
| Product status        | Implemented                                                                                                                                                     |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                                      |
| Actor                 | Active internal `ADMIN` or `STAFF`                                                                                                                              |
| Entry route           | `/doctors`, `/doctors/new`; doctor selector in `/appointments`                                                                                                  |
| Frontend files        | `apps/web/src/features/doctors/DoctorsPage.tsx`, `DoctorCreatePage.tsx`, `DoctorForm.tsx`, `doctorApi.ts`                                                       |
| Main frontend symbols | `DoctorsPage`, `loadDoctors`, `DoctorEditPanel`, `handleStatusActionConfirm`, `DoctorCreatePage`, `handleSubmit`, `listDoctors`, `createDoctor`, `updateDoctor` |
| API endpoint          | `GET /api/clinics/:clinicId/doctors`, `POST /api/clinics/:clinicId/doctors`, `PATCH /api/clinics/:clinicId/doctors/:doctorId`                                   |
| Middleware            | `authenticateRequest`, `validateRequest`, `requireClinicAccess`, `requireClinicStaffRole`                                                                       |
| Authentication        | Clerk token plus active internal user required                                                                                                                  |
| Authorization         | Admin and Staff both allowed                                                                                                                                    |
| Clinic scoping        | Clinic route param checked by `requireClinicAccess`; service checks `DoctorClinic` link for update                                                              |
| Validation            | `doctor.validation.ts -> createDoctorSchema`, `updateDoctorSchema`, `clinicIdParamsSchema`, `doctorClinicParamsSchema`                                          |
| Controller            | `doctor.controller.ts -> createDoctorController`, `listDoctorsByClinicController`, `updateDoctorController`                                                     |
| Service               | `doctor.service.ts -> createDoctor`, `listDoctorsByClinic`, `updateDoctor`                                                                                      |
| Repository            | `doctor.repository.ts -> createDoctorWithClinicLink`, `findDoctorLinksByClinicId`, `updateDoctor`                                                               |
| Database models       | `Doctor`, `DoctorClinic`, `Clinic`, plus appointment/queue references elsewhere                                                                                 |
| Prisma operations     | `clinic.findUnique`, `doctor.create`, `doctorClinic.create`, `doctorClinic.findMany`, `doctor.update`                                                           |
| Transaction           | Create wraps `Doctor` and `DoctorClinic` writes in one `prisma.$transaction`                                                                                    |
| Concurrency control   | No explicit duplicate doctor lock. `DoctorClinic` has `@@unique([doctorId, clinicId])`, but create always creates a new `Doctor`                                |
| State changes         | Doctor row and clinic link; frontend refetches list after edit/status changes                                                                                   |
| Errors                | `CLINIC_NOT_FOUND`, `DOCTOR_NOT_FOUND`, `DOCTOR_NOT_LINKED_TO_CLINIC`, `VALIDATION_ERROR`                                                                       |
| Tests                 | `doctor.validation.test.ts`, `DoctorsPage.test.tsx`                                                                                                             |
| Known gaps            | No doctor login. `DoctorClinic` has `displayName` and `consultationFee` fields, but normal doctor UI/API does not edit them                                     |

## Create Doctor Trace

```text
User opens /doctors/new
    ↓
DoctorCreatePage -> DoctorForm
    ↓
DoctorForm -> handleSubmit(event) -> props.onSubmit()
    ↓
DoctorCreatePage -> handleSubmit()
    ↓
validateDoctorForm()
    ↓
toCreateDoctorRequest()
    ↓
doctorApi.createDoctor(clinicId, payload)
    ↓
POST /api/clinics/:clinicId/doctors
    ↓
authenticateRequest -> validateRequest(params, body)
    ↓
requireClinicAccess -> requireClinicStaffRole
    ↓
doctor.controller.ts -> createDoctorController()
    ↓
doctor.service.ts -> createDoctor()
    ↓
doctor.repository.ts -> findClinicById()
    ↓
doctor.repository.ts -> createDoctorWithClinicLink()
    ↓
prisma.$transaction
    ↓
tx.doctor.create(...)
    ↓
tx.doctorClinic.create({ doctorId, clinicId, isActive: true })
    ↓
201 { doctor }
    ↓
DoctorCreatePage navigates to /doctors with statusMessage
```

## List And Edit Trace

```text
/doctors
    ↓
DoctorsPage -> loadDoctors()
    ↓
doctorApi.listDoctors(clinicId)
    ↓
GET /api/clinics/:clinicId/doctors
    ↓
doctor.service.ts -> listDoctorsByClinic()
    ↓
doctor.repository.ts -> findDoctorLinksByClinicId()
    ↓
prisma.doctorClinic.findMany({ where: { clinicId }, select: { doctor } })
    ↓
service maps doctorClinicId and clinicLinkIsActive into doctor summaries
```

```text
User edits doctor or toggles status
    ↓
DoctorsPage -> DoctorEditPanel.handleSubmit()
or DoctorsPage -> handleStatusActionConfirm()
    ↓
doctorApi.updateDoctor(clinicId, doctor.id, payload)
    ↓
PATCH /api/clinics/:clinicId/doctors/:doctorId
    ↓
doctor.service.ts -> updateDoctor()
    ↓
find clinic, find doctor, find DoctorClinic link
    ↓
doctor.repository.ts -> updateDoctor()
    ↓
prisma.doctor.update({ where: { id: doctorId } })
    ↓
DoctorsPage refreshes list via loadDoctors()
```

## DoctorClinic Relationship

`DoctorClinic` links a doctor record to a clinic. Current code uses it for clinic-scoped listing, appointment eligibility, and future-ready schema separation. In current product behavior, doctor creation always creates a brand-new `Doctor` and one active link. Multi-clinic doctor sharing is not exposed by UI/API.

## How To Explain This Workflow

Doctor records are clinic-operational data, not authenticated doctor accounts. Creating a doctor atomically creates the doctor and its clinic link. Updating a doctor first proves the doctor is linked to the active clinic, then updates the doctor row.
