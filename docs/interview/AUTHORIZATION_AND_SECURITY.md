# Authorization And Security

## Core Answer

Clerk proves who is signed in. Pravaah decides what that person can access.

Normal operational APIs require:

```txt
Clerk token
-> internal User exists
-> User.status = ACTIVE
-> role is allowed
-> User.clinicId matches route clinicId
```

## Onboarding State

v0.2 adds one special state:

```txt
Clerk session exists
internal Pravaah User does not exist
clinic access does not exist
allowed only on onboarding-aware endpoints
```

This is not an Admin, Staff, patient, or doctor role.

## Server Authority

The backend controls:

- `clerkUserId`
- internal user ID
- role
- status
- clinic ownership
- active clinic access

The frontend may submit clinic profile data, but it must not choose authority fields.

## Important Protections

- Clinic plus first Admin are created in one transaction.
- Standalone clinic creation is disabled for first-run onboarding.
- Duplicate onboarding requests should replay completed state or return a deliberate conflict.
- Sample data is fake and scoped to the authenticated Admin's clinic.
- Operational APIs keep returning `INTERNAL_USER_NOT_FOUND` for valid Clerk users without internal accounts.

## Honest Limitations

- No patient or doctor login.
- No full multi-clinic membership model.
- No production monitoring/audit-log system yet.
- No Clerk webhook implementation despite an env placeholder.
