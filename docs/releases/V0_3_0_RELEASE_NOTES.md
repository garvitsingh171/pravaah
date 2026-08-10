# Pravaah v0.3.0 Release Notes

Release state: released after owner production verification and GO decision. Actual calendar release date was not provided; the owner supplied `YYYY-MM-DD`, which remains a placeholder.

## Summary

Pravaah v0.3.0 is the production-verified clinic-side operations release. It brings the public entry, Clerk authentication, self-service onboarding, clinic setup, doctor and patient management, appointment booking, queue operations, dashboard visibility, and deterministic no-show assistance into one released product boundary.

The released source supports authenticated Admin and Staff workflows. Doctors and patients remain domain records, not application login roles.

## Production Identity

| Field               | Value                                                          |
| ------------------- | -------------------------------------------------------------- |
| Release status      | Released                                                       |
| GO/NO-GO decision   | GO                                                             |
| Release date        | Actual calendar date not provided; owner supplied `YYYY-MM-DD` |
| Source/main SHA     | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                     |
| Frontend URL        | `https://pravaah.garvitsingh171.com`                           |
| Backend URL         | `https://pravaah-wmeh.onrender.com/`                           |
| Vercel deployed SHA | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                     |
| Render deployed SHA | `6f8864c0e5ff46f15884fc2498cfafa214af4f03`                     |

## Product Improvements

- Public landing route, sign-in route, sign-up route, onboarding redirect handling, protected app routing, and not-found fallback are present in the React app.
- Clinic onboarding can create the first clinic and first Admin from trusted Clerk identity data.
- First-run setup status is derived from backend clinic, doctor, patient, and appointment data.
- Admin clinic settings and optional fictional sample-data provisioning are implemented.
- Doctor and patient create/list/edit workflows are present, with clinic relationship checks.
- Appointment booking validates clinic, doctor, and patient ownership, prevents exact same-time active doctor conflicts, creates the queue entry, and stores no-show risk output in one transaction.
- Queue workflows support date listing, status updates, appointment status synchronization, and manual reorder within one doctor/date active queue.
- Dashboard workflows summarize the day, high-risk appointments, activity, and first-run setup state.

## Security And Authorization

- Clerk authenticates the external identity.
- The backend resolves Clerk identity to an internal active Pravaah `User` for operational APIs.
- Backend authorization checks role, status, and `clinicId`; frontend-hidden controls are not treated as final authorization.
- Admin-only routes protect clinic settings and sample-data provisioning.
- Admin/Staff routes protect doctors, patients, appointments, queue, and dashboard operations.
- Onboarding uses identity-only authentication because a Clerk-authenticated user may not have an internal Pravaah `User` yet.
- Clinic provisioning derives first Admin identity from Clerk and does not accept client-controlled role or clinic ownership fields.

## Production Verification

Owner-reported verification:

| Check                       | Result |
| --------------------------- | ------ |
| Prisma migrate deploy       | PASS   |
| Database connectivity       | PASS   |
| Backend `/api/health`       | PASS   |
| Fresh external Clerk signup | PASS   |
| Fresh-user onboarding       | PASS   |
| Clinic provisioning         | PASS   |
| Admin flow                  | PASS   |
| Staff authorization         | PASS   |
| Cross-clinic rejection      | PASS   |
| Doctor flow                 | PASS   |
| Patient flow                | PASS   |
| Appointment flow            | PASS   |
| No-show assistance          | PASS   |
| Queue workflow              | PASS   |
| Manual reorder              | PASS   |
| Dashboard                   | PASS   |
| Production smoke            | PASS   |

## Known Limitations

- No patient login, doctor login, patient portal, or doctor portal.
- No billing, payments, prescriptions, inventory, full medical records, or hospital ERP workflow.
- No trained machine-learning model, accuracy metric, dataset, confidence probability, automatic cancellation, automatic no-show prioritization, or automatic queue reordering.
- No notification automation through SMS, WhatsApp, email, or voice.
- Current authorization uses one active `User.clinicId`; there is no mature multi-branch SaaS membership switcher.
- Appointment lifecycle enforcement blocks changes away from terminal states but does not implement a full transition matrix.
- Appointment booking does not enforce clinic opening/closing hours, slot-duration alignment, or buffer windows.
- `PatientClinic` attendance counters are read by no-show rules but are not automatically maintained by lifecycle changes.
- No browser E2E suite, no CI/CD workflow, and no production monitoring stack are present.

## Out Of Scope

v0.3.0 must not be represented as including patient/doctor portals, billing, payments, prescriptions, inventory, full medical records, trained ML prediction, automatic risk-based operations, communication automation, native mobile apps, hospital ERP features, or full multi-branch SaaS administration.

## Release Metadata Still Missing

- Actual calendar release date. The owner supplied `YYYY-MM-DD`, which is a placeholder.
- GitHub Release URL.
- Local/GitHub tag evidence. Codex did not create a tag.
