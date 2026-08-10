# Pravaah v0.3.0 Release Notes

Release state: release candidate. Repository-local preparation is in progress, but production verification, owner GO approval, Git tag creation, and GitHub Release publication are still pending.

Do not describe `v0.3.0` as released until production evidence is recorded and the owner explicitly approves a GO decision.

## Summary

Pravaah v0.3.0 is the release-candidate packaging of the current clinic-side operations product. It brings the public entry, Clerk authentication, self-service onboarding, clinic setup, doctor and patient management, appointment booking, queue operations, dashboard visibility, and deterministic no-show assistance into one documented release boundary.

The source tree supports authenticated Admin and Staff workflows. Doctors and patients remain domain records, not application login roles.

## Product Improvements

- Public landing route, sign-in route, sign-up route, onboarding redirect handling, protected app routing, and not-found fallback are present in the React app.
- Clinic onboarding can create the first clinic and first Admin from trusted Clerk identity data.
- First-run setup status is derived from backend clinic, doctor, patient, and appointment data.
- Admin clinic settings and optional fictional sample-data provisioning are implemented.
- Doctor and patient create/list/edit workflows are present, with clinic relationship checks.
- Appointment booking validates clinic, doctor, and patient ownership, prevents exact same-time active doctor conflicts, creates the queue entry, and stores no-show risk output in one transaction.
- Queue workflows support date listing, status updates, appointment status synchronization, and manual reorder within one doctor/date active queue.
- Dashboard workflows summarize the day, high-risk appointments, activity, and first-run setup state.
- Error, loading, recovery, and fallback states are implemented across public/protected routes and API responses where inspected.

## Security And Authorization

- Clerk authenticates the external identity.
- The backend resolves Clerk identity to an internal active Pravaah `User` for operational APIs.
- Backend authorization checks role, status, and `clinicId`; frontend-hidden controls are not treated as final authorization.
- Admin-only routes protect clinic settings and sample-data provisioning.
- Admin/Staff routes protect doctors, patients, appointments, queue, and dashboard operations.
- Onboarding uses identity-only authentication because a Clerk-authenticated user may not have an internal Pravaah `User` yet.
- Clinic provisioning derives first Admin identity from Clerk and does not accept client-controlled role or clinic ownership fields.

## Data And Backend

- Prisma/PostgreSQL models include `Clinic`, `User`, `Doctor`, `DoctorClinic`, `Patient`, `PatientClinic`, `Appointment`, `QueueEntry`, and `NoShowPrediction`.
- v0.3 requires normal production Prisma migration deployment in the target backend environment; no production migration execution has been verified in this repository.
- Appointment creation uses a transaction for appointment, queue entry, and no-show prediction creation.
- Selected advisory locks exist for appointment slot conflict protection, queue position assignment, queue reordering, and sample-data provisioning scopes.
- Queue status and appointment status synchronization happen in transactions with conflict handling.
- These transactions and locks should not be described as universal race-condition protection.

## No-Show Assistance

The no-show feature is deterministic, rule-based, explainable, advisory, and human-controlled.

Verified source inputs include:

- previous no-show count
- previous late-arrival count
- completed appointment count
- optional distance from clinic
- booking time relative to scheduled time

Risk levels are derived from integer score thresholds:

- `LOW`: below 30
- `MEDIUM`: 30 through 59
- `HIGH`: 60 and above

The system stores risk level, score, and reasons in `NoShowPrediction`, then derives suggested staff actions for API/UI responses. It does not automatically cancel appointments, change lifecycle state, contact patients, reorder queues, or prioritize patients based on risk.

## UI

- The frontend is a React/Vite/Tailwind application with public, auth, onboarding, and protected workspace routes.
- Route metadata manages titles, descriptions, robots directives, Open Graph/Twitter metadata, canonical public route metadata, and JSON-LD for the public landing route.
- `apps/web/vercel.json` contains a SPA rewrite for direct route refreshes outside `/api`.
- Responsive and accessibility work exists in components and documentation, but final browser evidence and screenshots still require owner verification.

## Testing

Automated tests exist for meaningful parts of the v0.3 surface:

- Backend: auth middleware/service/repository/controllers, access service, Clerk identity handling, onboarding, clinics, appointments, queues, dashboard, predictions, and validation where test files exist.
- Frontend: public/protected routing, protected shell states, onboarding UI, first-run checklist, dashboard integration, doctor/patient pages, queue page behavior, API client behavior, site metadata, and UI helpers.

Browser E2E testing is intentionally absent from the current repository and remains deferred to a future release. Manual production smoke testing is part of the v0.3 release strategy.

## Deployment

The intended deployment architecture is:

- Frontend: Vite static app, documented for Vercel or equivalent static hosting.
- Backend: Express Node API, documented for Render or equivalent Node hosting.
- Database: PostgreSQL, with Prisma migrations deployed in the backend environment.
- Auth: Clerk frontend publishable key plus backend secret key in the correct environments.

The repository does not currently verify production frontend URL, production backend URL, custom domain, deployed SHAs, production Clerk configuration, production database connectivity, or production smoke results.

## Known Limitations

- No patient login, doctor login, patient portal, or doctor portal.
- No billing, payments, prescriptions, inventory, full medical records, or hospital ERP workflow.
- No trained machine-learning model, accuracy metric, dataset, confidence probability, automatic cancellation, automatic no-show prioritization, or automatic queue reordering.
- No notification automation through SMS, WhatsApp, email, or voice.
- Current authorization uses one active `User.clinicId`; there is no mature multi-branch SaaS membership switcher.
- Appointment lifecycle enforcement blocks changes away from terminal states but does not implement a full transition matrix.
- Appointment booking does not enforce clinic opening/closing hours, slot-duration alignment, or buffer windows.
- `PatientClinic` attendance counters are read by no-show rules but are not automatically maintained by lifecycle changes.
- No browser E2E suite, no committed real screenshots, no CI/CD workflow, and no production monitoring stack are present.

## Out Of Scope

v0.3.0 must not be represented as including patient/doctor portals, billing, payments, prescriptions, inventory, full medical records, trained ML prediction, automatic risk-based operations, communication automation, native mobile apps, hospital ERP features, or full multi-branch SaaS administration.

## Upgrade And Migration Notes

- Root product version is `0.3.0`.
- Private workspace package versions remain `0.1.0`.
- Run production migrations only with the safe deployment command in the configured backend environment:

```bash
npm run prisma:migrate:deploy --workspace apps/server
```

- Do not run `prisma migrate reset`, `prisma db push`, development migrations, or seed/reset commands against production.
- Production release finalization requires owner-provided URLs, deployed SHAs, migration output, health/database checks, product smoke results, security smoke results, actual release date, and GO/NO-GO decision.
