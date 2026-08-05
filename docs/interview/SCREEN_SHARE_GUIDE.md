# Screen Share Guide

Authoritative current references: [Interview Guide](INTERVIEW_GUIDE.md), [Product Requirements](../PRD.md), and [High-Level Design](../HLD.md). Use this guide for file order during a walkthrough.

## Order

1. Root README release status.
2. `apps/web/src/App.tsx` for route groups.
3. `apps/web/src/app/ProtectedAppShell.tsx` for onboarding-aware routing.
4. `apps/server/src/modules/auth` for onboarding status and clinic bootstrap.
5. `apps/server/prisma/schema.prisma` for models and constraints.
6. `apps/web/src/features/onboarding` for first-run UI.
7. `apps/web/src/features/queues` for manual reorder controls.
8. `docs/releases/V0_2_0_RELEASE_NOTES.md` for release gates.

## What To Highlight

- source code separates Clerk identity from internal authorization
- onboarding is narrow and explicit
- clinic plus Admin provisioning is transactional
- operational APIs remain protected
- edit and reorder workflows are present but still release-gated until tests run

## What Not To Show

- real secrets
- real patient data
- private Clerk dashboard values
- production database rows
- unverified deployment URLs as final release evidence
