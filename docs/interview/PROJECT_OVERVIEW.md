# Project Overview

Authoritative current references: [Product Requirements](../PRD.md), [High-Level Design](../HLD.md), and [Interview Guide](INTERVIEW_GUIDE.md). Use those files first for status taxonomy, deployment boundaries, and traceability.

Pravaah is a clinic-side flow management project for small and medium clinics. It focuses on Admin and Staff workflows: clinic onboarding, doctor records, patient records, appointments, today's queue, dashboard activity, and starter no-show risk scoring.

## One-Minute Pitch

Pravaah helps a clinic move from scattered appointment notes to a structured daily workflow. A user can sign up, create a clinic, optionally add fictional demo data, manage doctors and patients, book appointments, track today's queue, and review explainable no-show risk. The system keeps identity in Clerk, authorization in the Pravaah database, and clinic data isolated by backend checks.

## What v0.2 Adds

- public landing and sign-up
- onboarding status for valid Clerk users without internal accounts
- transactional clinic plus first Admin provisioning
- optional fake sample data
- onboarding-aware protected routing
- functional clinic settings
- first-run checklist
- doctor edit
- patient edit
- manual queue reorder
- broader backend and frontend test coverage, with browser-based E2E testing deferred

## Product Boundary

Pravaah is not a hospital ERP. It intentionally does not include patient login, doctor login, billing, prescriptions, inventory, medical records, or communication automation.

The no-show scoring is a rule-based starter assistant, not trained ML.

## Core Spine

```txt
Public entry
-> Clerk identity
-> onboarding status
-> clinic/Admin bootstrap
-> active clinic context
-> doctor/patient records
-> appointment
-> queue
-> dashboard and no-show risk
```

## Best Demo Path

Use the flow in [Demo Guide](../guides/DEMO_GUIDE.md):

1. public page
2. sign-up
3. clinic onboarding
4. optional sample data
5. dashboard checklist
6. settings
7. doctor edit
8. patient edit
9. appointment
10. queue reorder

## Honest Release Status

The v0.2 implementation paths are present in the source tree. This documentation pass did not run tests, builds, deployment checks, migrations, or screenshot capture, so v0.2 remains a release candidate until the owner completes those gates.
