# Staff Invitations And Management

## Product boundary

Pravaah v0.4 keeps five concerns separate:

- Clerk authentication identifies the person.
- `User.clinicId` identifies the one clinic they may access.
- `User.role` (`ADMIN` or `STAFF`) controls authority.
- `User.status` (`INVITED`, `ACTIVE`, or `SUSPENDED`) controls current access.
- `StaffInvitation` records which Admin authorized a person to join a clinic.

The first clinic owner follows onboarding and becomes an active Admin. Staff are invitation-only and cannot choose a clinic or role in a browser request.

## Admin invitation flow

```text
ACTIVE Admin
  -> POST /api/clinics/:clinicId/staff/invitations { email }
  -> authenticateRequest + requireAdminRole + requireClinicAccess
  -> normalize email with trim().toLowerCase()
  -> acquire transaction advisory locks for normalized email and clinic/email
  -> reject an existing member or unexpired pending invitation
  -> generate 32 random bytes and encode base64url
  -> persist SHA-256(raw token), never the raw token
  -> persist PENDING invitation with seven-day expiry
  -> return the raw invite URL in this creation response only
```

There is no mail provider in this repository. The Admin UI says **Invitation created** and offers a copy-link action. Listing invitations never returns `tokenHash` and cannot reconstruct an old secret link.

## Invitee flow

`/invite/:token` is outside `ProtectedAppShell`. A signed-out invitee sees generic sign-in and sign-up actions that preserve the internal invitation return path. Shared redirect validation accepts only same-origin paths beginning with `/` and rejects protocol-relative, backslash-authority, absolute, and non-path values.

After Clerk authentication:

```text
GET /api/staff/invitations/:token
  -> authenticateClerkIdentity
  -> trusted Clerk identity lookup
  -> SHA-256 token lookup
  -> normalized trusted email match
  -> minimal clinic name, invited email, effective status, expiry
```

The page does not accept automatically. `POST /api/staff/invitations/:token/accept` requires the Clerk identity and an empty body.

## Acceptance transaction

Trusted Clerk profile resolution occurs before the transaction. The transaction then:

1. locks the invitation row with `FOR UPDATE`;
2. requires persisted `PENDING` and `expiresAt > now`;
3. rechecks the normalized email match;
4. acquires the normalized-email membership advisory lock;
5. rejects conflicting Clerk IDs, Admin accounts, other-clinic users, and suspended Staff;
6. creates a new `STAFF`/`ACTIVE` user, or activates a matching legacy `STAFF`/`INVITED` user;
7. conditionally changes the invitation to `ACCEPTED`, using the same event time for `acceptedAt`;
8. commits the user and invitation together.

A replay by the same accepted identity returns `ALREADY_ACCEPTED`. Because accept and revoke both lock and claim `PENDING`, only one can win. A failed acceptance rolls back any user creation or activation.

## Expiration

Persistence uses only `PENDING`, `ACCEPTED`, and `REVOKED`. A pending row with `expiresAt <= now` is returned as effective `EXPIRED`. No scheduler mutates old rows. Preview, acceptance, revocation, duplicate detection, and reinvitation enforce expiry on the backend.

## Onboarding protection

Before clinic/Admin provisioning, `authService.createClinicOnboarding` resolves the trusted Clerk email and checks for an unexpired pending Staff invitation. The provisioning transaction takes the same normalized-email advisory lock and rechecks, closing the race with invitation creation. A match returns `STAFF_INVITATION_PENDING`; no clinic or Admin user is created. The token is still required to join—email detection never activates membership.

An identity with no pending Staff invitation continues through the existing transactional owner flow unchanged.

## Admin management

- `GET /api/clinics/:clinicId/staff` lists Admin and Staff summaries without Clerk IDs.
- `GET /api/clinics/:clinicId/staff/invitations` lists invitation history with effective status but no secret.
- `PATCH /api/clinics/:clinicId/staff/invitations/:invitationId/revoke` changes an unexpired pending invitation to revoked.
- `PATCH /api/clinics/:clinicId/staff/:userId/status` permits only `ACTIVE -> SUSPENDED` and `SUSPENDED -> ACTIVE` for same-clinic Staff.

All management routes require active internal authentication, Admin role, and verified clinic access. They do not delete users or edit roles. Suspending a user preserves appointment attribution and causes their next normal API request to fail the existing active-user check even if their Clerk session remains valid.
