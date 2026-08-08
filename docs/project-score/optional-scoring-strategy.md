# Optional Scoring Strategy

This is internal preparation prioritization, not an official Project Score formula.

## Internal Model

Rate each candidate from 1 to 5:

| Factor | Meaning |
| --- | --- |
| Evidence strength | How strong the repository proof is. |
| Explanation confidence | How ready the owner is to explain it. |
| Demonstration reliability | How reliably it can be shown live. |
| Product relevance | Whether Pravaah genuinely needs it. |
| Assessment value | Likely value if the official rubric confirms it. |
| Distinctiveness | Whether it makes Pravaah stand out. |
| Preparation effort | Lower effort is better. |
| Implementation effort | Lower effort is better. |
| Follow-up risk | Lower risk is better. |

Do not call the sum an official score.

## Internal Ranking

| Concept | Category | Evidence | Explanation | Demo | Relevance | Value | Distinctive | Prep effort | Impl effort | Follow-up risk | Internal priority |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | --- |
| Clinic-scoped authorization | `PRESENT_CONFIDENTLY` | 5 | 4 | 4 | 5 | 5 | 4 | 2 | 1 | 3 | Very high |
| Appointment transaction | `PRESENT_CONFIDENTLY` | 5 | 4 | 4 | 5 | 5 | 5 | 3 | 1 | 3 | Very high |
| Queue reorder concurrency | `PRESENT_CONFIDENTLY` | 4 | 3 | 3 | 5 | 5 | 5 | 4 | 1 | 4 | Very high |
| Deterministic risk assistance | `PRESENT_CONFIDENTLY` | 5 | 4 | 5 | 5 | 4 | 5 | 2 | 1 | 3 | Very high |
| Zod validation and errors | `PRESENT_CONFIDENTLY` | 5 | 5 | 4 | 5 | 4 | 3 | 1 | 1 | 2 | High |
| Relational join-table design | `PRESENT_CONFIDENTLY` | 5 | 4 | 4 | 5 | 4 | 4 | 2 | 1 | 3 | High |
| Loading/error UI states | `PRESENT_CONFIDENTLY` | 4 | 4 | 4 | 4 | 3 | 2 | 1 | 1 | 2 | Medium |
| Tests | `PREPARE_BEFORE_PRESENTING` | 4 | 3 | 3 | 4 | 4 | 2 | 2 | 1 | 3 | Medium |
| Deployment | `PREPARE_BEFORE_PRESENTING` | 2 | 3 | 1 | 4 | 4 | 2 | 3 | 2 | 4 | Do after evidence |
| Browser E2E | `DO_NOT_CLAIM_YET` | 1 | 3 | 1 | 4 | 3 | 2 | 4 | 4 | 5 | Do not claim |

## Recommended Optional Set

Present these first:

1. Role-based authorization and clinic isolation.
2. Transactions for appointment creation and queue synchronization.
3. Prisma/PostgreSQL relational modeling and indexes.
4. Explainable deterministic no-show assistance.
5. Zod validation plus structured errors.

Hold back until evidence is recorded:

- deployment maturity
- current passing test output
- responsive/a11y metrics
- E2E testing
- monitoring/security hardening
