# Demo Guide

This guide is for a v0.2 release candidate demo. Use fictional data only.

## Demo Goal

Show that a new external user can move from public entry to a working clinic workspace without owner database intervention, then use the core Pravaah workflow.

```txt
Public landing
-> Clerk sign-up
-> onboarding status
-> clinic creation
-> optional sample data
-> dashboard
-> settings
-> doctor/patient edit
-> appointment
-> queue reorder
```

## Before The Demo

- Use a development, preview, or demo environment.
- Confirm no real patient data is present.
- Confirm Clerk keys and redirect URLs match the frontend origin.
- Confirm backend `CLIENT_URL` matches the frontend origin.
- Confirm `VITE_API_BASE_URL` ends with `/api`.
- Run or record the release checks from [v0.2 Release Notes](../releases/V0_2_0_RELEASE_NOTES.md).

## Script

1. Open the public frontend URL signed out.
2. Point out that Pravaah is clinic-side software for Admin and Staff users.
3. Open sign-up and create a Clerk account.
4. Let the app resolve onboarding status.
5. Create a clinic with a fictional name, slug, timezone, hours, and slot duration.
6. Choose whether to add sample data.
7. Reach the dashboard as the first active Admin.
8. Open clinic settings and update one harmless display field.
9. Open doctors and edit an existing doctor or create one first.
10. Open patients and edit an existing patient or create one first.
11. Book an appointment.
12. Open appointments and show the no-show risk explanation.
13. Open the queue, update a status, and manually reorder active entries.
14. Return to dashboard and show summary/high-risk/activity updates.

## Talking Points

- Clerk handles identity; Pravaah handles role, status, and clinic access.
- A signed-in user without an internal `User` is an onboarding state, not an operational role.
- Clinic plus first Admin creation is transactional to avoid orphan clinics.
- Sample data is fictional and scoped only to the new clinic.
- No-show scoring is deterministic, explainable, and advisory.
- Queue reordering is human-controlled.

## Screenshots To Capture

Capture real screenshots only after the app renders correctly in the target environment. Required shots are listed in [v0.2 Assets](../assets/v0.2/README.md).

## Demo Reset

For local or preview demos, use a fresh Clerk test user and a fresh test database when practical. Do not manually delete production records for a demo reset.

## What Not To Claim

- Do not claim doctors or patients can log in.
- Do not claim no-show scoring is trained ML.
- Do not claim production deployment is verified unless the owner has verified it.
- Do not show or commit real patient data.
