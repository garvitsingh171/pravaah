# Known Limitations

This document lists verified limitations and claim boundaries for reviewer, interview, release, and portfolio use.

## Product Limitations

- Patients and doctors do not log in. They are records managed by Admin/Staff users.
- Staff management, invitations, and advanced permission administration are not implemented as a product workflow.
- Billing, prescriptions, inventory, communication automation, and full electronic medical record workflows are outside the current product boundary.
- The current product supports one active clinic context per internal `User`; there is no multi-clinic context switcher or membership model.
- Sample data is suitable for demos, not real clinical use.

## Technical Limitations

- Appointment booking checks clinic, doctor, patient membership and exact same-time doctor conflicts, but does not enforce clinic opening/closing hours, slot-duration alignment, or buffer windows.
- Appointment lifecycle enforcement is partial. The backend blocks changes away from final appointment states, but it does not implement a strict transition matrix for every state pair.
- Queue status and appointment status are synchronized in transactions, but no audit log records who made each operational decision.
- Advisory locks are used for selected booking, queue positioning, queue reorder, and sample-data scopes. They should not be described as universal race-condition protection.
- `PatientClinic` attendance counters are used by the risk logic but are not automatically updated by appointment or queue status changes in current source.
- Dashboard summary and high-risk reads can backfill missing no-show predictions, so those reads may have a database side effect.
- Doctor updates verify clinic linkage but update the shared `Doctor` row, which matters if future multi-clinic doctor sharing is introduced.

## Data And AI Limitations

- No-show assistance is deterministic and rule-based, not a trained machine-learning model.
- No accuracy, fairness, calibration, or real-world outcome metrics are committed.
- The system does not automatically cancel appointments, reprioritize queues, or contact patients based on risk level.
- Risk factors depend on stored appointment history, late-arrival counts, booking timing, and optional distance values; incomplete history can affect usefulness.

## Testing Limitations

- Backend and frontend Vitest coverage exists, but coverage is not complete across all pages and repositories.
- No browser-based E2E suite is present in the current repository.
- Notable gaps recorded in the Workflow Atlas include appointment page tests, clinic settings page tests, and backend patient service/repository tests.
- Responsive and accessibility evidence is documented as an audit/checklist, not as committed browser screenshots or automated accessibility reports.

## Deployment Limitations

- Production frontend URL, backend URL, custom domain, and deployed commit SHAs are recorded for v0.3.0; GitHub Release URL and actual calendar release date are not provided.
- `apps/web/vercel.json` proves a Vercel-style SPA rewrite, but not a completed production deployment.
- Deployment docs describe a Node host such as Render for the backend and PostgreSQL such as Neon for data, but live provider state still requires owner verification.
- No CI/CD workflow is committed.
- No production monitoring, tracing, or alerting integration is committed.

## UX Limitations

- The app is a web app, not a native mobile app.
- Queue reordering is manual and human-controlled.
- Recovery states tell the user what happened but require an administrator/project owner to repair account data.
- Real screenshots still need to be captured from a verified local, preview, or production environment.

## Future Work Boundaries

Future improvements may include audit logs, reminders, stricter lifecycle state machines, doctor availability, automatic attendance counter updates, better observability, patient/doctor portals, multi-clinic memberships, E2E tests, and trained risk models. They should remain future work unless a separate implementation issue completes them.
