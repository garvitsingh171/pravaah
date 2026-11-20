# Product and business interview

Purpose: interview practice. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: `VERIFIED_FROM_CODE` for current behavior, `PLANNED` for design proposals.

Pravaah connects clinic-side booking, arrival, queue, and operational risk review. The paying customer hypothesis is a clinic owner who values less reception rework and better visibility. No customer, revenue, or savings claim is verified by source.

**Why pay beyond basic booking?** Staff can manage the post-booking flow, including arrival and queue status, with one operational view. Validate this with clinic interviews and workflow observation.

**How to measure impact:** Let `N` be monthly appointments, `m` minutes saved per appointment, and `c` staff cost per hour. Hypothetical monthly labor value is `N × m / 60 × c`. At 1,000 visits, 2 minutes, and ₹200/hour, the formula yields about ₹6,667; the inputs are assumptions, not observed results. Track no-show rate with comparable cohorts, case mix and seasonality before attributing change to software.

**Pricing hypothesis:** Test per-clinic subscription tiers against willingness to pay, staff count, and support cost; do not assert a market price without interviews. Trial should allow a fictional-data demo and low-friction setup while protecting patient information.

**Adoption barriers:** migration from existing tools, staff training, trust, patient privacy, and network reliability. An integration proposal needs data ownership, consent, identifier mapping, conflict rules and a reversible import.

**First five clinics:** Seek discovery interviews, shadow reception with permission, run a narrow pilot, measure task completion and error rate, then ask whether the clinic would continue or pay. Owner input required: What real user interviews or pilots have occurred?
