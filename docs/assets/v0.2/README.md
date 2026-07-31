# v0.2 Demo Assets

This folder tracks the demo assets required for the `v0.2.0` release candidate.

No real screenshot files are committed yet. Do not create fake screenshots, generated screenshots, placeholder screenshots that look real, or screenshots containing real patient data.

## Required Screenshot Set

| File name                         | Capture                                                |
| --------------------------------- | ------------------------------------------------------ |
| `01-public-landing.png`           | Public landing page while signed out.                  |
| `02-sign-up.png`                  | Clerk sign-up route with no real email visible.        |
| `03-onboarding-status.png`        | First-run onboarding state or onboarding form.         |
| `04-create-clinic.png`            | Clinic onboarding form with fictional clinic data.     |
| `05-sample-data-choice.png`       | Optional sample data decision state.                   |
| `06-dashboard-first-run.png`      | Dashboard with first-run checklist.                    |
| `07-clinic-settings.png`          | Admin clinic settings page.                            |
| `08-doctor-edit.png`              | Doctor edit workflow.                                  |
| `09-patient-edit.png`             | Patient edit workflow.                                 |
| `10-appointment-risk.png`         | Appointment detail/list with no-show risk explanation. |
| `11-queue-reorder.png`            | Queue page with manual reorder controls.               |
| `12-dashboard-after-activity.png` | Dashboard after appointment/queue activity.            |

## Capture Rules

- Use a local, preview, or demo environment with fake data only.
- Blur or omit emails, phone numbers, tokens, URLs with secrets, and database identifiers.
- Prefer deterministic demo data from onboarding sample data or local seed data.
- Capture desktop and at least one mobile viewport if the release announcement needs responsive evidence.
- Keep filenames stable so docs and release notes can link to them later.

## Storage

Put screenshots in:

```txt
docs/assets/v0.2/screenshots/
```

The screenshot folder contains its own README so the directory is tracked before real assets exist.

## Release Rule

Do not mark the release as screenshot-complete until real rendered screenshots are present and reviewed.
