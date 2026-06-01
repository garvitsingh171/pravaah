<!--
Pravaah documentation package
Generated for Project Pravaah on June 1, 2026.
Locked stack: React + TypeScript, Express + TypeScript, Clerk, Neon PostgreSQL, Prisma.
-->

# Pravaah User Roles

## 1. Purpose

This document defines who can use Pravaah and what each role is allowed to do in the MVP.

It also explains how roles should be handled in the backend so the system does not depend on unsafe frontend-only checks.

## 2. MVP role model

The MVP has only clinic-side authenticated users:

- Admin
- Staff

Patients and doctors exist as records, but they do not sign in during the MVP.

## 3. Role summary

| Role    | Signs in? | MVP status  | Main responsibility                                                                          |
| ------- | --------- | ----------- | -------------------------------------------------------------------------------------------- |
| Admin   | Yes       | Included    | Manage clinic settings, users, doctors, patients, appointments, and queue.                   |
| Staff   | Yes       | Included    | Handle daily reception workflow, appointment booking, patient updates, and queue operations. |
| Patient | No        | Record only | Can be scheduled into appointments but cannot use the app directly.                          |
| Doctor  | No        | Record only | Can be assigned appointments but cannot use the app directly.                                |

## 4. Admin role

The Admin is the clinic owner, manager, or main operational owner.

### Admin Capabilities

- sign in to the clinic app
- manage clinic profile
- manage staff access
- create and update doctor profiles
- link doctors to clinic
- create and update patient profiles
- link patients to clinic
- book appointments
- update appointments
- cancel appointments
- view and manage live queue
- view basic dashboard
- view starter no-show risk
- make final operational decisions

### Admin Non-Requirements In MVP

- billing management
- inventory management
- prescription management
- full analytics suite
- multi-branch SaaS controls

## 5. Staff role

The Staff role is for reception or clinic operations users.

### Staff Capabilities

- sign in to the clinic app
- add and edit patients
- add and edit doctors if Admin allows in MVP
- book appointments
- update appointment status
- view today's appointments
- view and manage live queue
- view starter no-show risk
- mark patient arrived, called, completed, cancelled, or no-show

### Staff Restrictions

- manage clinic profile
- manage staff users
- change high-level clinic settings
- delete critical records
- change role permissions

## 6. Patient in MVP

Patients do not authenticate into the app during MVP.

A patient can:

- exist as a database record
- be linked to a clinic through `PatientClinic`
- be scheduled into appointments
- have clinic-specific history tracked
- be included in no-show risk calculation

A patient cannot:

- sign in
- edit their profile
- book appointments themselves
- cancel appointments themselves
- view queue from their own portal
- receive automated WhatsApp/SMS reminders in MVP

## 7. Doctor in MVP

Doctors do not authenticate into the app during MVP.

A doctor can:

- exist as a database record
- be linked to a clinic through `DoctorClinic`
- be assigned appointments
- appear in queue filters and appointment screens

A doctor cannot:

- sign in
- manage their own schedule
- update appointment status directly
- manage patients directly

## 8. Permissions matrix

| Capability                  | Admin | Staff | Patient | Doctor |
| --------------------------- | ----: | ----: | ------: | -----: |
| Sign in to clinic app       |   Yes |   Yes |      No |     No |
| Manage clinic profile       |   Yes |    No |      No |     No |
| Manage staff users          |   Yes |    No |      No |     No |
| Add doctor profile          |   Yes | Yes\* |      No |     No |
| Edit doctor profile         |   Yes | Yes\* |      No |     No |
| Link doctor to clinic       |   Yes | Yes\* |      No |     No |
| Add patient profile         |   Yes |   Yes |      No |     No |
| Edit patient profile        |   Yes |   Yes |      No |     No |
| Link patient to clinic      |   Yes |   Yes |      No |     No |
| Book appointment            |   Yes |   Yes |      No |     No |
| Update appointment status   |   Yes |   Yes |      No |     No |
| Cancel appointment          |   Yes |   Yes |      No |     No |
| Mark no-show                |   Yes |   Yes |      No |     No |
| View live queue             |   Yes |   Yes |      No |     No |
| Update queue status         |   Yes |   Yes |      No |     No |
| View no-show risk           |   Yes |   Yes |      No |     No |
| Override system suggestions |   Yes |   Yes |      No |     No |
| Access patient portal       |    No |    No |      No |     No |

`Yes*` means this can be allowed in MVP for simplicity, but the product can restrict it later if clinic workflows require stricter control.

## 9. Human decision rule

Pravaah assists staff. It does not replace staff.

The system can show:

- high no-show risk
- queue status
- appointment conflict
- operational warning

But final decisions remain with Admin or Staff.

MVP must not automatically cancel appointments or reorder the queue without human control.

## 10. Backend authorization rules

Frontend route protection is useful, but it is not enough.

The backend must verify:

1. Is the user authenticated through Clerk?
2. Does this Clerk user exist in the internal User table?
3. Is the user active?
4. What role does the user have?
5. Is the user allowed to access this clinic?
6. Is the requested action allowed for this role?

## 11. Example authorization decisions

### 11.1 Manage clinic profile

Allowed:

- Admin

Denied:

- Staff
- unauthenticated users

### 11.2 Book appointment

Allowed:

- Admin
- Staff

Required backend checks:

- user belongs to clinic context
- doctor belongs to clinic through DoctorClinic
- patient belongs to clinic through PatientClinic
- appointment slot is valid

### 11.3 Update queue status

Allowed:

- Admin
- Staff

Required backend checks:

- queue entry belongs to user's clinic context
- status transition is valid

## 12. Role storage strategy

For MVP, user role can be stored in the internal database.

Example:

```txt
User
- id
- clerkUserId
- fullName
- email
- role: ADMIN | STAFF
- status: ACTIVE | INVITED | SUSPENDED
```

Clerk handles identity.

Pravaah database handles app role and clinic permissions.

## 13. Future role expansion

Post-MVP roles may include:

- Doctor
- Receptionist
- Clinic Manager
- Super Admin
- Patient Portal User
- Billing Staff
- Support Staff

Do not build these in MVP.

## 14. Future permission expansion

Post-MVP may require a more advanced permission system:

```txt
User
Clinic
ClinicMember / UserClinic
Role
Permission
```

This can support:

- one user managing multiple clinics
- different roles in different clinics
- custom staff permissions
- organization-level owners

For MVP, keep this simple.

## 15. Security notes

- Do not trust role values from frontend.
- Do not expose Clerk secrets.
- Do not allow staff to access another clinic's data.
- Do not use patient ID alone without clinic scoping.
- Do not allow unauthenticated queue or appointment access.
- Log critical operations later through audit logs.

## 16. Final role principle

Keep MVP roles simple:

```txt
Admin = controls clinic setup and operations.
Staff = manages daily clinic flow.
Patient/Doctor = records only, no login.
```

Expand only after the clinic-side workflow is working.
