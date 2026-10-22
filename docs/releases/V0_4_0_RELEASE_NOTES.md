# Pravaah v0.4.0 — Clinic Intelligence & Experience

**Release version:** v0.4.0  
**Release date:** October 21, 2026  
**Type:** Feature Release

## Overview

Pravaah v0.4.0 advances the platform from foundational clinic operations toward a more intelligent, explainable, and streamlined clinic management experience.

This release introduces improvements to appointment scheduling, queue management, patient history, no-show risk intelligence, staff administration, and operational UI/UX.

The no-show assistance system remains rule-based and advisory. Staff retain authority over all clinical scheduling and queue decisions.

## What's New

### 1. No-Show Risk Intelligence

- Clinic-level no-show risk intelligence dashboard.
- Risk distribution across upcoming appointments.
- Common contributing-risk-factor summaries.
- High-risk appointment review experience.
- Improved explanations and suggested staff actions.
- Reusable risk assessment dialogs for Appointments and Queue.

### 2. Appointments and Queue Experience

- Redesigned Appointments interface with more compact operational controls.
- Improved Queue page layouts and doctor lanes.
- More readable patient and risk information.
- Responsive risk assessment dialogs.
- Improved appointment lifecycle visibility.
- Appointment scheduling, rescheduling, availability, and status workflow enhancements.

### 3. Patient History and Location Intelligence

- Structured patient location foundation.
- Travel-distance context for no-show risk assessments.
- Patient attendance and arrival-history improvements.
- Improved historical appointment information and outcome handling.

### 4. Staff Management

- Improved staff invitation and onboarding workflows.
- Email-based staff invitations.
- Clinic-scoped staff access administration.
- Improved invitation handling and operational error states.

### 5. Explainable Prediction Foundation

- Versioned historical no-show prediction runs.
- Prediction refresh support.
- Appointment attendance outcomes linked to prediction history.
- Optional staff feedback on risk recommendations.
- Preserved rule-based scores, reasons, and prediction provenance.

## Technical Improvements

- Expanded Prisma schema and migrations.
- Stronger clinic-specific authorization and validation.
- Improved reusable frontend components.
- Additional backend and frontend regression tests.
- Improved handling of appointment and queue lifecycle state.

## Scope and Limitations

- No trained machine-learning prediction model is included.
- Risk scores are rule-based operational indicators, not calibrated no-show probabilities.
- Risk recommendations do not automatically change appointment or queue status.
- Patient and doctor login portals remain outside the release scope.
- Full electronic medical records, prescriptions, billing, and inventory remain out of scope.

## Next: Pravaah v0.5

The next development stage focuses on ML readiness, including privacy-safe training datasets, evaluation workflows, and future machine-learning experimentation.

The ML-ready dataset export introduced after the v0.4 release boundary is not included in the v0.4 source snapshot.

## Source

- Repository: https://github.com/garvitsingh171/pravaah
- Previous release: v0.3.0
- Release boundary: PR #286
- Release type: Stable source release, subject to release-gate verification

**Pravaah — Smarter Clinic Operations.**