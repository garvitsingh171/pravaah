# Mandatory Gap Register

This register tracks mandatory concepts from the repository-available Project Score map that are not safely `STRONG_EVIDENCE` in Pravaah.

## Gap Summary

| Concept                      | Current evidence                                         | Evidence status    | Risk                                                                                | Missing evidence                                          | Priority   | Recommended action                                                              |
| ---------------------------- | -------------------------------------------------------- | ------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------- |
| PS-020 Mongo schema modeling | No MongoDB files, dependencies, or workflows.            | `NOT_APPLICABLE`   | Mandatory concept cannot be cleared through Pravaah if official rubric confirms it. | Real Mongo schema in a legitimate separate repository.    | Priority 0 | Verify official rubric; prepare another repo instead of adding fake Mongo code. |
| PS-021 Mongo CRUD            | No Mongo CRUD.                                           | `NOT_APPLICABLE`   | Same as PS-020.                                                                     | Real Mongo create/read/update/delete evidence.            | Priority 0 | Use another legitimate project if required.                                     |
| PS-038 LLM API integration   | No LLM SDK, env var, prompt, request, or response.       | `NOT_APPLICABLE`   | Mandatory AI concept cannot be cleared through current Pravaah.                     | Real LLM API integration elsewhere.                       | Priority 0 | Do not rebrand deterministic scoring as LLM.                                    |
| PS-039 Prompt engineering    | No prompts.                                              | `NOT_APPLICABLE`   | Cannot answer with product evidence.                                                | Real prompt design and evaluation evidence.               | Priority 0 | Prepare honest gap answer or another repo.                                      |
| PS-040 Structured outputs    | JSON API responses exist, but no LLM structured outputs. | `NOT_APPLICABLE`   | Assessor may reject generic JSON as AI structured output.                           | LLM structured output evidence.                           | Priority 0 | Do not claim through Pravaah.                                                   |
| PS-048 Git workflow          | Local templates and contribution docs exist.             | `PARTIAL_EVIDENCE` | Local repo cannot prove PR/review/check history alone.                              | PR links, branch history, review comments, check outputs. | Priority 1 | Owner records real GitHub workflow evidence.                                    |
| PS-059 Event loop            | Async code exists.                                       | `PARTIAL_EVIDENCE` | Requires language explanation beyond product code.                                  | A practised event-loop simulation.                        | Priority 1 | Practise call stack, microtask, macrotask example.                              |
| PS-062 Closures              | Handlers/factories use closures.                         | `PARTIAL_EVIDENCE` | Explanation may sound vague without a small example.                                | Dedicated closure explanation.                            | Priority 1 | Practise `createApiClient` closure and stale React closure.                     |
| PS-063 Hoisting              | TypeScript modules contain declarations.                 | `PARTIAL_EVIDENCE` | Weak product evidence; likely language viva.                                        | Standalone hoisting snippet.                              | Priority 1 | Practise `var` vs `let/const` vs function declaration.                          |

## Gap Types

| Gap type           | Pravaah examples                                                                             |
| ------------------ | -------------------------------------------------------------------------------------------- |
| Knowledge gap      | Event loop, closures, hoisting need personal explanation practice.                           |
| Implementation gap | MongoDB and LLM concepts are absent by product choice.                                       |
| Documentation gap  | Official rubric provenance is not independently recorded in the repo.                        |
| Demonstration gap  | Deployment URLs, screenshots, and browser E2E evidence are missing.                          |
| Testing gap        | Test files exist, but this pass did not record current passing output; no browser E2E suite. |
| Release gap        | `v0.2.0` remains release candidate; production verification is owner-controlled.             |

## Product Implementation Gaps That May Affect Mandatory Explanations

| Area                  | Current evidence                                                                   | Risk                                                          | Action                                                     |
| --------------------- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------- | ---------------------------------------------------------- |
| Appointment lifecycle | Final statuses protected, but broad non-final transitions remain accepted.         | Do not claim full state-machine enforcement.                  | Explain honestly; implement strict transition graph later. |
| Queue lifecycle       | Final queue statuses protected, but non-final reversals are not fully blocked.     | Do not claim perfect lifecycle validation.                    | Explain current boundary; use follow-up issue.             |
| Patient active filter | `Patient.isActive` filtering exists; `PatientClinic.isActive` filter gap recorded. | Active/inactive explanation can become inaccurate.            | Mention link-aware filter gap if asked.                    |
| Backend lint          | Server `lint` script is placeholder.                                               | Do not claim full lint gate.                                  | Configure backend lint later.                              |
| Deployment            | Docs/config exist; live URLs and deployed SHAs missing.                            | Do not claim deployed production unless owner provides proof. | Record deployment evidence.                                |

## Recommended Interview Framing

When a gap appears, say what exists, what does not, and what you would do next. Example:

```text
Pravaah does not use MongoDB because the clinic workflow is relational and benefits from PostgreSQL constraints. If MongoDB is mandatory for Project Score, I would demonstrate it with a separate real Mongo project rather than adding unused Mongo code here.
```
