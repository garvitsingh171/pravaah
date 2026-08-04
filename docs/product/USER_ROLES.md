# User Roles

Current product authority: [Product Requirements](../PRD.md). Technical authorization authority: [High-Level Design](../HLD.md) and backend auth/access services. This file is the role-policy summary and must not claim patient or doctor authentication.

## Current Role Model

Pravaah MVP has two authenticated clinic-side roles:

- Admin
- Staff

Patients and doctors are records only. They do not sign in, have sessions, or call protected APIs as users during the MVP.

v0.2 adds an authenticated-but-unprovisioned onboarding state, but that state is not a new Pravaah role. Before successful onboarding, the Clerk identity has no internal role and no clinic access.

## Role Summary

| Role                            | Signs in? | Stored where?              | Current purpose                                                                                     |
| ------------------------------- | --------- | -------------------------- | --------------------------------------------------------------------------------------------------- |
| Admin                           | Yes       | `User.role = ADMIN`        | Clinic owner/manager/operator with access to Admin-only backend actions and daily clinic workflows. |
| Staff                           | Yes       | `User.role = STAFF`        | Reception/operations user for doctor, patient, appointment, queue, and dashboard workflows.         |
| Authenticated but unprovisioned | Yes       | Clerk only, no `User` yet  | Temporary onboarding state only; no internal role and no clinic access.                             |
| Patient record                  | No        | `Patient`, `PatientClinic` | Person receiving care; used in appointments, queue, and no-show scoring.                            |
| Doctor record                   | No        | `Doctor`, `DoctorClinic`   | Provider assigned to appointments and queue entries.                                                |

## Permission Table

| Capability                                  | Admin                              | Staff | Patient record | Doctor record |
| ------------------------------------------- | ---------------------------------- | ----- | -------------- | ------------- |
| Sign in to web app                          | Yes                                | Yes   | No             | No            |
| Fetch current internal user profile         | Yes                                | Yes   | No             | No            |
| Create clinic through onboarding            | First active provisioned user only | No    | No             | No            |
| Create standalone clinic                    | Disabled                           | No    | No             | No            |
| View/update clinic settings                 | Yes, for own active clinic         | No    | No             | No            |
| Create/list/update doctors through backend  | Yes                                | Yes   | No             | No            |
| Use doctor create/list UI                   | Yes                                | Yes   | No             | No            |
| Use doctor edit UI                          | Yes                                | Yes   | No             | No            |
| Create/list/update patients through backend | Yes                                | Yes   | No             | No            |
| Use patient create/list UI                  | Yes                                | Yes   | No             | No            |
| Use patient edit UI                         | Yes                                | Yes   | No             | No            |
| Book appointments                           | Yes                                | Yes   | No             | No            |
| List/filter appointments                    | Yes                                | Yes   | No             | No            |
| Update appointment status                   | Yes                                | Yes   | No             | No            |
| List today's queue                          | Yes                                | Yes   | No             | No            |
| Update queue status                         | Yes                                | Yes   | No             | No            |
| Reorder queue through backend API           | Yes                                | Yes   | No             | No            |
| Reorder queue through frontend UI           | Yes                                | Yes   | No             | No            |
| View dashboard                              | Yes                                | Yes   | No             | No            |
| View starter no-show risk                   | Yes                                | Yes   | No             | No            |

Authenticated-but-unprovisioned identities may call only explicitly onboarding-aware endpoints. They cannot access operational clinic, doctor, patient, appointment, queue, dashboard, or prediction APIs.

## Backend Authorization Rules

Protected APIs follow this flow:

```txt
Clerk Bearer token
  -> authenticateRequest
  -> getAuth(req)
  -> authService.getActiveUserByClerkUserId
  -> req.user
  -> role and clinic access middleware or service checks
```

Current checks:

| Check                          | Enforced by                                                  |
| ------------------------------ | ------------------------------------------------------------ |
| Authorization header exists    | `authenticateRequest`                                        |
| Header is Bearer-shaped        | `authenticateRequest`                                        |
| Clerk session is authenticated | `getAuth(req)` inside `authenticateRequest`                  |
| Internal `User` exists         | `authService.getActiveUserByClerkUserId`                     |
| Internal user is ACTIVE        | `authService`, `accessService`                               |
| Admin-only routes              | `requireAdminRole`                                           |
| Admin/Staff routes             | `requireClinicStaffRole`                                     |
| Clinic-scoped route access     | `requireClinicAccess` and `accessService.verifyClinicAccess` |
| Appointment status access      | `accessService.verifyAppointmentClinicAccess`                |

## Clerk Identity Vs Internal Authorization

Clerk identity:

- proves a person is signed in
- provides the external Clerk user ID
- powers the frontend sign-in component and session token

Internal Pravaah `User` authorization:

- maps `clerkUserId` to an app user
- stores role: `ADMIN` or `STAFF`
- stores status: `INVITED`, `ACTIVE`, or `SUSPENDED`
- stores MVP clinic access through `clinicId`

Clerk alone is not enough. A signed-in Clerk user without an ACTIVE internal Pravaah `User` receives `INTERNAL_USER_NOT_FOUND` or `USER_NOT_ACTIVE` from normal protected APIs.

In v0.2, a signed-in Clerk user without an internal `User` is allowed only on explicit onboarding-aware endpoints. This is an onboarding state, not a role.

## v0.2 First Admin Provisioning

After successful self-service clinic onboarding, the backend creates the first clinic user with:

| Field         | Backend-controlled value                             |
| ------------- | ---------------------------------------------------- |
| `role`        | `ADMIN`                                              |
| `status`      | `ACTIVE`                                             |
| `clinicId`    | newly created clinic                                 |
| `clerkUserId` | trusted Clerk identity from server-side auth context |

The frontend must not choose role, status, clinic ownership, user ID, or another clinic's ID. Those values are assigned by backend-controlled logic inside the transactional onboarding flow.

Staff remains an internal operational role. v0.2 does not add patient login, doctor login, patient portal, or doctor portal.

## Current Clinic Access Model

The MVP uses a simple model:

```txt
User.clinicId must exactly equal the route clinicId
```

`accessService.verifyClinicAccess` also verifies that the clinic exists and is active.

This is not full multi-clinic SaaS membership. Future multi-clinic support should add a membership table such as `ClinicMember` or `UserClinic`.

## Current Limitations

- No user management UI exists for inviting or editing Staff users.
- `User.clinicId` supports one active clinic context per internal user.
- Staff currently has broad clinic-staff access for doctor/patient/appointment/queue/dashboard APIs.
- Clinic settings can be reviewed and updated by Admins through the current UI.
- Doctor and patient edit workflows are available to Admin and Staff users with clinic access.
- Queue reorder controls are available to Admin and Staff users with clinic access.
- Patient and doctor records cannot log in.

## Future Role Expansion

Post-MVP roles may include:

- Clinic Manager
- Receptionist
- Doctor user
- Patient portal user
- Billing staff
- Organization owner
- Support/admin user

Future permissions should be introduced through a clear schema and backend authorization change, not frontend-only route hiding.
