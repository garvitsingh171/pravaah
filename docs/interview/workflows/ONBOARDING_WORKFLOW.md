# Onboarding Workflow

## Purpose

Let a new external visitor become the first Admin of a new clinic without owner database intervention.

## Flow

```txt
Public landing
-> Clerk sign-up
-> GET /api/auth/onboarding-status
-> NOT_STARTED
-> POST /api/auth/onboarding/clinic
-> Clinic + ADMIN User transaction
-> optional POST /api/clinics/:clinicId/sample-data
-> dashboard
```

## Security Boundary

Only onboarding-aware endpoints accept a valid Clerk identity without an internal `User`. Protected clinic APIs still require an active internal user.

## Failure Handling

- Duplicate slug returns a deliberate slug conflict.
- Completed retry returns completed onboarding state.
- Inconsistent existing account returns recovery.
- Failed clinic/Admin creation should roll back together.

## Demo Check

Use a fresh Clerk test user, create a fictional clinic, and confirm the dashboard opens only after onboarding completes.
