# Demo Fallbacks

Fallbacks must be honest. The goal is to show understanding and evidence, not to pretend the demo worked.

## Demo Failures

| Failure | What to do | What to say | Evidence to show instead | What not to say |
| --- | --- | --- | --- | --- |
| Deployment unavailable | Switch to local/code walkthrough. | The repo does not record production proof, so I will show implementation evidence. | `docs/guides/DEPLOYMENT.md`, `apps/web/vercel.json`, server scripts. | "It is definitely live." |
| Backend cold start | Wait briefly, then use health/API code. | The backend is not responding quickly; the route and startup path are here. | `server.ts`, `app.ts`, `/api/health` route. | "This never happens." |
| Database unavailable | Stop mutation demo and show transaction code/schema. | I cannot safely mutate without DB access; here is how the workflow persists data. | `schema.prisma`, repositories. | "The data was saved." |
| Clerk failure | Show auth code path. | Clerk is the identity provider; if it is unavailable, protected workflows cannot authenticate. | `ApiAuthProvider.tsx`, `auth.middleware.ts`. | "We can bypass auth." |
| Sample data missing | Create prerequisites or show seed/sample-data path. | Appointment booking requires active linked doctor and patient. | doctor/patient onboarding/sample data files. | "The app is broken." |
| Demo account unavailable | Use code and local setup docs. | I need a valid Clerk user mapped to an internal User. | setup guide, seed env vars, auth docs. | "Any account will work." |
| Browser/network failure | Use repository evidence. | I will continue with code-level proof and explain expected request/response. | workflow atlas and route files. | "Trust me, it works." |
| UI bug | Keep it visible, explain likely layer, then trace code. | This is a UI/demo issue; the backend path can still be inspected. | feature page, API helper, backend route. | "It is not a bug." |
| TypeScript compile error | Read the error and isolate file. | The compiler is pointing to a type mismatch; I will fix the type or explain the intended shape. | affected file and types. | "TypeScript is wrong." |
| Live coding failure | Summarize progress and next step. | I did not finish in time; here is the completed logic and remaining repository change. | partial code, tests needed. | "It is complete" when it is not. |
| Forgetting syntax | Write pseudocode and translate. | I know the logic; I am checking syntax/types to avoid guessing. | nearby repository pattern. | "I memorized the file." |
| Forgetting filename | Use `rg` and docs navigation. | I will search the repo rather than guessing. | `rg` output, docs index. | Invent a path. |

## JavaScript Works, TypeScript Does Not

Recovery procedure:

1. Explain the workflow logic.
2. Write simple pseudocode or JavaScript if allowed.
3. Identify required Pravaah types/enums from nearby files.
4. Convert one variable at a time.
5. State what TypeScript is protecting.

Professional phrasing:

```text
I am confident about the business logic. I am getting stuck on the TypeScript typing rather than the workflow itself. I would first express the logic clearly, then tighten it using the existing interfaces or Zod-inferred types.
```

## Unable To Finish

Use:

```text
I was not able to finish the full implementation in time. The request path and business rule are clear. I completed X; the remaining part is Y. I would complete it by adding the repository transaction, mapping expected errors, and adding tests for success plus conflict.
```

Pravaah example:

```text
For a stricter queue transition rule, I would add a transition map in queue service, reject invalid non-final reversals with AppError 409, keep the repository transaction unchanged, and add service tests for allowed and rejected transitions.
```
