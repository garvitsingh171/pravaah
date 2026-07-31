# Testing And Deployment

## Test Strategy

Backend tests focus on services, validation, middleware, repositories, onboarding, authorization, and critical workflow behavior.

Frontend tests use Vitest, jsdom, React Testing Library, Clerk mocks, and feature API mocks to check UI states without network calls.

Playwright E2E tests cover browser flows that matter for v0.2: public routing, Clerk sign-up, onboarding, sample data, edit workflows, queue reorder, and smoke paths.

## Commands To Know

```bash
npm run test:server
npm run test:web
npm run test:e2e
npm run build:server
npm run build:web
npm run check
```

For docs-only changes:

```bash
npx prettier --check README.md "docs/**/*.md"
```

## Deployment Shape

- Frontend: static Vite build, commonly Vercel.
- Backend: Node/Express service, commonly Render.
- Database: PostgreSQL, commonly Neon.
- Auth: Clerk.

## Render Build Fix

The backend production build uses `tsconfig.build.json` and excludes tests from emitted output. After building, this should produce no results:

```bash
find apps/server/dist -type f \( -name "*.test.js" -o -name "*.spec.js" \)
```

## Release Honesty

For the current docs task, tests/build/deployment were not run. Say the release is a candidate until the owner verifies the checklist in [v0.2 Release Notes](../releases/V0_2_0_RELEASE_NOTES.md).
