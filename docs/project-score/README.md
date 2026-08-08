# Project Score Preparation Pack

| Field | Value |
| --- | --- |
| Issue | #234 |
| Status | Complete preparation pack, repository-evidence based |
| Last reviewed | 2026-08-08 |
| Evidence basis | Repository inspection of docs, frontend, backend, Prisma schema/migrations, tests, deployment config, and workflow atlas |
| Official rubric status | `NEEDS_REVIEW`: the repo contains an existing 63-concept Project Score tracker, but no separate committed official rubric/source file was found |

This folder helps the project owner prove what Pravaah actually demonstrates, choose optional concepts conservatively, prepare viva answers, rehearse screen-share workflows, and recover honestly when a demo or live-coding task fails.

Pravaah-specific claims must come from repository evidence. The [Workflow Atlas](../workflows/README.md) is the main workflow traceability source; this pack links to it instead of duplicating every trace.

## Status Vocabulary

Evidence statuses:

| Status | Meaning |
| --- | --- |
| `STRONG_EVIDENCE` | Implementation exists, appears in a meaningful workflow, has exact code evidence, and can be explained or demonstrated. |
| `PARTIAL_EVIDENCE` | Some implementation exists, but coverage, behavior, testing, release proof, or demo reliability is incomplete. |
| `DOCUMENTATION_ONLY` | The concept is documented, but matching implementation was not verified. |
| `PLANNED` | The concept is intentionally future work. |
| `NOT_APPLICABLE` | The concept truly does not fit the current Pravaah product boundary. |
| `NEEDS_REVIEW` | Official mapping or repository evidence is ambiguous. |

Product statuses:

| Status | Meaning |
| --- | --- |
| `IMPLEMENTED_AND_DEPLOYED` | Code and deployment evidence are both recorded. |
| `IMPLEMENTED_NOT_RELEASED` | Code exists, but release/deployment proof is missing. |
| `IN_DEVELOPMENT` | Implementation exists but known gaps remain. |
| `PLANNED` | Future scope, not implemented now. |

Confidence is tracked separately from evidence. A feature can have `STRONG_EVIDENCE` but `LOW` explanation confidence if the owner has not practised it.

## Official Scoring Boundary

The existing repository contains [Concept Tracker](CONCEPT_TRACKER.md), which asserts 63 concepts, 25 mandatory concepts, a 4.6 mandatory score, and a 6.0 threshold. No separate official assessment PDF, rubric file, or assessor guidance file was found in this repo during this pass.

Use those concept IDs as the repository-available Project Score map, but treat official provenance as `NEEDS_REVIEW` until the project owner verifies the source. This pack does not invent official weights and does not turn internal prioritization into official marks.

## Navigation

| Area | Purpose | Document |
| --- | --- | --- |
| Evidence index | Central proof map and audit sources | [Evidence Index](evidence-index.md) |
| Mandatory concepts | Required concept evidence and answers | [Mandatory Concept Evidence](mandatory-concept-evidence.md) |
| Mandatory gaps | Mandatory risks and remediation actions | [Mandatory Gap Register](mandatory-gap-register.md) |
| Optional concepts | Conservative optional inventory | [Optional Concept Evidence](optional-concept-evidence.md) |
| Optional strategy | Internal prioritization only | [Optional Scoring Strategy](optional-scoring-strategy.md) |
| Priority board | What to practise or fix first | [Preparation Priority Board](preparation-priority-board.md) |
| Viva bank | Foundation through deep questions | [Viva Question Bank](viva-question-bank.md) |
| Workflow packs | Workflow-specific interview answers | [Workflow Interview Packs](workflow-interview-packs.md) |
| Appointment demo | Appointment screen-share runbook | [Appointment Runbook](screen-share/appointment.md) |
| Queue demo | Queue screen-share runbook | [Queue Runbook](screen-share/queue.md) |
| Auth demo | Auth/authorization screen-share runbook | [Auth Runbook](screen-share/authentication-authorization.md) |
| ER demo | Database and ER explanation | [Database ER Runbook](screen-share/database-er-diagram.md) |
| Code writing | Live coding exercises | [Code Writing Simulations](simulations/code-writing.md) |
| Debugging | Failure diagnosis practice | [Debugging Simulations](simulations/debugging.md) |
| Demo fallbacks | Professional recovery scripts | [Demo Fallbacks](simulations/demo-fallbacks.md) |
| Revision | Final compressed prep sheets | [Revision Folder](revision/project-one-page.md) |
| AI assistance | Honest contribution and AI-use answers | [AI Assistance Revision](revision/ai-assistance.md) |

## Source Relationship

```text
PRD
  -> product intent and capability boundaries
HLD
  -> architecture and major system decisions
LLD
  -> implementation structure
Workflow Atlas
  -> exact product-action traces through code
Project Score Pack
  -> assessment evidence, explanations, demonstrations, gaps, and viva practice
Interview Docs
  -> broader interview narrative and presentation support
Reviewer Docs
  -> evaluator navigation and release-readiness context
```

## How To Use This Pack

1. Read [Evidence Index](evidence-index.md) to understand what was verified.
2. Study [Mandatory Concept Evidence](mandatory-concept-evidence.md) and do not claim concepts marked `PARTIAL_EVIDENCE`, `NEEDS_REVIEW`, or `NOT_APPLICABLE` as fully demonstrated.
3. Use [Mandatory Gap Register](mandatory-gap-register.md) to separate study, implementation, documentation, demo, test, and release gaps.
4. Practise only the strongest optional concepts first using [Optional Scoring Strategy](optional-scoring-strategy.md).
5. Rehearse screen-share paths from the runbooks, with the workflow atlas open for code traces.
6. Use the revision sheets in the final hour.

## Strongest Pravaah Story

Lead with the product and the implementation spine:

```text
small-clinic flow problem
  -> Clerk-authenticated Admin/Staff users
  -> backend clinic authorization
  -> doctor/patient clinic relationships
  -> appointment transaction
  -> queue entry and manual queue operations
  -> deterministic no-show risk assistance
  -> dashboard and operational review
```

Avoid unsupported claims: no trained ML, no patient/doctor login, no verified production URLs in repo, no browser E2E suite, no MongoDB, no LLM integration, no automatic queue optimization.
