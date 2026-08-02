# [Setup] Align backend lint with release gate expectations

**Suggested label:** `Setup`

## Overview

The root lint command runs workspace lint scripts, but the backend workspace lint script currently prints `server lint not configured yet`. Release documentation should not treat placeholder output as backend lint evidence.

## Tasks

- Decide whether backend lint should be configured for v0.3.
- If yes, add a focused backend lint configuration and command.
- If no, update release-check documentation so backend lint is explicitly described as not configured.
- Ensure release evidence distinguishes real checks from placeholders.

## Acceptance Criteria

- Backend lint status is unambiguous in scripts and docs.
- Release reviewers can tell whether backend lint actually ran.
- No dependency updates are included unless intentionally approved for lint setup.

## Notes

Source evidence:

- `apps/server/package.json`
- `package.json`
- `docs/guides/TESTING.md`
- `docs/guides/DEPLOYMENT.md`
