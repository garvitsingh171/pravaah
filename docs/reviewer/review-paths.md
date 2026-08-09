# Reviewer Paths

Use these paths to inspect Pravaah without wandering through every document first.

## Five-Minute Review

Goal: understand the product, current status, main architecture, strongest workflow, and limitations.

1. Read the opening of [Reviewer Package](README.md).
2. Check the canonical [Project Status](project-status.md).
3. Skim the [System Architecture](../diagrams/REVIEWER_DIAGRAMS.md#system-architecture) diagram.
4. Read the [Appointment and queue](project-status.md#workflow-notes) notes.
5. Open [Known Limitations](known-limitations.md).
6. Review the screenshot state in [Screenshot And Asset Audit](screenshots.md).

## Fifteen-Minute Review

Goal: understand the product and the most important technical decisions.

1. Read [Reviewer Package](README.md).
2. Read [Project Status](project-status.md).
3. Read [Technical Evidence Map](technical-evidence-map.md) for path-level evidence.
4. Read the auth sections in [Auth And Security](../architecture/AUTH_AND_SECURITY.md) and [Authentication Workflow](../workflows/authentication-and-user-resolution.md).
5. Read [Appointment Management](../workflows/appointment-management.md).
6. Read [Queue Management](../workflows/queue-management.md).
7. Read [No-Show Risk Assistance](../workflows/no-show-risk-assistance.md).
8. Read [Known Limitations](known-limitations.md).
9. Skim [Short Portfolio Case Study](../case-study/portfolio.md).

## Deep Technical Review

Goal: verify architecture, code paths, data model, tests, and release readiness.

1. [PRD](../PRD.md)
2. [HLD](../HLD.md)
3. [LLD](../LLD.md)
4. [Workflow Atlas](../workflows/README.md)
5. [Workflow Implementation Audit](../workflows/implementation-audit.md)
6. [Project Score Pack](../project-score/README.md)
7. [Technical Evidence Map](technical-evidence-map.md)
8. [Prisma schema](../../apps/server/prisma/schema.prisma)
9. [Database Design](../architecture/DATABASE_DESIGN.md)
10. [API Reference](../architecture/API_REFERENCE.md)
11. [Testing Guide](../guides/TESTING.md)
12. [Release Identity](../releases/RELEASE_IDENTITY.md)
13. [v0.2 Release Notes](../releases/V0_2_0_RELEASE_NOTES.md)
14. [Release Checklist](../releases/RELEASE_CHECKLIST.md)
15. [Reviewer Demo Guide](demo-guide.md)

## How To Report Mismatches

If code, docs, screenshots, or deployment disagree, treat source code and deployment evidence as higher priority than presentation docs. File a docs or product follow-up and include:

- document path and conflicting statement
- code or deployment evidence checked
- expected correction
- whether the mismatch affects release status
