# Mock interview playbook

Purpose: interview practice. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: `VERIFIED_FROM_CODE` for current behavior, `PLANNED` for design proposals.

Use a 0–3 rubric in every round: 0 inaccurate, 1 conceptual, 2 names code and invariant, 3 explains failure, evidence and limitation. If stuck, state the assumption, locate the route, and correct the answer from source.

| Round                    | Time      | Interviewer script and strong answer                                                          | Follow-up and weak answer                                           |
| ------------------------ | --------- | --------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| Recruiter and project    | 10–15 min | “What problem does Pravaah solve?” Explain post-booking clinic flow and honest product stage. | “What measured impact?” Weak: inventing customers or savings.       |
| Backend                  | 30–45 min | “Trace booking.” Route → Clerk/internal user → Zod → service → repository transaction.        | “What if queue insert fails?” Weak: separate writes.                |
| Database and concurrency | 30–45 min | “Two receptionists book one slot.” Explain advisory lock and interval recheck.                | “Why unique index too?” Weak: only check exact start.               |
| Full stack               | 30–45 min | “What happens after Save?” Explain API token, error and refresh state.                        | “What if server returns 409?” Weak: silent optimistic success.      |
| System design            | 45–60 min | Design multi-clinic booking, invariants, scope, locks, retry, monitoring.                     | “When add a queue?” Weak: architecture without load evidence.       |
| Code and screen share    | 20–30 min | Show onboarding, booking, queue, risk then open matching files.                               | “Demo unavailable?” Explain source-backed flow with fictional data. |

Recovery: pause, describe what you know, open [code trace](CODE_TRACE_INDEX.md), distinguish observed code from a proposed design, and state a verification test.
