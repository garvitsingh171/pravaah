# Architecture And Decisions

Authoritative current references: [High-Level Design](../HLD.md), [Product Requirements](../PRD.md), and [Interview Guide](../INTERVIEW_GUIDE.md). This file is a concise interview supplement.

## Architecture Summary

Pravaah is an npm workspace monorepo:

```txt
apps/web    React + TypeScript + Vite
apps/server Express + TypeScript + Prisma
docs        product, architecture, guides, release, interview, engineering docs
packages    reserved for future shared code
```

The frontend calls the backend API with Clerk session tokens. The backend verifies Clerk identity, loads the internal Pravaah `User`, checks role/status/clinic access, and then runs feature services against PostgreSQL through Prisma.

## Layering

Backend modules follow:

```txt
routes -> middleware -> controller -> service -> repository -> Prisma
```

Frontend features keep pages, forms, API helpers, tests, and types close to the workflow they support.

## Key Decisions

- React + Vite keeps the clinic app lightweight and deployable as static assets.
- Express keeps backend behavior explicit and easy to inspect.
- PostgreSQL fits relational clinic data and transactions.
- Prisma keeps schema and generated types aligned.
- Clerk handles identity, not product authorization.
- No-show scoring remains rule-based because there is no real training dataset.
- Queue decisions remain human-controlled.

## v0.2 Architecture Addition

The important v0.2 change is separating a valid Clerk identity from an authorized internal Pravaah user. That allows a new signed-up person to enter onboarding without letting them access operational clinic APIs.

```txt
Valid Clerk session
-> onboarding status
-> no internal user yet
-> clinic onboarding only
-> transactional clinic + first Admin
-> protected app access
```
