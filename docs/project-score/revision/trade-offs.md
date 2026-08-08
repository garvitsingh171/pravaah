# Trade-Offs Revision

| Decision | Why chosen | Benefit | Cost | Reconsider when |
| --- | --- | --- | --- | --- |
| PostgreSQL over MongoDB | Clinic workflow is relational. | FKs, joins, constraints, transactions. | Not evidence for Mongo concepts. | Document-heavy/search-heavy domain appears. |
| Prisma over raw SQL | Typed ORM and migrations. | Faster safe development. | Complex SQL/locks still need raw queries. | Query complexity dominates. |
| Clerk over custom auth | Avoid password/session risk. | Strong identity provider. | External config dependency; app still needs authz. | Custom identity requirements emerge. |
| Monorepo | One product with two apps. | Shared scripts and easier navigation. | No advanced build cache. | Many packages/services appear. |
| Join tables | Clinic-specific doctor/patient relationships. | Future-friendly and normalized. | More queries and explanation. | Scope proves one clinic forever. |
| Service/repository layers | Separate business rules from Prisma. | Easier testing and tracing. | More files. | Module becomes trivial. |
| Deterministic scoring | No validated ML dataset. | Explainable and honest. | Less adaptive than ML. | Real data and validation process exist. |
| Manual queue control | Staff stays responsible. | Safer operations. | More manual work. | Product wants automation with safeguards. |
| Limited E2E | Lower setup burden now. | Focus on unit/service/component tests. | Full browser flows manual. | Release risk increases. |
