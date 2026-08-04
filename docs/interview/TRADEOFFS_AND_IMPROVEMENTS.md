# Tradeoffs And Improvements

Authoritative current references: [Interview Guide](../INTERVIEW_GUIDE.md), [Product Requirements](../PRODUCT_REQUIREMENTS.md), and [High-Level Design](../HIGH_LEVEL_DESIGN.md).

## Good Tradeoffs

- `User.clinicId` keeps MVP authorization simple.
- Clerk avoids building authentication from scratch.
- Rule-based no-show scoring is honest and explainable.
- Feature modules keep backend code reviewable.
- Frontend feature folders keep UI, API helpers, and tests near workflows.
- Manual queue reorder respects staff judgment.

## Costs

- `User.clinicId` is not full multi-clinic SaaS membership.
- There is no patient or doctor portal.
- No-show risk is not trained ML.
- Deployment runbooks and monitoring are light.
- Backend linting is still a placeholder.
- Screenshots and deployed URLs still need owner verification.

## Strong Next Improvements

- add `ClinicMember` or `UserClinic` when multi-clinic access becomes real
- add audit logs for appointment and queue state changes
- add pagination and sorting for larger clinics
- add production monitoring and structured operational logging
- add OpenAPI generation or contract tests
- add notification/reminder workflows after audit and consent decisions

## What To Avoid

- adding patient/doctor login just to make the product sound larger
- calling deterministic scoring AI/ML
- adding a broad framework migration without product need
- weakening backend auth because the frontend hides routes
