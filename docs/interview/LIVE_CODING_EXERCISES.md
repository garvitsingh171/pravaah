# Live coding and SQL exercises

Purpose: practical interview rehearsal. Code baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: source-backed unless marked future. Audience: project owner.

These are educational sketches, not pasted production implementations. Use the cited module for the real contract.

## Exercise 1: Detect interval overlap

**Problem:** Given two start times, durations, and clinic buffer, return whether their effective half-open intervals intersect.

**Input/output and example:** Supply typed input; return a value or explicit validation error. [09:00,09:35) and [09:30,10:05) → true.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** return aStart < bEnd && bStart < aEnd; compute ends in epoch milliseconds.

**Explanation and complexity:** O(1) time and space. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 2: Generate doctor slots

**Problem:** Given availability periods, duration, buffer, booked visits, and step, return starts with no overlap.

**Input/output and example:** Supply typed input; return a value or explicit validation error. 09:00–10:00 with 30 minute visits → 09:00,09:30 when buffer 0.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** iterate candidates within periods; reject any intersecting booked effective interval.

**Explanation and complexity:** O(S × B) time. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 3: Evaluate risk score

**Problem:** Given attendance counts, distance and booking lead time, return score and reasons.

**Input/output and example:** Supply typed input; return a value or explicit validation error. no history, distance null, 72h → 10.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** apply the rules in prediction.service.ts then clamp to [0,100].

**Explanation and complexity:** O(1). Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 4: Zod booking body

**Problem:** Reject missing doctor/patient IDs, invalid date and duration.

**Input/output and example:** Supply typed input; return a value or explicit validation error. bad UUID → validation error.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** compose z.object with uuid, ISO date, bounded duration and strict fields.

**Explanation and complexity:** O(1). Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 5: Clinic-scoped query

**Problem:** Find patient through a clinic link without leaking another clinic.

**Input/output and example:** Supply typed input; return a value or explicit validation error. A querying B UUID → no authorized record.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** where patientId AND clinicId AND active link; check global and link state.

**Explanation and complexity:** O(log N) with useful index. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 6: Transactional booking

**Problem:** Create appointment, queue entry, activity and prediction without partial state.

**Input/output and example:** Supply typed input; return a value or explicit validation error. queue create fails → no appointment.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** Prisma interactive transaction; schedule lock and recheck before inserts.

**Explanation and complexity:** database dependent. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 7: Queue reorder validation

**Problem:** Validate exact active membership, same doctor and expected order.

**Input/output and example:** Supply typed input; return a value or explicit validation error. duplicate ID → reject.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** compare sets and lengths, then compare expected order under scope lock.

**Explanation and complexity:** O(N). Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 8: Offset pagination

**Problem:** Bound page size and return stable ordering.

**Input/output and example:** Supply typed input; return a value or explicit validation error. page 2, size 20 → skip 20.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** validate size, order by timestamp plus id, take size.

**Explanation and complexity:** O(N) offset cost. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 9: SQL high no-show patients

**Problem:** Group no-show visits per clinic patient.

**Input/output and example:** Supply typed input; return a value or explicit validation error. two missed visits → count 2.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** SELECT patientId, count(\*) FROM appointments WHERE clinicId=$1 AND status='NO_SHOW' GROUP BY patientId.

**Explanation and complexity:** O(N) scan or index. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 10: SQL doctor completions

**Problem:** Count completed visits by doctor in a clinic date range.

**Input/output and example:** Supply typed input; return a value or explicit validation error. one completed row → 1.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** SELECT doctorId,count(\*) FROM appointments WHERE clinicId=$1 AND status='COMPLETED' AND scheduledAt >= $2 AND scheduledAt < $3 GROUP BY doctorId.

**Explanation and complexity:** O(N) range. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 11: Find N+1

**Problem:** A list loads patient separately for each appointment.

**Input/output and example:** Supply typed input; return a value or explicit validation error. 100 rows → 101 queries.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** use Prisma include/select or one batched query and measure query count.

**Explanation and complexity:** O(N) data, fewer round trips. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 12: Status transition guard

**Problem:** Reject disallowed appointment status edges.

**Input/output and example:** Supply typed input; return a value or explicit validation error. terminal status → scheduled rejected.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** encode allowed edges in a map; check actor and current persisted state.

**Explanation and complexity:** O(1). Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 13: Race-condition test

**Problem:** Run two bookings for one doctor and interval.

**Input/output and example:** Supply typed input; return a value or explicit validation error. exactly one succeeds.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** Promise.all two real API calls against disposable PostgreSQL; assert one appointment and queue row.

**Explanation and complexity:** test dependent. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 14: Async Express error

**Problem:** Find a rejected promise that should reach global error handler.

**Input/output and example:** Supply typed input; return a value or explicit validation error. service rejects → 500 response.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** Express 5 async handler propagates rejection; map AppError in errorHandler.

**Explanation and complexity:** O(1). Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).

## Exercise 15: Idempotent retry

**Problem:** Design a future request key for booking retries.

**Input/output and example:** Supply typed input; return a value or explicit validation error. same key twice → same result.

**Constraints:** Use clinic scope, bounded inputs and UTC instants where relevant. No production data.

**Suggested solution:** persist clinic+key+request hash and result in transaction; reject hash mismatch.

**Explanation and complexity:** O(log N) lookup. Keep pure calculations separate from database writes.

**Edge cases and tests:** Empty input; duplicate or missing IDs; exact boundary; cross-clinic value; concurrent change where persistence is involved. Write one passing and one rejecting case, then a database-backed test if locking is central.

**Advanced follow-up:** How would you make this safe with multiple API processes and retries? Compare with [appointment scheduling](../../apps/server/src/modules/appointments/appointment.scheduling.ts) and [queue reorder](../../apps/server/src/modules/queues/queue.service.ts).
