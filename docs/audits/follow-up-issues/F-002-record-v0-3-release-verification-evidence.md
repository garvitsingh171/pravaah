# [Test] Record v0.3 release verification evidence

**Suggested label:** `Test`

## Overview

The route audit could not establish release readiness because local runtime, production runtime, fresh automated test output, build output, screenshots, and smoke-test evidence were not available.

## Tasks

- Run the approved automated test commands in a safe environment.
- Run frontend and backend production builds.
- Record production frontend and backend URLs when available.
- Complete public, authentication, onboarding, protected app, appointment, queue, and health smoke checks.
- Capture safe screenshots or short recordings using fictional data only.
- Link evidence from the v0.3 release docs.

## Acceptance Criteria

- Test results are recorded with command names and outcomes.
- Build results are recorded with command names and outcomes.
- Production smoke checks are recorded with URLs redacted only where necessary.
- Evidence uses no secrets, private credentials, real patient data, or unsafe screenshots.

## Notes

Source evidence:

- `docs/audits/V0.3_ROUTE_RELEASE_AUDIT.md`
- `docs/releases/V0.3_RELEASE_CHARTER.md`
- `docs/guides/TESTING.md`
- `docs/guides/DEPLOYMENT.md`
