# Code Organization

This guide documents the current Pravaah organization rules after the codebase consistency audit.
Use the existing code and package configuration as the immediate source of truth when it conflicts with older docs.

## Repository Structure

```txt
pravaah/
├── apps/
│   ├── server/        Express API, Prisma schema, migrations, seed
│   └── web/           React/Vite frontend
├── docs/              product, architecture, guides, scope, releases, interview, engineering, AI, assets
├── e2e/               Playwright tests spanning frontend, backend, Clerk, and database
├── packages/          reserved for future shared workspace packages
└── playwright.config.ts
```

Generated and vendor folders such as `dist/`, `node_modules/`, `playwright-report/`, and `test-results/` are not source organization targets.

Documentation folders are intentionally category-based:

```txt
docs/product/
docs/architecture/
docs/guides/
docs/scope/
docs/releases/
docs/interview/
docs/engineering/
docs/ai/
docs/assets/
```

Do not move docs back into a flat structure. Add new docs to the smallest category that matches their audience and maintenance owner.

## Backend Modules

Backend production modules live under:

```txt
apps/server/src/modules/<feature>/
```

Use this shape when the feature needs the corresponding layer:

```txt
<feature>.routes.ts
<feature>.validation.ts
<feature>.controller.ts
<feature>.service.ts
<feature>.repository.ts
<feature>.types.ts
__tests__/
```

Do not create empty layer files for symmetry. `health` is intentionally small, and `predictions` is intentionally service/types only because it is called by other workflows rather than exposed as a public router.

## Backend Test Structure

Backend module tests live in a feature-local `__tests__/` directory:

```txt
apps/server/src/modules/auth/
├── __tests__/
│   ├── auth.routes.test.ts
│   ├── auth.controller.test.ts
│   └── ...
├── auth.routes.ts
├── auth.controller.ts
└── ...
```

Rules:

- Keep module tests feature-local under `apps/server/src/modules/<feature>/__tests__/`.
- Preserve layer-identifying filenames such as `auth.service.test.ts`.
- Put reusable feature-only fixtures, mocks, or helpers under that feature's `__tests__/fixtures`, `__tests__/mocks`, or `__tests__/helpers` only when at least two test files use them.
- Put genuinely cross-feature backend testing helpers under `apps/server/src/test/` only when they are shared by multiple unrelated modules.
- Do not export test helpers from production modules or module indexes.
- Do not move production support code, such as clinic sample-data definitions, into test fixtures.

The server production build uses `apps/server/tsconfig.build.json`, which excludes `**/*.test.ts`, `**/*.spec.ts`, `**/__tests__/**`, `test/**`, and `tests/**`.

## Backend Layer Responsibilities

Routes:

- define HTTP methods and paths
- compose authentication, validation, access, role middleware, and controller handlers
- avoid Prisma calls, business branching, transaction work, and custom response construction

Validation:

- owns Zod schemas and schema-inferred input types
- validates params, query, and body
- avoids database access and authorization decisions

Controllers:

- read validated request data from `req.params`, `req.body`, and `res.locals.validatedQuery`
- call services
- translate service results to HTTP JSON responses
- pass errors to `next`

Services:

- own business rules, workflow orchestration, and expected `AppError`s
- coordinate authorization-sensitive decisions when middleware cannot know enough
- call repositories and transaction entry points
- avoid Express response handling and frontend concerns

Repositories:

- own Prisma reads, writes, selects, includes, raw SQL, locks, and transactions
- return structured persistence results to services
- avoid Express request/response objects and frontend formatting

## Frontend Features

Frontend source lives under:

```txt
apps/web/src/
├── app/
├── components/
├── features/
├── lib/
├── routes/
├── test/
└── types/
```

Feature folders should stay shallow unless a feature has enough files to justify deeper structure:

```txt
features/doctors/
├── DoctorsPage.tsx
├── DoctorsPage.test.tsx
├── DoctorCreatePage.tsx
├── DoctorForm.tsx
└── doctorApi.ts
```

Keep frontend tests close to the component, page, API module, or app shell they verify. Do not copy the backend `__tests__` rule into frontend features unless a future feature becomes large enough that a `tests/` folder clearly improves navigation.

## Shared Frontend Tests

Shared frontend testing support lives under:

```txt
apps/web/src/test/
├── fixtures/
├── mocks/
├── renderWithProviders.tsx
└── setup.ts
```

Use `fixtures/` for stable cross-feature fake data, `mocks/` for shared framework or provider mocks, and `renderWithProviders.tsx` for shared React render wrappers. Do not turn `src/test` into a dumping ground for feature-specific mock behavior.

The frontend app build excludes `src/**/*.test.ts`, `src/**/*.test.tsx`, and `src/test`. The frontend Vitest TypeScript config includes colocated tests and `src/test`.

## Root E2E Tests

Keep Playwright configuration at the repository root:

```txt
playwright.config.ts
e2e/
├── helpers/
├── setup/
└── *.spec.ts
```

E2E tests span Vite, Express, Clerk, and a dedicated test database, so they do not belong inside either workspace. Add deeper `e2e/specs`, `e2e/fixtures`, or `e2e/setup` structure only when file count justifies it.

## Naming

- Backend files use `<feature>.<layer>.ts` and `<feature>.<layer>.test.ts`.
- Frontend page/component files use PascalCase, such as `DoctorsPage.tsx`.
- Frontend feature API modules use camelCase with `Api`, such as `doctorApi.ts`.
- Controller functions should read like route handlers: `createDoctorController`.
- Services and repositories should use domain verbs: `createDoctor`, `createDoctorWithClinicLink`, `findClinicById`.
- Test names should describe behavior rather than implementation trivia.

## Imports

Backend:

- Preserve NodeNext-compatible `.js` import specifiers in TypeScript source.
- Use direct relative imports.
- Do not introduce path aliases only to shorten paths.
- Avoid importing from high-level module indexes inside the same backend module.

Frontend:

- Use the existing bundler-compatible relative imports.
- Feature API modules should call the shared `apiClient`.
- Keep endpoint construction inside feature API modules.
- Do not construct authorization headers manually in feature APIs.

## Types

- Keep feature-specific request/response/form types near the feature API or component that owns them.
- Keep stable cross-feature frontend concepts under `apps/web/src/types`.
- Keep backend validation-derived inputs in module `*.types.ts` or validation files.
- Do not create a shared package or duplicate backend types manually during small refactors.

## Fixtures And Mocks

- Keep fake data fake and non-sensitive.
- Prefer small fixture builders only when repeated data has the same semantic meaning across tests.
- Keep feature-specific mocks inside the feature's tests.
- Use shared mocks only for cross-feature framework/provider behavior.
- Reset mock state in tests that mutate it.
- Preserve `vi.hoisted()` when mocks depend on Vitest module initialization order.

## Barrel Files

Use barrel files only for a clear public boundary, such as shared frontend feedback components or library exports. Do not add barrels to every folder. Never re-export test helpers, repositories, or production internals only to shorten imports.

## When To Create A Subfolder

Create a subfolder when it contains multiple related files or one file with a clear current responsibility that the code already supports.

Good examples:

- `components`
- `feedback`
- `fixtures`
- `mocks`
- `helpers`
- `validation`
- `types`

Avoid vague names such as `common`, `misc`, `helpers2`, `new`, or `temp`.

## When Not To Create A Subfolder

Do not create folders for one-line helpers, empty future placeholders, cosmetic symmetry, or repeated syntax that does not represent shared responsibility.

## Adding A Backend Feature

1. Create `apps/server/src/modules/<feature>/`.
2. Add only needed route, validation, controller, service, repository, and types files.
3. Put business rules in the service and Prisma access in the repository.
4. Register the router in `apps/server/src/app.ts`.
5. Add tests under `apps/server/src/modules/<feature>/__tests__/`.
6. Add feature-local fixtures/mocks/helpers only when multiple tests share them.
7. Update API, workflow, testing, and organization docs when behavior or structure changes.

## Adding A Frontend Feature

1. Create or extend `apps/web/src/features/<feature>/`.
2. Keep pages, components, and feature API helpers close together while the feature is small.
3. Use the shared `apiClient` and shared feedback components.
4. Keep component/page tests colocated.
5. Move only genuinely shared fixtures/mocks/render helpers to `apps/web/src/test`.
6. Update routes and docs when user-visible routes or workflows change.

## Adding Tests

- Backend unit tests: `apps/server/src/modules/<feature>/__tests__/*.test.ts`.
- Frontend page/component/API tests: colocated with the source under `apps/web/src`.
- Shared frontend testing code: `apps/web/src/test`.
- E2E tests: root `e2e`.

## Common Anti-Patterns

- Moving tests into global folders that hide feature ownership.
- Creating empty `fixtures`, `mocks`, or `helpers` folders.
- Introducing barrels that hide dependency direction.
- Moving generated Prisma code.
- Moving E2E tests into a workspace.
- Sharing two similar snippets that do not mean the same thing.
- Exporting production internals solely for tests.
- Adding path aliases, frameworks, or broad formatting churn during an organization-only refactor.
