# Pravaah v0.2 Scope

## Release Summary

| Field                   | Value                                             |
| ----------------------- | ------------------------------------------------- |
| Release name            | Public Demo and Self-Service Clinic Onboarding    |
| Version                 | `v0.2.0`                                          |
| Status                  | Release candidate; verification pending           |
| Previous stable release | `v0.1.0` - MVP complete, deployed, and frozen     |
| Source basis            | `docs/scope/PRAVAAH_V0_2_SCOPE_AND_TRANSITION.md` |

`v0.2.0` turns the completed MVP from an owner-provisioned demo into a safe self-service product demonstration. The source tree contains the implementation paths for public entry, Clerk sign-up, transactional clinic bootstrap, isolated sample data, onboarding-aware routing, settings, tests, workflow completion, and release documentation. The release remains a candidate until the owner completes tests, builds, deployment checks, and screenshot capture.

The release theme is:

```txt
Public Demo and Self-Service Clinic Onboarding
```

## Purpose

Pravaah v0.1 proved the core clinic workflow:

```txt
Auth -> Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter no-show risk scoring
```

v0.2 must prove that a new external user can enter that workflow safely without project-owner intervention:

```txt
Public visitor
  -> Clerk identity
  -> Safe unprovisioned state
  -> Transactional clinic ownership
  -> Isolated workspace
  -> Existing Pravaah operational spine
```

## Current Product Problem

The deployed MVP assumes that a signed-in Clerk user already has:

- an internal Pravaah `User` record
- `User.status = ACTIVE`
- a valid `User.clinicId`
- an internal role such as `ADMIN` or `STAFF`

That works for manually provisioned demo accounts, but it blocks a newly signed-up external visitor. A valid Clerk identity may exist while the Pravaah backend correctly returns `INTERNAL_USER_NOT_FOUND` for normal operational APIs.

The current clinic creation path also cannot safely bootstrap a first user through ordinary clinic APIs because those APIs require an already authorized internal Admin. Creating only a `Clinic` record would risk an orphan clinic with no owning Admin.

v0.2 solves this by separating:

```txt
Clerk identity = Who is signed in?
Internal Pravaah user = What role and clinic access does this person have?
Onboarding state = Has this identity been provisioned into Pravaah?
```

## Goals

Primary goal:

- Allow a new external visitor to sign up, create an isolated clinic workspace, become that clinic's Admin, and reach the existing Pravaah workflow without manual database seeding.

Supporting goals:

- Preserve all v0.1 operational behavior.
- Add a useful unauthenticated public entry point.
- Keep Clerk responsible only for identity.
- Keep roles, status, and clinic access in the Pravaah database.
- Treat authenticated-but-unprovisioned users as a valid onboarding state only where explicitly allowed.
- Create the clinic and first Admin in one retry-safe Prisma transaction.
- Prevent orphan clinics and duplicate user/clinic records.
- Provision optional fake sample data only inside the new clinic.
- Build onboarding-aware routing and a first-run experience.
- Include clinic settings, doctor edit, patient edit, and queue reorder controls in the release candidate.
- Add backend, frontend, and end-to-end tests around the new security-sensitive paths.

## Complete Issue Scope

| Order | Issue                                               | Outcome                                                                                           |
| ----- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| 1     | Freeze MVP and initialize v0.2                      | Preserve the deployed MVP as `v0.1.0` and establish `v0.2.0` release governance.                  |
| 2     | Define v0.2 scope in documentation                  | Publish this source-of-truth scope, boundaries, non-goals, dependencies, and acceptance criteria. |
| 3     | Add public landing page and public routes           | Make the deployed URL useful before authentication.                                               |
| 4     | Enable Clerk sign-up flow                           | Permit external users to create a Clerk identity through supported Clerk UI and routes.           |
| 5     | Separate Clerk identity from internal authorization | Stop treating every valid Clerk identity as if it must already have an internal user.             |
| 6     | Add onboarding status API                           | Return the authenticated identity's provisioning state and next required action.                  |
| 7     | Create clinic and Admin transactionally             | Bootstrap the clinic and first active Admin as one atomic operation.                              |
| 8     | Prevent orphan clinic creation                      | Make retries, failures, and duplicate requests incapable of leaving an unowned clinic.            |
| 9     | Build first-time clinic onboarding UI               | Collect clinic details and drive the bootstrap API with clear feedback.                           |
| 10    | Provision isolated sample clinic data               | Give a new clinic optional fake demo data scoped only to its own clinic.                          |
| 11    | Add onboarding-aware application routing            | Route signed-out, unprovisioned, active Admin, and active Staff states correctly.                 |
| 12    | Build functional clinic settings page               | Allow authorized Admins to review and update operational clinic settings.                         |
| 13    | Add first-run setup checklist                       | Guide a new Admin through clinic settings, doctors, patients, appointments, and queue setup.      |
| 14    | Harden public onboarding APIs                       | Add validation, abuse protection, safe errors, logging discipline, and strict server authority.   |
| 15    | Add backend onboarding tests                        | Cover status, provisioning, rollback, idempotency, authorization, and isolation.                  |
| 16    | Add frontend and end-to-end onboarding tests        | Cover the visitor-to-dashboard journey and important failure/retry states.                        |
| 17    | Publish v0.2 documentation and demo assets          | Update README, setup docs, screenshots, demo instructions, limitations, and release notes.        |
| 18    | Add doctor edit workflow                            | Complete doctor management without adding doctor authentication.                                  |
| 19    | Add patient edit workflow                           | Complete patient management without adding patient authentication.                                |
| 20    | Add queue reorder controls                          | Expose the existing human-controlled queue ordering capability safely in the UI.                  |

## Implementation Order And Dependencies

```txt
Release freeze and scope
    1 -> 2

Public entry
    3 -> 4

Authentication architecture
    5 -> 6

Provisioning integrity
    7 -> 8 -> 14

First-run frontend
    9 -> 11 -> 13
          \ 10
          \ 12

Verification
    15 -> 16

Workflow completion
    18, 19, 20

Release publication
    17
```

Dependency rules:

- Do not build the onboarding form before the onboarding API contract is stable.
- Do not allow clinic bootstrap through the normal authorized clinic endpoint.
- Do not provision sample data before clinic ownership is committed successfully.
- Do not mark v0.2 ready until v0.1 clinic workflows still pass regression testing.
- Doctor editing, patient editing, and queue reordering may run in parallel after the authorization architecture is stable.

## Route Boundaries

Frontend route groups should be explicit:

| Route group                  | Authentication                                          | Purpose                                                          |
| ---------------------------- | ------------------------------------------------------- | ---------------------------------------------------------------- |
| Public routes                | No Clerk session required                               | Landing, sign-in, sign-up, and other public product pages.       |
| Onboarding routes            | Clerk session required; internal user may be missing    | Clinic creation, sample data choice, and setup flow.             |
| Protected application routes | Clerk session and active internal Pravaah user required | Dashboard, doctors, patients, appointments, queue, and settings. |

Recommended route shape:

```txt
Public routes
/
/sign-in
/sign-up
/about or /features only if included in landing scope

Onboarding routes
/onboarding
/onboarding/clinic

Protected application routes
/app or existing dashboard route
/doctors
/patients
/appointments
/queue
/settings
```

Routing must be based on resolved application state, not only Clerk's `isSignedIn` value.

## Clerk Identity Vs Pravaah Authorization

Clerk answers:

```txt
Who is signed in?
```

Pravaah answers:

```txt
Is this signed-in person an ACTIVE internal User, what role do they have, and which clinic can they access?
```

Rules:

- Clerk metadata or frontend state must not replace backend authorization.
- A valid Clerk identity does not automatically receive an internal role.
- Frontend-provided role, status, clinic ID, user ID, or ownership values must not be trusted.
- Normal operational APIs must keep requiring an active internal `User` and clinic access.
- Only explicitly onboarding-aware endpoints may accept a valid Clerk identity without an internal `User`.

## Authenticated But Unprovisioned State

`v0.2` introduces this valid application state:

```txt
Clerk session exists
Internal Pravaah User does not exist yet
Clinic access does not exist yet
Expected destination: onboarding
```

This state is not a Pravaah role. It has no operational clinic permissions.

| State                                 | Clerk session | Internal user                 | Clinic             | Destination                                        |
| ------------------------------------- | ------------- | ----------------------------- | ------------------ | -------------------------------------------------- |
| Signed out                            | No            | Unknown                       | Unknown            | Public landing or auth pages                       |
| Authenticated, unprovisioned          | Yes           | No                            | No                 | Clinic onboarding                                  |
| Authenticated, invalid internal state | Yes           | Missing/inactive/inconsistent | Missing or invalid | Recovery/error state; never operational app access |
| Active Admin                          | Yes           | `ACTIVE ADMIN`                | Assigned           | Dashboard/application                              |
| Active Staff                          | Yes           | `ACTIVE STAFF`                | Assigned           | Dashboard/application with role restrictions       |

## Onboarding Status API Expectations

The onboarding status endpoint should answer:

- Is the Clerk identity valid?
- Does an internal user exist?
- Is the internal user active?
- Is a clinic assigned?
- Is onboarding complete?
- What should the frontend do next?

Possible response shape:

```json
{
    "success": true,
    "data": {
        "onboarding": {
            "status": "NOT_STARTED",
            "nextStep": "CREATE_CLINIC"
        },
        "user": null,
        "clinic": null
    }
}
```

Conceptual statuses:

- `NOT_STARTED`
- `COMPLETED`
- `RECOVERY_REQUIRED`

Prefer deriving onboarding status from existing `User` and `Clinic` relationships. Do not add an `Onboarding` table unless a later implementation issue proves durable step persistence is required.

## Transactional Clinic And First Admin Provisioning

The clinic bootstrap endpoint must:

1. Verify the Clerk identity.
2. Read trusted identity data from Clerk/server context.
3. Validate clinic input with Zod.
4. Check whether the identity is already provisioned.
5. Generate or validate a unique clinic slug safely.
6. Start one Prisma transaction.
7. Create the `Clinic`.
8. Create the internal `User` with server-controlled values:
    - matching `clerkUserId`
    - trusted email/name where available
    - role `ADMIN`
    - status `ACTIVE`
    - the newly created `clinicId`
9. Commit both records together.
10. Return the completed internal user and clinic summary.

The client must never choose:

- `clerkUserId`
- internal user ID
- role
- user status
- ownership of an existing clinic
- another clinic's ID

## Orphan Clinic Prevention

Provisioning must be safe when:

- the user double-clicks submit
- the browser retries a request
- the network response is lost after commit
- the same Clerk user calls bootstrap twice
- a requested slug is already taken
- user creation fails after clinic creation begins

Required protection:

- unique `User.clerkUserId`
- unique clinic slug
- one Prisma transaction for clinic plus Admin
- deterministic conflict or idempotent completed response
- rollback of all related writes on failure
- no standalone clinic record after failed provisioning

## Isolated Sample Clinic Data

Sample data must be:

- fake
- optional or clearly explained
- created only after clinic ownership exists
- scoped to the authenticated user's newly created clinic
- unable to reference another clinic's doctors, patients, appointments, queue entries, or predictions
- retry-safe so it does not duplicate the full dataset on every request
- recognizable as sample/demo content

Recommended sample set:

- 2-3 doctors
- 6-10 patients
- appointments for today and nearby dates
- queue entries for today
- LOW, MEDIUM, and HIGH no-show examples

Never use real patient data.

## Onboarding-Aware Routing

Conceptual routing behavior:

```txt
Clerk loading
    -> show application loading state

Signed out
    -> public route allowed
    -> protected/onboarding route redirects to sign-in

Signed in + onboarding status NOT_STARTED
    -> public route may redirect to onboarding or offer Continue setup
    -> protected application route redirects to onboarding

Signed in + onboarding COMPLETED
    -> onboarding route redirects to dashboard
    -> protected application routes allowed
```

Avoid redirect loops by resolving Clerk state first and onboarding status second.

## Clinic Settings And First-Run Checklist

The v0.2 settings page should be functional, not decorative.

Admin-editable settings may include existing `Clinic` model fields:

- name
- phone
- email
- address
- city/state/country/pincode
- timezone
- opening time
- closing time
- slot duration
- buffer minutes

Authorization rules:

- Admin can update clinic settings.
- Staff may be denied or given read-only access according to current role rules.
- The active clinic must come from authenticated internal user context, not arbitrary client authority.

Recommended first-run checklist items:

- Clinic profile completed
- At least one doctor added
- At least one patient added
- First appointment booked
- Today's queue reviewed
- Sample data decision completed

Checklist status should be derived from real clinic data where practical.

## Public Onboarding Security Rules

v0.2 onboarding increases the public attack surface. Release requirements:

- Verify Clerk tokens on every onboarding request.
- Never trust role, status, clinic ID, user ID, or Clerk user ID from the request body.
- Validate request bodies strictly with Zod.
- Normalize and constrain clinic names and slugs.
- Handle unique constraint conflicts deliberately.
- Avoid exposing whether arbitrary emails or Clerk IDs exist.
- Apply sensible request-size limits.
- Add rate limiting or comparable abuse protection to provisioning endpoints.
- Log provisioning failures without logging secrets or sensitive patient data.
- Keep CORS restricted to intended local, preview, and production origins.
- Keep operational APIs protected by internal user, active status, role, and clinic scope.
- Add tests proving one clinic cannot access another clinic's data.

## Testing Expectations

Backend tests must cover:

- status returns `NOT_STARTED` for a valid Clerk identity without an internal user
- normal application APIs reject a valid Clerk identity without an internal user
- clinic bootstrap creates clinic and Admin together
- transaction rollback if internal user creation fails
- duplicate submission does not create duplicate clinics/users
- existing provisioned user cannot bootstrap a second clinic through this flow
- client-supplied role/clinic/user authority is ignored or rejected
- sample data is scoped to the new clinic
- Admin can update own clinic settings
- one clinic cannot access another clinic's records

Frontend tests must cover:

- signed-out visitor can view the landing page
- protected route redirects signed-out visitor to sign-in
- signed-in unprovisioned user reaches onboarding
- completed user cannot remain trapped in onboarding
- onboarding form displays validation and server errors
- successful provisioning reaches the application
- retry does not create a duplicate visible workspace
- first-run checklist reflects clinic state

End-to-end coverage should include:

```txt
Open deployed public URL
-> Sign up
-> Resolve NOT_STARTED
-> Create clinic
-> Become ADMIN
-> Optionally seed sample data
-> Reach dashboard
-> Open settings
-> Add/edit doctor
-> Add/edit patient
-> Book appointment
-> Manage/reorder queue
```

Existing v0.1 smoke flows must remain part of regression testing.

## Release Acceptance Criteria

v0.2 is complete when:

- The public deployed URL is useful without authentication.
- A visitor can sign up through Clerk.
- A valid Clerk identity without an internal user receives an onboarding state rather than generic operational access.
- Clinic and first Admin provisioning is atomic and retry-safe.
- Failed provisioning cannot leave an orphan clinic.
- A new clinic is isolated from every other clinic.
- Application routes correctly for signed-out, unprovisioned, active Admin, and active Staff states.
- Optional sample data is fake, isolated, and repeat-safe.
- Clinic settings can be updated by an authorized Admin.
- The first-run checklist guides a user through the operational spine.
- Doctor and patient records can be edited safely.
- Queue order can be changed manually through the UI.
- Backend onboarding tests pass.
- Frontend and end-to-end onboarding tests pass.
- v0.1 workflows continue to pass regression checks.
- README, setup docs, architecture docs, screenshots, demo notes, and release notes match the implementation.

## Explicit Non-Goals

Do not include these in v0.2 unless a later reviewed scope change explicitly adds them:

- patient authentication or patient portal
- doctor authentication or doctor portal
- staff invitation and full staff management system
- user access to multiple clinics
- multi-branch or organization administration
- custom roles or permission builder
- billing, subscriptions, or payments
- inventory, prescriptions, diagnoses, or medical records
- SMS, WhatsApp, email, or voice automation
- advanced analytics suite
- trained machine-learning model
- weather, traffic, GPS, or live-location features
- automatic appointment cancellation
- automatic queue reordering
- mobile application
- changing the locked React, Express, Clerk, PostgreSQL, Prisma, and Vite architecture

## v0.2 Completion Definition

`v0.2.0` is complete only when a new external visitor can:

1. Open the public product URL.
2. Sign up through Clerk.
3. Be recognized as authenticated but unprovisioned.
4. Create a clinic and become the first active Admin through server-controlled transactional provisioning.
5. Optionally receive fake, isolated sample data.
6. Complete first-run setup.
7. Use the existing clinic workflow without accessing any other clinic's data.

Until the release gates pass, v0.2 remains a release candidate and must not be described as fully released.
