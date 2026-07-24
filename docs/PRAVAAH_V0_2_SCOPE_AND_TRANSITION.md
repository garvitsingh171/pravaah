# Pravaah v0.2 Scope and Release Transition Plan

**Release name:** Public Demo and Self-Service Clinic Onboarding  
**Version:** v0.2.0  
**Previous release:** v0.1.0 - Deployed MVP  
**Date:** July 20, 2026  
**Status:** Release scope baseline

---

## 1. Executive decision

Pravaah MVP is complete and deployed. The deployed MVP should now be frozen as **Pravaah v0.1.0**.

Pravaah v0.2.0 should not expand the product into a hospital management system. Its purpose is to make the existing clinic workflow safely explorable by an external person through a public entry point and a self-service clinic onboarding flow.

The v0.2 release theme is:

> **Public Demo and Self-Service Clinic Onboarding**

The primary v0.2 journey is:

```txt
Visitor opens Pravaah
        v
Visitor views a public landing page
        v
Visitor signs up through Clerk
        v
Pravaah recognizes an authenticated but unprovisioned identity
        v
User creates a clinic
        v
Clinic and internal ADMIN user are created atomically
        v
Optional isolated sample data is provisioned for that clinic
        v
User completes first-run setup
        v
User enters the existing dashboard and clinic workflow
```

The existing MVP spine remains unchanged:

```txt
Clinic -> Doctor/Patient -> Appointment -> Queue -> Starter Prediction
```

---

## 2. Release boundary

### 2.1 v0.1.0 - Frozen MVP

v0.1.0 represents the exact deployed MVP baseline. It includes:

- Clerk sign-in for already provisioned Admin and Staff users
- internal user mapping and clinic-scoped backend authorization
- clinic-side dashboard
- doctor and patient management
- appointment booking and status workflows
- live queue management
- explainable rule-based no-show risk scoring
- deployed frontend, backend, database, and authentication configuration

After the freeze, v0.1 should receive only:

- critical security fixes
- production-breaking bug fixes
- data-integrity fixes
- deployment recovery fixes

New onboarding, public routing, settings, edit workflows, queue controls, and demo improvements belong to v0.2.

### 2.2 v0.2.0 - Productization release

v0.2 turns the deployed MVP from an owner-provisioned demonstration into a safe self-service product demonstration.

It must preserve all v0.1 behavior while adding:

- a useful unauthenticated public experience
- Clerk sign-up
- an explicit pre-provisioning authentication state
- secure clinic bootstrap
- first-run onboarding
- isolated sample data
- improved clinic administration and workflow completeness
- automated onboarding coverage
- updated release documentation and demo assets

---

## 3. Problem being solved

The deployed MVP currently assumes that an authenticated Clerk user already has an active internal Pravaah `User` record and a clinic assignment.

That works for manually provisioned demo accounts, but it prevents an external visitor from exploring the product independently. A newly signed-up Clerk user can be authenticated successfully while still receiving `INTERNAL_USER_NOT_FOUND` from the application backend.

The current clinic creation endpoint also cannot safely bootstrap a first user because normal clinic APIs require an already authorized internal Admin. Creating only a `Clinic` record would risk leaving an orphan clinic without an Admin owner.

v0.2 resolves this by treating these as separate concepts:

```txt
Clerk identity = Who is this person?
Internal Pravaah user = What role and clinic access does this person have?
Onboarding state = Has this authenticated identity been provisioned yet?
```

---

## 4. v0.2 goals

### 4.1 Primary goal

Allow a new external visitor to sign up, create an isolated clinic workspace, become that clinic's Admin, and reach a usable version of the existing Pravaah workflow without manual database seeding.

### 4.2 Supporting goals

- Preserve strict clinic data isolation.
- Keep Clerk responsible only for identity.
- Keep internal roles and clinic access in the Pravaah database.
- Make onboarding retry-safe and transactionally consistent.
- Provide a believable first-run experience rather than an empty or broken dashboard.
- Complete obvious MVP workflow gaps: clinic settings, doctor editing, patient editing, and manual queue reordering.
- Add tests around the new highest-risk security and provisioning paths.

### 4.3 Non-goal

v0.2 is not a full SaaS commercialization release. It does not add subscriptions, billing, multi-organization administration, patient login, doctor login, or advanced permission management.

---

## 5. Scope pillars

### Pillar A - Public product entry

Includes:

- public landing page
- public routes that do not require Clerk authentication
- clear sign-in and sign-up calls to action
- authenticated redirects that do not trap signed-in users on public auth pages

### Pillar B - Identity and authorization separation

Includes:

- Clerk sign-up flow
- authenticated-but-unprovisioned state
- middleware separation between Clerk authentication and internal authorization
- onboarding endpoints that require a valid Clerk identity but do not require an existing internal user
- existing operational APIs continuing to require active internal authorization and clinic scoping

### Pillar C - Safe clinic provisioning

Includes:

- onboarding status API
- clinic and first Admin creation in one database transaction
- rollback on failure
- duplicate and retry protection
- prevention of clinic records without an owning Admin
- server-controlled assignment of `ADMIN`, `ACTIVE`, and clinic ownership

### Pillar D - First-run experience

Includes:

- clinic onboarding form
- onboarding-aware route decisions
- optional isolated sample clinic data
- functional clinic settings page
- first-run setup checklist
- helpful loading, retry, empty, validation, and error states

### Pillar E - Security and confidence

Includes:

- strict request validation
- rate limiting or equivalent abuse protection for public onboarding APIs
- no trust in client-provided role, user ID, or clinic ownership
- clinic isolation tests
- backend onboarding tests
- frontend and end-to-end onboarding tests
- release documentation and demo assets

### Pillar F - Workflow completion

Includes:

- doctor edit workflow
- patient edit workflow
- manual queue reorder controls

These do not define the onboarding architecture, but they are required before v0.2 is considered complete.

---

## 6. Included issues and intended outcomes

| Order | Issue | Intended release outcome |
| --- | --- | --- |
| 1 | Freeze MVP and initialize v0.2 | Preserve the deployed MVP as v0.1.0 and establish release governance for v0.2.0. |
| 2 | Define v0.2 scope in documentation | Create a source-of-truth scope, architecture boundary, order, non-goals, and acceptance criteria. |
| 3 | Add public landing page and public routes | Make the deployed URL useful before authentication. |
| 4 | Enable Clerk sign-up flow | Permit external users to create a Clerk identity through supported Clerk UI and routes. |
| 5 | Separate Clerk identity from internal authorization | Stop treating every valid Clerk identity as if it must already have an internal user. |
| 6 | Add onboarding status API | Return the authenticated identity's provisioning state and next required action. |
| 7 | Create clinic and Admin transactionally | Bootstrap the clinic and its first active Admin as one atomic operation. |
| 8 | Prevent orphan clinic creation | Make retries, failures, and duplicate requests incapable of leaving an unowned clinic. |
| 9 | Build first-time clinic onboarding UI | Collect clinic details and drive the bootstrap API with clear feedback. |
| 10 | Provision isolated sample clinic data | Give a new clinic optional fake demo data scoped only to its own clinic. |
| 11 | Add onboarding-aware application routing | Route signed-out, unprovisioned, and active users to the correct application state. |
| 12 | Build functional clinic settings page | Allow authorized Admins to review and update operational clinic settings. |
| 13 | Add first-run setup checklist | Guide a new Admin through clinic settings, doctors, patients, appointments, and queue setup. |
| 14 | Harden public onboarding APIs | Add validation, abuse protection, safe errors, audit-friendly logging, and strict server authority. |
| 15 | Add backend onboarding tests | Cover status, provisioning, rollback, idempotency, authorization, and isolation. |
| 16 | Add frontend and end-to-end onboarding tests | Cover the visitor-to-dashboard journey and important failure/retry states. |
| 17 | Publish v0.2 documentation and demo assets | Update README, setup, screenshots, demo instructions, limitations, and release notes. |
| 18 | Add doctor edit workflow | Complete doctor management without adding doctor authentication. |
| 19 | Add patient edit workflow | Complete patient management without adding patient authentication. |
| 20 | Add queue reorder controls | Expose the existing human-controlled queue ordering capability safely in the UI. |

---

## 7. Recommended implementation order and dependencies

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

Important dependency rules:

- Do not build the onboarding form before the onboarding API contract is stable.
- Do not allow clinic bootstrap through the normal authorized clinic endpoint.
- Do not provision sample data before clinic ownership is committed successfully.
- Do not mark v0.2 ready until existing v0.1 clinic workflows still pass regression testing.
- Doctor editing, patient editing, and queue reordering can be developed after the authorization architecture is stable and may run in parallel.

---

## 8. Authentication and authorization contract

### 8.1 User states

Pravaah v0.2 must recognize at least these application states:

| State | Clerk session | Internal user | Clinic | Expected destination |
| --- | --- | --- | --- | --- |
| Signed out | No | Unknown | Unknown | Public landing or sign-in/sign-up |
| Authenticated, unprovisioned | Yes | No | No | Clinic onboarding |
| Authenticated, invalid internal state | Yes | Missing/inactive/inconsistent | Missing or invalid | Recovery/error state; never operational app access |
| Active Admin | Yes | ACTIVE ADMIN | Assigned | Dashboard/application |
| Active Staff | Yes | ACTIVE STAFF | Assigned | Dashboard/application with role restrictions |

A missing internal user is not automatically an authentication failure. It is a valid onboarding state only on explicitly onboarding-aware endpoints and routes.

### 8.2 Middleware boundaries

Recommended responsibility split:

```txt
requireClerkAuth
    Verifies the Clerk session and exposes trusted identity claims.

loadInternalUser or optionalInternalUser
    Attempts to resolve the internal user without rejecting a legitimate unprovisioned identity.

requireInternalUser
    Requires an internal user for normal application APIs.

requireActiveUser
    Requires the internal user to be ACTIVE.

requireClinicAccess
    Uses server-side user data to enforce clinic scope.

requireRole
    Enforces ADMIN or STAFF permissions from the internal database.
```

The exact file names may follow the existing codebase, but the responsibility boundary must remain explicit.

### 8.3 Endpoint classes

| Endpoint class | Identity requirement | Internal user requirement | Example purpose |
| --- | --- | --- | --- |
| Public | None | None | Health, landing support where applicable |
| Clerk-authenticated onboarding | Valid Clerk identity | Not required | Onboarding status and clinic bootstrap |
| Internal application | Valid Clerk identity | ACTIVE internal user | Doctors, patients, appointments, queue, dashboard |
| Admin-only application | Valid Clerk identity | ACTIVE ADMIN | Clinic settings and restricted administration |

---

## 9. Onboarding API contract

### 9.1 Onboarding status

The onboarding status endpoint should answer:

- Is the Clerk identity valid?
- Does an internal user exist?
- Is that internal user active?
- Is a clinic assigned?
- Is onboarding complete?
- What should the frontend do next?

A possible response shape is:

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

Possible conceptual statuses:

- `NOT_STARTED`
- `COMPLETED`
- `RECOVERY_REQUIRED`

Avoid adding unnecessary persistent onboarding state if it can be derived reliably from `User` and `Clinic` records. Add schema fields only when the product actually needs durable step tracking.

### 9.2 Clinic bootstrap

The bootstrap endpoint must:

1. Verify the Clerk identity.
2. Read trusted identity data from Clerk/server context.
3. Validate clinic input using Zod.
4. Check whether the identity is already provisioned.
5. Generate or validate a unique clinic slug safely.
6. Start one Prisma transaction.
7. Create the clinic.
8. Create the internal user with server-controlled values:
   - matching `clerkUserId`
   - trusted email/name where available
   - role `ADMIN`
   - status `ACTIVE`
   - the newly created `clinicId`
9. Commit both records together.
10. Return the completed internal user and clinic summary.

The client must never be allowed to choose:

- `clerkUserId`
- internal user ID
- role
- user status
- ownership of an existing clinic
- another clinic's ID

### 9.3 Retry and consistency behavior

The endpoint must be safe when:

- the user double-clicks submit
- the browser retries
- the network response is lost after commit
- the same Clerk user calls the endpoint twice
- a requested slug is already taken
- user creation fails after clinic creation begins

Required protection:

- unique `clerkUserId`
- unique clinic slug
- one transaction for clinic + Admin
- deterministic conflict or idempotent completed response
- no standalone clinic record after failed provisioning

---

## 10. Sample data isolation contract

Sample data must be:

- fake
- optional or clearly explained
- created only after clinic ownership exists
- scoped to the authenticated user's clinic
- unable to reference another clinic's doctors, patients, appointments, queue entries, or predictions
- repeat-safe so it does not duplicate the entire dataset on every request
- recognizable as sample/demo content

Recommended sample set:

- 2-3 doctors
- 6-10 patients
- appointments for today and nearby dates
- queue entries for today
- LOW, MEDIUM, and HIGH no-show examples
- setup checklist progress that reflects what was provisioned

Never use real patient data.

---

## 11. Public and application routing contract

Recommended frontend route groups:

```txt
Public routes
/
/sign-in
/sign-up
/about or /features (optional only if included in landing scope)

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

Routing should be based on resolved application state, not only `isSignedIn`.

Conceptual routing logic:

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

---

## 12. Clinic settings and first-run checklist

### 12.1 Clinic settings

The v0.2 settings page should be functional, not decorative.

Admin-editable fields may include the existing clinic model fields:

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
- Staff can be denied or given read-only access according to current role rules.
- The clinic ID comes from the authenticated internal user context, not arbitrary client authority.

### 12.2 Setup checklist

Recommended checklist items:

- Clinic profile completed
- At least one doctor added
- At least one patient added
- First appointment booked
- Today's queue reviewed
- Sample data decision completed

Checklist status should be derived from real clinic data where practical instead of being a disconnected frontend-only checklist.

---

## 13. Doctor, patient, and queue workflow completion

### 13.1 Doctor edit

- Edit permitted doctor fields.
- Preserve `DoctorClinic` relationship and clinic scoping.
- Do not add doctor login.
- Do not allow editing a doctor through another clinic's context.
- Support active/inactive behavior according to existing rules.

### 13.2 Patient edit

- Edit permitted patient identity/contact fields.
- Preserve `PatientClinic` history and clinic scoping.
- Do not add patient login.
- Avoid accidental changes to historical counters unless the API explicitly owns them.

### 13.3 Queue reorder

- Keep reordering manual and human-controlled.
- Use existing backend consistency rules and transactions.
- Restrict reordering to active queue entries in the correct clinic/doctor/date scope.
- Show clear positions and disabled/loading/error states.
- Do not add automatic AI-driven reordering.

---

## 14. Security requirements

v0.2 onboarding increases the public attack surface. The following are release requirements:

- Verify Clerk tokens on every onboarding request.
- Never trust role, status, clinic ID, or Clerk user ID from the request body.
- Validate request bodies strictly with Zod.
- Normalize and constrain clinic names/slugs.
- Handle unique constraint conflicts deliberately.
- Avoid exposing whether arbitrary emails or Clerk IDs exist.
- Apply sensible request-size limits.
- Add rate limiting or comparable abuse protection to provisioning endpoints.
- Log provisioning failures without logging secrets or sensitive patient data.
- Keep CORS restricted to intended local, preview, and production origins.
- Keep operational APIs protected by internal user, active status, role, and clinic scope.
- Add tests proving one clinic cannot access another clinic's data.

---

## 15. Testing strategy

### 15.1 Backend tests

Minimum critical cases:

- status returns `NOT_STARTED` for valid Clerk identity without internal user
- normal application API rejects valid Clerk identity without internal user
- clinic bootstrap creates clinic and Admin together
- transaction rolls back if internal user creation fails
- duplicate submission does not create duplicate clinics/users
- existing provisioned user cannot bootstrap a second clinic through this flow
- client-supplied role/clinic/user authority is ignored or rejected
- sample data is scoped to the new clinic
- Admin can update own clinic settings
- one clinic cannot access another clinic's records

### 15.2 Frontend tests

Minimum critical cases:

- signed-out visitor can view the landing page
- protected route redirects signed-out visitor to sign-in
- signed-in unprovisioned user reaches onboarding
- completed user cannot remain trapped in onboarding
- onboarding form displays validation and server errors
- successful provisioning reaches the application
- retry does not create a duplicate visible workspace
- first-run checklist reflects clinic state

### 15.3 End-to-end path

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

---

## 16. v0.2 release acceptance criteria

v0.2 is complete when:

- The public deployed URL is useful without authentication.
- A visitor can sign up through Clerk.
- A valid Clerk identity without an internal user receives an onboarding state rather than generic operational access.
- Clinic and first Admin provisioning is atomic and retry-safe.
- Failed provisioning cannot leave an orphan clinic.
- A new clinic is isolated from every other clinic.
- The application routes correctly for signed-out, unprovisioned, active Admin, and active Staff states.
- Optional sample data is fake, isolated, and repeat-safe.
- Clinic settings can be updated by an authorized Admin.
- The first-run checklist guides a user through the operational spine.
- Doctor and patient records can be edited safely.
- Queue order can be changed manually through the UI.
- Backend onboarding tests pass.
- Frontend and end-to-end onboarding tests pass.
- v0.1 workflows continue to pass regression checks.
- README, setup docs, architecture docs, screenshots, demo notes, and release notes match the implementation.

---

## 17. Explicit v0.2 non-goals

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
- changing the locked React, Express, Clerk, PostgreSQL, and Prisma architecture

---

## 18. Additional work required to freeze MVP correctly

The first issue should include more than changing a heading from MVP to v0.2.

### Required release-freeze actions

1. Identify the exact commit deployed to Vercel and Render.
2. Confirm frontend and backend deployments correspond to the intended MVP commit(s).
3. Run and record an MVP smoke test.
4. Create a database restore point or Neon branch before onboarding changes.
5. Tag the deployed baseline as `v0.1.0`.
6. Create a GitHub Release for `v0.1.0` with features, limitations, deployed links, and known setup requirements.
7. Add or update `CHANGELOG.md`.
8. Update README status to `MVP complete and deployed` and identify v0.2 as active development.
9. Create the `v0.2.0` milestone and assign all twenty issues.
10. Freeze new v0.1 feature work; allow only critical hotfixes.
11. Record current production environment assumptions without exposing secrets.
12. Capture screenshots or a short demo recording of the v0.1 baseline.
13. Confirm the existing demo/admin account remains usable during v0.2 development.
14. Record known MVP limitations, especially manual user/clinic provisioning and lack of a public landing/sign-up path.

### Recommended but not mandatory

- Add a `docs/releases/V0_1_0_MVP_FREEZE.md` release snapshot.
- Add GitHub branch protection if it is not already configured.
- Add a minimal release checklist template for future versions.
- Keep a separate preview environment for v0.2 before promoting changes to production.

Do not create a long-lived `v0.1` branch unless you genuinely plan to maintain parallel patch releases. The tag and GitHub Release are usually enough for this project stage.

---

## 19. Step-by-step: Issue 1 - Freeze MVP and initialize v0.2

### Phase 1 - Verify the baseline

1. Open the deployed Vercel frontend.
2. Sign in using the existing provisioned demo/Admin account.
3. Verify:
   - dashboard loads
   - doctors list loads
   - patients list loads
   - appointment flow works
   - today's queue loads and status updates work
   - no-show risk is visible
   - clinic isolation/auth checks still behave correctly
4. Record any known issue. Fix only a release-blocking problem before tagging.
5. In Vercel, identify the production deployment commit SHA.
6. In Render, identify the backend production deployment commit SHA.
7. Confirm the repository state that represents the complete deployed MVP.

### Phase 2 - Protect the data baseline

1. Create a Neon database branch or other restore point for the current production database.
2. Name it clearly, for example:

```txt
pravaah-v0-1-0-mvp-freeze-2026-07-20
```

1. Confirm no real patient data is included in downloadable demo assets.
2. Record the restore process privately; do not commit credentials.

### Phase 3 - Create the release tag

From a clean repository:

```bash
git checkout main
git pull origin main
git status
git log --oneline -n 10
```

Tag the exact deployed MVP commit:

```bash
git tag -a v0.1.0 <DEPLOYED_COMMIT_SHA> -m "Pravaah v0.1.0 - Deployed MVP"
git push origin v0.1.0
```

Create the GitHub Release through the UI or GitHub CLI:

```bash
gh release create v0.1.0 \
  --title "Pravaah v0.1.0 - Deployed MVP" \
  --notes-file docs/releases/V0_1_0_MVP_FREEZE.md
```

### Phase 4 - Initialize v0.2 tracking

1. Create GitHub milestone `v0.2.0`.
2. Use this description:

> Public Demo and Self-Service Clinic Onboarding. Makes the deployed MVP safely explorable through public routes, Clerk sign-up, transactional clinic provisioning, isolated sample data, onboarding-aware routing, settings, tests, and workflow completion.

1. Add the twenty listed issues to the milestone.
2. Keep the order from this scope document.
3. Mark issue dependencies in descriptions or the project board.
4. Create a v0.2 project-board view grouped by status and ordered by dependency.

### Phase 5 - Commit repository transition metadata

Recommended branch:

```txt
chore/freeze-mvp-init-v0-2
```

Recommended changes:

- create/update `CHANGELOG.md`
- add `docs/releases/V0_1_0_MVP_FREEZE.md`
- update README project status
- update roadmap status from active MVP build to completed v0.1 and active v0.2
- add known limitations and deployed baseline references

Recommended commit:

```txt
chore: freeze v0.1 MVP and initialize v0.2
```

Recommended PR title:

```txt
[Chore] Freeze v0.1 MVP and initialize v0.2
```

### Phase 6 - Definition of done for Issue 1

- exact deployed commit identified
- MVP smoke test recorded
- database restore point created
- `v0.1.0` tag pushed
- GitHub Release published
- README/changelog/release snapshot updated
- `v0.2.0` milestone created
- all v0.2 issues assigned and ordered
- v0.1 feature freeze rule documented

---

## 20. Step-by-step: Issue 2 - Define v0.2 scope in documentation

### Phase 1 - Create the source-of-truth document

Recommended branch:

```txt
docs/define-v0-2-scope
```

Create:

```txt
docs/V0_2_SCOPE.md
```

Use this document as its initial content.

The file must define:

- release name and purpose
- current problem
- primary user journey
- included issues
- implementation order and dependencies
- identity versus authorization boundary
- onboarding API expectations
- transaction and isolation rules
- tests and release acceptance criteria
- non-goals

### Phase 2 - Preserve MVP history

Do not overwrite `docs/MVP.md` as though the MVP never existed.

Update it with a release status notice near the top:

```txt
Status: Completed and frozen as Pravaah v0.1.0.
Active post-MVP scope: docs/V0_2_SCOPE.md.
```

Keep its original MVP boundary as historical release documentation.

### Phase 3 - Update roadmap

Update `docs/ROADMAP.md` to:

- mark the June 1-July 12 MVP roadmap complete
- identify the deployed release as v0.1.0
- add v0.2 release theme
- list the new work in dependency order
- move future SaaS, portals, communication, and advanced intelligence work after v0.2

Do not pretend all post-MVP roadmap ideas are part of v0.2.

### Phase 4 - Update architecture contract

Update `docs/ARCHITECTURE.md` with:

- public route group
- onboarding route group
- protected application route group
- authenticated-but-unprovisioned user state
- separated Clerk identity and internal authorization middleware
- onboarding module responsibility
- transactional clinic + Admin bootstrap
- explicit rule that normal operational APIs still require an active internal user

Recommended backend module addition:

```txt
apps/server/src/modules/onboarding/
```

It should follow the existing feature-module flow:

```txt
Route -> validateRequest -> Controller -> Service -> Repository -> Prisma
```

### Phase 5 - Update role documentation

Update `docs/USER_ROLES.md` to clarify:

- `Authenticated identity` is not a new business role.
- Before provisioning, the user has no Pravaah role or clinic permissions.
- The first successfully provisioned user becomes the clinic's `ADMIN` through server-controlled logic.
- Patients and doctors remain record-only and do not sign in.
- Staff behavior remains unchanged unless a separate future issue adds staff invitation/provisioning.

### Phase 6 - Update database documentation carefully

Update `docs/DATABASE_DESIGN.md` only with confirmed requirements:

- clinic + Admin bootstrap must be transactional
- `User.clerkUserId` remains unique
- clinic slug remains unique
- internal user is the owner/access link for the new clinic in the current single-clinic model
- sample data must use the new clinic ID consistently

Do not add an `Onboarding` table merely because there is an onboarding UI. Prefer derived state unless durable step tracking is required.

### Phase 7 - Update AI and contributor guidance

Update `docs/AI_CONTEXT.md`:

- v0.1 is frozen
- v0.2 active scope is public demo and onboarding
- missing internal user is valid only for onboarding-aware endpoints
- normal APIs must keep `INTERNAL_USER_NOT_FOUND` or equivalent enforcement
- AI tools must not bypass auth or make clinic APIs public
- AI tools must not add patient/doctor login

Update `docs/CONTRIBUTING.md`:

- link `V0_2_SCOPE.md` as active release scope
- require onboarding/security changes to include tests
- require schema changes to document migration and rollback impact

Update `docs/SETUP.md` later in the implementation cycle with actual Clerk sign-up URLs and onboarding commands; in the scope PR, add only confirmed high-level guidance.

### Phase 8 - Update README

README should show:

```txt
Current stable release: v0.1.0 - MVP complete and deployed
Active development: v0.2.0 - Public Demo and Self-Service Clinic Onboarding
```

Link:

- MVP scope
- v0.2 scope
- architecture
- setup
- deployed demo
- release notes

### Phase 9 - Validate documentation consistency

Search the repository for outdated statements such as:

```bash
rg -n "MVP target|in progress|sign-up|INTERNAL_USER_NOT_FOUND|post-MVP|clinic creation|public route|patient login|doctor login" README.md docs .github
```

Check that:

- no active document says MVP is still under construction
- no document suggests any authenticated Clerk user automatically has clinic access
- no document makes normal clinic data public
- no document adds patient or doctor authentication
- no document describes advanced AI as part of v0.2
- v0.2 issue order is consistent

### Phase 10 - Run repository checks

Use the actual repository scripts, for example:

```bash
npm run format
npm run lint
npm run build
npm run check
```

For a docs-only PR, report honestly if a command is unavailable or unrelated.

Recommended commit:

```txt
docs: define Pravaah v0.2 scope and onboarding boundaries
```

Recommended PR title:

```txt
[Docs] Define Pravaah v0.2 scope and onboarding boundaries
```

### Phase 11 - Definition of done for Issue 2

- `docs/V0_2_SCOPE.md` exists
- MVP history is preserved and marked frozen
- roadmap reflects v0.1 completion and v0.2 order
- architecture documents pre-provisioning state and middleware boundaries
- user roles clarify that onboarding identity is not a business role
- database docs define transactional ownership and isolation rules
- AI context prevents auth bypass and scope drift
- README points to stable and active releases
- docs contain no material contradictions
- formatting/checks are recorded

---

## 21. Suggested repository documentation structure after both issues

```txt
docs/
|-- ARCHITECTURE.md
|-- MVP.md
|-- V0_2_SCOPE.md
|-- DATABASE_DESIGN.md
|-- ROADMAP.md
|-- USER_ROLES.md
|-- SETUP.md
|-- CONTRIBUTING.md
|-- AI_CONTEXT.md
`-- releases/
    `-- V0_1_0_MVP_FREEZE.md

CHANGELOG.md
README.md
```

---

## 22. Final release principle

v0.1 proved that the clinic workflow works.

v0.2 must prove that a new external user can enter that workflow safely without project-owner intervention.

The release is successful only when this flow is reliable:

```txt
Public visitor
-> Clerk identity
-> Safe unprovisioned state
-> Transactional clinic ownership
-> Isolated workspace
-> Existing Pravaah operational spine
```
