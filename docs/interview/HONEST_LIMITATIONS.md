# Honest limitations

Purpose: interview practice. Baseline `9e0714ef0952f6425c308faebe3ce870a1844182`; verified 2026-11-20. Status: `VERIFIED_FROM_CODE` for current behavior, `PLANNED` for design proposals.

| Claim                                                         | Evidence status                                     | Defensible answer                                                                            |
| ------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Booking, queue, onboarding and rule scoring in source         | VERIFIED_FROM_CODE                                  | Implemented; see routes, services and schema.                                                |
| v0.3 production release                                       | OWNER_VERIFICATION_REQUIRED for independent recheck | Owner-reported GO and smoke checks are recorded in release identity.                         |
| HEAD deployment and v0.4 production migration                 | UNKNOWN                                             | A source release note and committed migration do not establish a deployed SHA.               |
| Trained ML or calibrated probability                          | PLANNED                                             | Current score is deterministic rules; no validated model or accuracy claim.                  |
| Real clinic adoption, revenue, time savings                   | UNKNOWN                                             | Owner input required: Have any real clinics used the product, and is there written evidence? |
| Patient/doctor portals, billing, EHR, notification automation | OUT_OF_SCOPE                                        | Not part of current product.                                                                 |
| Browser E2E and backend lint                                  | INCOMPLETE                                          | Browser E2E absent; server lint script is a placeholder.                                     |
| Real-time queue push                                          | PLANNED                                             | Current route-based refresh is not a push channel.                                           |
| Thousands of clinics                                          | UNKNOWN                                             | No measured production load or tenancy-scale proof.                                          |

**Is it production ready for real clinics?** The repository has meaningful safeguards, but I would require privacy review, operating procedures, monitoring, backup and restore drills, E2E coverage, and clinic validation before making that claim. **What if a score is wrong?** It is advice only; staff control the workflow. Outcomes and feedback can support later evaluation. **Is it secure against every attack?** No such claim is supportable; review tenant authorization, logs, token lifecycle, rate limits and deployment config continuously.
