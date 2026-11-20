# Scenario interview pack

Purpose: practical interview rehearsal. Code baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: source-backed unless marked future. Audience: project owner.

Each prompt is an exercise. Implemented behavior is cited; design extensions are hypothetical.

## Simulation 1: Two receptionists book one doctor at the same time

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** serialize doctor/date schedule scope; recheck duration-plus-buffer overlap inside the transaction; one request gets conflict. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** SELECT then INSERT outside a lock allows both to pass.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 2: Two users reorder a queue from stale snapshots

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`queues/queue.service.ts`](../../apps/server/src/modules/queues/queue.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** compare expected membership and order under doctor/date queue lock; return 409 and refresh. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** last writer wins silently loses an operator decision.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 3: Appointment insert succeeds but queue insert fails

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** roll back the booking transaction; verify neither row persists. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** two unrelated writes leave an orphan appointment.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 4: Clinic A supplies Clinic B patient UUID

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`patients/patient.service.ts`](../../apps/server/src/modules/patients/patient.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** check clinic link and object ownership before returning or changing data. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** valid UUID is not authorization.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 5: Signup succeeds but dashboard rejects user

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`auth/auth.routes.ts`](../../apps/server/src/modules/auth/auth.routes.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** distinguish Clerk identity from internal User; inspect onboarding status and recovery. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** creating a dashboard session from Clerk identity alone bypasses provisioning.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 6: Staff invitation is accepted twice

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`staff/staff.service.ts`](../../apps/server/src/modules/staff/staff.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** consume pending token once in a transaction; second acceptance returns conflict or completed state as implemented. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** blind insert may create duplicate membership.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 7: Admin attempts to change own role

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** reject role mutation and retain server-owned role fields. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** trusting request body permits privilege changes.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 8: Reschedule races destination booking

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** lock destination schedule and recheck interval inside transaction. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** checking available slots earlier does not reserve them.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 9: Refresh crashes after prediction write

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`predictions/prediction.recalculation.service.ts`](../../apps/server/src/modules/predictions/prediction.recalculation.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** make work acknowledgement and run identity safe under retry; inspect revision and latest run. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** assuming exactly-once process execution loses work.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 10: First-time patient gets a risk score

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`predictions/prediction.service.ts`](../../apps/server/src/modules/predictions/prediction.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** explain new-patient +10, timing, distance, and clamp; unknown distance adds zero. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** calling the score a learned probability.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 11: 500 doctors and thousands of daily visits

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** measure list query plans, indexes, lock waits and pagination before redesign. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** adding Redis without a measured bottleneck.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 12: Backend outage during reception

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`app.ts`](../../apps/server/src/app.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** show honest error, avoid duplicate retry writes, restore from persisted state. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** offline UI that silently claims successful booking.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 13: Shared doctor edit affects another clinic

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`doctors/doctor.service.ts`](../../apps/server/src/modules/doctors/doctor.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** check link authorization and global-vs-clinic field ownership. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** assuming clinic-scoped list implies safe global edit.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 14: Address changes while geocoding runs

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`integrations/geoapify/geoapify.client.ts`](../../apps/server/src/integrations/geoapify/geoapify.client.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** associate attempts with current address revision and ignore stale completion. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** last response wins regardless of address version.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 15: Clinic requests legacy-software integration

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`app.ts`](../../apps/server/src/app.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** define data owner, identifiers, consent, reconciliation and phased import; mark as future. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** claiming an existing integration.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 16: Patient is marked no-show after arrival

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.lifecycle.ts`](../../apps/server/src/modules/appointments/appointment.lifecycle.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** check transition graph and persisted arrival evidence; reject invalid terminal change. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** writing status without lifecycle validation.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 17: Queue status and appointment status diverge

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`queues/queue.repository.ts`](../../apps/server/src/modules/queues/queue.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** trace synchronized transaction and restore from authoritative records. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** patching one table manually.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 18: Rate-limit storage is unavailable

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`middleware/rateLimit.ts`](../../apps/server/src/middleware/rateLimit.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** inspect current fail behavior and alert; keep abuse and availability trade-off explicit. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** claiming limiter always protects every request.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 19: Invitation email provider times out

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`services/email/email.service.ts`](../../apps/server/src/services/email/email.service.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** inspect submission state; retry with token rotation rules and no raw link exposure. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** assuming timeout proves delivery failure.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 20: Doctor availability changes during booking

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** recheck availability and membership under transaction lock. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** relying only on earlier UI slot discovery.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 21: Patient soft-deactivated during booking

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** lock and recheck active clinic and patient memberships. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** trusting previous page load.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 22: Dashboard totals look wrong at midnight

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`dashboard/dashboard.repository.ts`](../../apps/server/src/modules/dashboard/dashboard.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** check clinic timezone date range and status filters. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** using server-local date for every clinic.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 23: Prediction disagrees with historical run

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`predictions/prediction.service.ts`](../../apps/server/src/modules/predictions/prediction.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** compare immutable feature snapshot and rule version; do not rewrite old history. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** recomputing history with new rules.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 24: Cross-clinic queue reorder payload

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`queues/queue.service.ts`](../../apps/server/src/modules/queues/queue.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** reject entries outside requested clinic and doctor/date scope. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** valid entry IDs imply allowed reorder.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 25: API returns a 500 after invalid body

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`utils/validateRequest.ts`](../../apps/server/src/utils/validateRequest.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** trace validation and error handler; separate expected 4xx from actual server fault. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** log patient payloads to debug.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 26: Production migration did not apply

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`config/prisma.ts`](../../apps/server/src/config/prisma.ts). Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** compare migration history with deployment evidence; stop assuming schema matches code. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** treating committed SQL as applied SQL.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 27: Receptionist double-clicks booking

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`appointments/appointment.repository.ts`](../../apps/server/src/modules/appointments/appointment.repository.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** explain conflict behavior and future idempotency-key option. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** assuming rate limiting is idempotency.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 28: A prediction is falsely high

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`predictions/prediction.service.ts`](../../apps/server/src/modules/predictions/prediction.service.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** show factors and staff override; record outcome and feedback for evaluation. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** automatically canceling the visit.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 29: Clinic asks for live queue updates

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`queues/queue.routes.ts`](../../apps/server/src/modules/queues/queue.routes.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** separate current refresh-based UI from future push and ordering protocol. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** calling polling real-time synchronization.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.

## Simulation 30: New clinic wants seven staff accounts

**Interviewer prompt:** Walk through the request, the conflicting event, the invariant, and the recovery visible to staff.

**Assumptions and information:** Use fictional clinic data. The affected module is [`staff/staff.routes.ts`](../../apps/server/src/modules/staff/staff.routes.ts) and related tests. Confirm exact response codes in controller/tests before asserting them.

**Requirements and invariant:** Keep clinic authorization, durable state, and operator-visible truth consistent. Identify who owns the operation and which data must commit together.

**Strong reasoning and correct approach:** plan invitation, identity matching, role checks and revoked-token handling. Trace route → middleware → service → repository → Prisma/PostgreSQL. State when a transaction begins and what is rechecked after a lock.

**Incorrect approach:** sharing an Admin login.

**Edge cases:** Retry after timeout, stale UI data, another clinic's identifier, and a concurrent status change. State which cases current code covers and which need a new test.

**Verification:** Unit-test rules, then use a migrated disposable PostgreSQL database for a concurrent two-request test where database locking matters. Inspect both responses and final rows; a mocked transaction alone does not prove isolation.

**Follow-ups:** What should the frontend show? Would an idempotency key help? What changes with two API instances?

**Assessment:** 0 = vague CRUD answer; 1 = identifies invariant; 2 = locates code and transaction; 3 = handles conflict, retry, authorization, and verification without claiming unverified deployment.
