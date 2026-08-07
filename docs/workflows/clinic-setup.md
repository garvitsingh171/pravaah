# Clinic Setup

## Workflow Summary

| Field                 | Evidence                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Workflow              | Admin views and edits clinic settings; Admin optionally provisions fictional sample data                                                         |
| Product status        | Implemented                                                                                                                                      |
| Release status        | `IMPLEMENTED_NOT_RELEASED`                                                                                                                       |
| Actor                 | Active internal `ADMIN`                                                                                                                          |
| Entry route           | `/clinic-settings`; sample data panel after onboarding                                                                                           |
| Frontend files        | `apps/web/src/features/clinics/ClinicSettingsPage.tsx`, `apps/web/src/features/clinics/clinicApi.ts`, `apps/web/src/routes/dashboardRoutes.tsx`  |
| Main frontend symbols | `ClinicSettingsPage`, `loadSettings`, `handleChange`, `handleReset`, `handleSubmit`, `getClinicSettings`, `updateClinicSettings`                 |
| API endpoint          | `GET /api/clinics/:clinicId`, `PATCH /api/clinics/:clinicId`, `POST /api/clinics/:clinicId/sample-data`                                          |
| Middleware            | `authenticateRequest`, `validateRequest`, `requireClinicAccess`, `requireAdminRole`                                                              |
| Authentication        | Clerk token plus active internal user required                                                                                                   |
| Authorization         | Backend Admin-only; frontend also hides settings navigation from Staff and blocks the page                                                       |
| Clinic scoping        | `requireClinicAccess` ensures `req.user.clinicId === req.params.clinicId` and active clinic                                                      |
| Validation            | `clinic.validation.ts -> clinicIdParamsSchema`, `updateClinicSchema`, `provisionSampleDataBodySchema`                                            |
| Controller            | `clinic.controller.ts -> getClinicSettingsController`, `updateClinicController`, `provisionSampleDataController`                                 |
| Service               | `clinic.service.ts -> getClinicSettings`, `updateClinic`, `provisionSampleData`                                                                  |
| Repository            | `clinic.repository.ts -> findSettingsById`, `update`, `provisionSampleData`                                                                      |
| Database models       | `Clinic`; sample data also writes `Doctor`, `DoctorClinic`, `Patient`, `PatientClinic`, `Appointment`, `QueueEntry`, `NoShowPrediction`          |
| Prisma operations     | `clinic.findUnique`, `clinic.update`, sample-data transaction writes                                                                             |
| Transaction           | Settings update is one `clinic.update`; sample data uses `prisma.$transaction`                                                                   |
| Concurrency control   | Settings update has no explicit lock. Sample data attempts advisory transaction lock and also counts existing sample records to avoid duplicates |
| State changes         | Settings form state, `Clinic.updatedAt`; optional sample records                                                                                 |
| Errors                | `ADMIN_REQUIRED`, `CLINIC_ACCESS_DENIED`, `CLINIC_NOT_FOUND`, `VALIDATION_ERROR`, `INVALID_CLINIC_TIMEZONE`                                      |
| Tests                 | Clinic repository/service/controller/validation tests; `ClinicSettingsPage` has no dedicated test file in current tree                           |
| Known gaps            | Staff cannot access settings. No clinic logo, multi-clinic switcher, or user invitation workflow                                                 |

## Settings Trace

```text
Admin opens /clinic-settings
    ↓
apps/web/src/routes/dashboardRoutes.tsx -> allowedRoles: [UserRole.ADMIN]
    ↓
ClinicSettingsPage -> useActiveClinic()
    ↓
isAdmin check using activeClinic.currentUser.role
    ↓
loadSettings()
    ↓
apps/web/src/features/clinics/clinicApi.ts -> getClinicSettings(clinicId)
    ↓
GET /api/clinics/:clinicId
    ↓
authenticateRequest
    ↓
validateRequest({ params: clinicIdParamsSchema })
    ↓
requireClinicAccess
    ↓
requireAdminRole
    ↓
clinic.controller.ts -> getClinicSettingsController()
    ↓
clinic.service.ts -> getClinicSettings(clinicId)
    ↓
clinic.repository.ts -> findSettingsById(clinicId)
    ↓
prisma.clinic.findUnique({ select: clinicSettingsSelect })
    ↓
ClinicSettingsPage stores initialValues and values
```

```text
Admin edits settings and submits
    ↓
ClinicSettingsPage -> handleSubmit()
    ↓
validateClinicSettingsForm()
    ↓
buildChangedSettingsPayload(values, initialValues)
    ↓
clinicApi.updateClinicSettings(clinicId, payload)
    ↓
PATCH /api/clinics/:clinicId
    ↓
authenticateRequest -> validateRequest(params, body) -> requireClinicAccess -> requireAdminRole
    ↓
clinic.controller.ts -> updateClinicController()
    ↓
clinic.service.ts -> updateClinic()
    ↓
clinic.repository.ts -> findById()
    ↓
clinic.repository.ts -> update()
    ↓
prisma.clinic.update({ data: updateData, select: clinicSettingsSelect })
    ↓
Frontend updates initialValues, values, success message, and toast
```

## Supported Clinic Fields

The current schema and form support:

- `name`, `slug`
- `phone`, `email`
- `addressLine1`, `addressLine2`, `city`, `state`, `country`, `pincode`
- `timezone`
- `openingTime`, `closingTime`
- `slotDurationMinutes`
- `bufferMinutes`

`isActive` exists in the Prisma `Clinic` model but is not editable in the frontend settings form or `updateClinicSchema`.

## Sample Data Notes

Sample data is documented in [Onboarding And Clinic Provisioning](onboarding-and-clinic-provisioning.md#sample-data-trace). The operational endpoint is Admin-only and clinic-scoped. It creates fictional records in one transaction and returns `CREATED` or `ALREADY_PROVISIONED`.

## How To Explain This Workflow

Clinic settings are not a cosmetic client-only screen. The page loads the active user's clinic from the backend, allows only Admin users to edit operational settings, validates changed fields on the frontend and backend, and persists the supported `Clinic` fields through Prisma.
