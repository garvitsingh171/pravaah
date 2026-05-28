# TypeScript Backend Folder Strategy

## Overview

This document finalizes the backend folder architecture and TypeScript project structure for Pravaah.

The goal of this structure is to keep the backend scalable, maintainable, and easy to understand as the project grows. It defines where controllers, services, repositories, routes, middleware, validators, configs, utilities, and error-handling files should live.

This structure is designed for MVP development while still being clean enough to support future scaling.

---

## Final Decision

Pravaah will use a **feature-based modular backend architecture** with a clear controller-service-repository pattern.

The chosen approach is:

```txt
Feature-based modular architecture
+
Controller-Service-Repository pattern
```

This means each major backend feature will have its own module folder.

Example modules:

```txt
auth
users
projects
tasks
documents
ai
notifications
```

Each module can contain its own:

```txt
routes
controller
service
repository
validation
types
```

---

## Why Feature-Based Architecture?

A simple folder-by-file-type structure may look clean at first:

```txt
controllers/
services/
routes/
validators/
repositories/
```

But as the project grows, one feature becomes spread across many folders.

For example, a `projects` feature would be split like this:

```txt
controllers/project.controller.ts
services/project.service.ts
routes/project.routes.ts
repositories/project.repository.ts
validators/project.validation.ts
```

This becomes harder to maintain when the backend has many features.

Instead, Pravaah will keep related files together:

```txt
modules/projects/
  project.routes.ts
  project.controller.ts
  project.service.ts
  project.repository.ts
  project.validation.ts
  project.types.ts
```

This makes each feature easier to understand, update, test, and review.

---

## Final Backend Folder Tree

```txt
backend/
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── src/
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   └── cors.ts
│   │
│   ├── lib/
│   │   ├── prisma.ts
│   │   └── supabase.ts
│   │
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── users/
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.validation.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── projects/
│   │   │   ├── project.routes.ts
│   │   │   ├── project.controller.ts
│   │   │   ├── project.service.ts
│   │   │   ├── project.repository.ts
│   │   │   ├── project.validation.ts
│   │   │   └── project.types.ts
│   │   │
│   │   └── tasks/
│   │       ├── task.routes.ts
│   │       ├── task.controller.ts
│   │       ├── task.service.ts
│   │       ├── task.repository.ts
│   │       ├── task.validation.ts
│   │       └── task.types.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validate.middleware.ts
│   │   └── notFound.middleware.ts
│   │
│   ├── errors/
│   │   ├── ApiError.ts
│   │   └── errorCodes.ts
│   │
│   ├── utils/
│   │   ├── asyncHandler.ts
│   │   ├── response.ts
│   │   └── logger.ts
│   │
│   ├── types/
│   │   ├── express.d.ts
│   │   └── common.types.ts
│   │
│   └── routes/
│       └── index.ts
│
├── .env.example
├── package.json
├── tsconfig.json
└── README.md
```

---

## Folder Responsibilities

### `backend/prisma/`

This folder contains Prisma database files.

Responsibilities:

- Store `schema.prisma`
- Store generated migration files
- Track database schema changes
- Keep database structure version-controlled

Prisma schema should be the source of truth for application database tables.

---

### `src/server.ts`

This file starts the backend server.

Responsibilities:

- Import the configured Express app
- Read the port from environment config
- Start listening for requests

It should mainly contain `app.listen(...)`. This file should stay small and should not contain route logic, database logic, or business logic.

---

### `src/app.ts`

This file creates and configures the Express application.

Responsibilities:

- Initialize Express
- Add global middleware
- Add CORS
- Add JSON body parsing
- Register API routes
- Register not-found middleware
- Register global error middleware

This file should not contain feature-specific business logic.

---

### `src/config/`

This folder stores configuration files.

Responsibilities:

- Environment variable loading and validation
- CORS configuration
- Database-related configuration
- App-level settings

```txt
config/ decides settings.
lib/ creates usable clients.
```

Do not put random helper functions or business logic inside `config/`.

---

### `src/lib/`

This folder stores initialized external clients and reusable library instances.

Responsibilities:

- Create and export Prisma client
- Create and export Supabase client
- Initialize external SDKs if needed later

Repository files should import Prisma client from `lib/prisma.ts`. Auth-related services can import Supabase client from `lib/supabase.ts`.

---

### `src/modules/`

This is the main feature folder of the backend. Each major feature gets its own module.

A typical module can include:

```txt
feature.routes.ts
feature.controller.ts
feature.service.ts
feature.repository.ts
feature.validation.ts
feature.types.ts
```

Not every module must have every file. For example, the `auth` module may not need a repository if it mainly talks to Supabase Auth.

---

## Module File Responsibilities

### `*.routes.ts`

Routes define API endpoints.

- Define endpoint paths
- Attach middleware and validation middleware
- Connect endpoints to controller functions

Routes should not contain business logic or database queries.

---

### `*.controller.ts`

Controllers handle the HTTP layer.

- Read request data, route params, and query params
- Call the correct service function
- Send the response

Controllers should not directly query the database.

```ts
// Bad
const project = await prisma.project.create({ data: req.body });

// Good
const project = await projectService.createProject(userId, req.body);
```

> **Rule:** Controller = request and response handling

---

### `*.service.ts`

Services contain business logic.

- Apply business rules
- Check permissions and ownership
- Prepare data before database operations
- Coordinate multiple repository calls

> **Rule:** Service = business logic

---

### `*.repository.ts`

Repositories contain database queries.

- Read, write, update, and delete database records
- Keep Prisma queries separated from business logic

```ts
const project = await prisma.project.create({ data });
```

> **Rule:** Repository = database access only

Repositories should not know about HTTP requests or responses.

---

### `*.validation.ts`

Validation files contain request validation schemas.

- Validate request body, route params, and query params
- Keep input rules close to the feature

The validation schema lives inside the module. The reusable validation middleware lives inside `src/middlewares/validate.middleware.ts`.

```txt
feature.validation.ts    → validation schema
validate.middleware.ts   → applies schema to request
```

---

### `*.types.ts`

Type files contain feature-specific TypeScript types.

- Define feature-specific request/response types
- Define enums or union types used only in that module

If a type is shared across the whole backend, it should go inside `src/types/`.

---

## Request Flow

```txt
Request
  ↓
Route
  ↓
Middleware
  ↓
Validation
  ↓
Controller
  ↓
Service
  ↓
Repository
  ↓
Database
  ↓
Repository
  ↓
Service
  ↓
Controller
  ↓
Response
```

**Example — POST /projects:**

```txt
project.routes.ts
  ↓ auth.middleware.ts
  ↓ validate.middleware.ts
  ↓ project.controller.ts
  ↓ project.service.ts
  ↓ project.repository.ts
  ↓ Supabase PostgreSQL through Prisma
```

---

## Controller-Service-Repository Pattern

```txt
Routes       = API path definitions
Controllers  = HTTP request/response layer
Services     = business logic layer
Repositories = database access layer
Validation   = input checking
Middleware   = shared request processing
```

---

## Middleware Placement

Shared middleware goes inside `src/middlewares/`:

- `auth.middleware.ts` — authentication checks
- `validate.middleware.ts` — request validation
- `error.middleware.ts` — global error handling
- `notFound.middleware.ts` — 404 handling

```txt
Checking whether user is logged in    → middleware
Checking whether user owns a project  → service
```

Do not put feature-specific business rules inside global middleware.

---

## Validation Strategy

Pravaah will use **Zod** for validation.

Reasons:

- Works natively with TypeScript
- Can infer types from schemas
- Good developer experience
- Clear validation error messages

---

## Error Handling Strategy

```txt
src/errors/              → custom error definitions (ApiError.ts, errorCodes.ts)
src/middlewares/error.middleware.ts  → global Express error handler
src/utils/asyncHandler.ts           → wraps async controllers, avoids repeated try/catch
```

**Error flow:**

```txt
Controller or service throws ApiError
  ↓ asyncHandler catches it
  ↓ error.middleware.ts formats response
  ↓ Client receives consistent error response
```

---

## Utility Folder Strategy

Shared utility functions go inside `src/utils/`.

Good examples:

- `asyncHandler.ts` — async controller wrapper
- `response.ts` — response formatter
- `logger.ts` — logger helper

Bad examples (these belong inside their module):

- `createProject` helper
- `checkProjectOwner` helper

> **Rule:** If it belongs to one feature, keep it in that module. If it's reused across the backend, put it in `utils/`.

---

## Types Folder Strategy

Global shared types go inside `src/types/`.

- `express.d.ts` — Express request extensions
- `common.types.ts` — shared response/pagination/auth types

Feature-specific types stay inside their module:

```txt
ProjectRole  → modules/projects/project.types.ts
TaskStatus   → modules/tasks/task.types.ts
AuthenticatedRequest → src/types/express.d.ts
```

---

## Routes Index Strategy

`src/routes/index.ts` combines all module routes, keeping `app.ts` clean.

```txt
app.ts
  ↓ routes/index.ts
  ↓ modules/auth/auth.routes.ts
  ↓ modules/projects/project.routes.ts
  ...
```

---

## Configuration Strategy

### `env.ts`

- Load and validate environment variables
- Export a safe config object

### `cors.ts`

- Define allowed frontend origins
- Configure credentials

### `database.ts`

- Store database-related configuration centrally

Secrets should always be loaded from environment variables — never hardcoded.

---

## Library Client Strategy

### `lib/prisma.ts`

- Initialize and export a single Prisma Client instance
- Avoid creating multiple Prisma clients across the app

### `lib/supabase.ts`

- Initialize Supabase client for Auth/admin operations
- Keep Supabase setup separate from business logic

---

## Naming Conventions

```txt
feature.routes.ts
feature.controller.ts
feature.service.ts
feature.repository.ts
feature.validation.ts
feature.types.ts
```

Folder names use **plural** domain names for resources (`users`, `projects`, `tasks`). For auth, singular is acceptable (`auth`).

---

## What Not To Do

- Do not put database queries inside controllers
- Do not put HTTP request/response logic inside services
- Do not put business rules inside repositories
- Do not put feature-specific logic inside global utilities
- Do not create large files that handle many unrelated features
- Do not hardcode secrets or environment values in source code

---

## Example Module Template

Every new feature starts with this structure:

```txt
modules/feature-name/
  feature.routes.ts
  feature.controller.ts
  feature.service.ts
  feature.repository.ts
  feature.validation.ts
  feature.types.ts
```

---

## Scaling Strategy

This structure supports scaling because:

- Each feature is isolated in its own module
- New developers can understand one feature at a time
- Controllers, services, and repositories have clear responsibilities
- Database access stays separated from HTTP logic
- Validation rules remain close to the feature

New modules can be added without disturbing existing modules.

---

## Future Improvements (Post-MVP)

- Unit tests for services
- Integration tests for routes
- Role-based authorization helpers
- Request logging middleware
- API versioning
- OpenAPI/Swagger documentation
- Shared constants folder
- Background job structure

These should not be added too early.

---

## MVP Folder Strategy Rules

1. Keep each feature inside `src/modules/`
2. Use controller-service-repository separation
3. Keep Prisma queries inside repository files
4. Keep request/response handling inside controller files
5. Keep business logic inside service files
6. Keep validation schemas inside module validation files
7. Keep reusable middleware inside `src/middlewares/`
8. Keep external clients inside `src/lib/`
9. Keep environment and app configuration inside `src/config/`
10. Keep shared utilities inside `src/utils/`
11. Keep global types inside `src/types/`
12. Avoid over-engineering before the MVP is stable

---

## Final Decision Summary

Pravaah will use a **feature-based modular TypeScript backend architecture**.

The backend is organized around modules (`auth`, `users`, `projects`, `tasks`), each containing its own routes, controller, service, repository, validation, and type files.

A **controller-service-repository pattern** keeps HTTP handling, business logic, and database access clearly separated — practical for MVP development and ready to scale as Pravaah grows.
