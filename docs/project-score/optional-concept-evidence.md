# Optional Concept Evidence

Optional concepts should be selected only when they are relevant, evidenced, understandable, demonstrable, and defensible under follow-up questions.

Categories:

- `PRESENT_CONFIDENTLY`
- `PREPARE_BEFORE_PRESENTING`
- `USE_ONLY_IF_ASKED`
- `DO_NOT_CLAIM_YET`
- `FUTURE_IMPROVEMENT`

## Recommended Optional Shortlist

| Concept | Category | Evidence strength | Demo reliability | Follow-up risk | Evidence |
| --- | --- | --- | --- | --- | --- |
| Request body validation with Zod | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | High | Low | `validateRequest.ts`, `appointment.validation.ts`, `queue.validation.ts`, validation tests. |
| Role-based authorization | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | Medium | Medium | `access.service.ts`, `auth.middleware.ts`, clinic route Admin-only checks, access tests. |
| Prisma ORM usage | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | High | Low | `schema.prisma`, repositories, migrations. |
| Transactions | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | Medium | Medium | Appointment creation transaction, queue status sync/reorder transactions, onboarding transaction. |
| PostgreSQL indexes and constraints | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | Medium | Medium | `@@index`, `@@unique`, active doctor slot unique migration. |
| Explainable deterministic risk assistance | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | High | Medium | `prediction.service.ts`, `NoShowPrediction`, risk UI. Must say not trained ML. |
| Responsible AI boundaries | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | High | Medium | PRD/HLD/content docs plus deterministic scoring code and human-controlled queue UI. |
| Loading, empty, error, success UI states | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | Medium | Low | `LoadingState`, `EmptyState`, `ErrorMessage`, `ToastProvider`, feature page states/tests. |
| Form handling and validation feedback | `PRESENT_CONFIDENTLY` | `STRONG_EVIDENCE` | High | Low | `DoctorForm`, `PatientForm`, `AppointmentBookingForm`, `FieldError`, backend validation. |
| Unit/component/service tests | `PREPARE_BEFORE_PRESENTING` | `STRONG_EVIDENCE` for files, `PARTIAL_EVIDENCE` for current pass output | Medium | Medium | Test files exist; run output not recorded in this docs pass. |
| Responsive layout | `PREPARE_BEFORE_PRESENTING` | `PARTIAL_EVIDENCE` | Medium | Medium | Tailwind responsive classes and responsive audit; runtime screenshots pending. |
| Frontend deployment | `PREPARE_BEFORE_PRESENTING` | `PARTIAL_EVIDENCE` | Low until URL verified | Medium | `apps/web/vercel.json`, deployment guide; no live URL in repo. |
| Backend deployment | `PREPARE_BEFORE_PRESENTING` | `PARTIAL_EVIDENCE` | Low until URL verified | Medium | server start/build scripts, deployment guide; no live URL in repo. |
| API/integration tests | `USE_ONLY_IF_ASKED` | `PARTIAL_EVIDENCE` | Medium | Medium | Controller/service tests exist; no full deployed integration smoke recorded. |
| SEO/metadata | `USE_ONLY_IF_ASKED` | `PARTIAL_EVIDENCE` | Medium | Medium | `RouteMetadata.tsx`, `siteMetadata.ts`, sitemap/robots; SPA limitation. |
| Accessibility | `USE_ONLY_IF_ASKED` | `PARTIAL_EVIDENCE` | Medium | Medium | Labeled controls/tests, but no current Lighthouse/accessibility score recorded. |
| Performance optimization | `USE_ONLY_IF_ASKED` | `PARTIAL_EVIDENCE` | Low | Medium | Lazy routes and Vite build; no measured metrics. |
| Rate limiting/security hardening | `DO_NOT_CLAIM_YET` | `PLANNED` | Low | High | No rate-limit middleware found. |
| Browser E2E testing | `DO_NOT_CLAIM_YET` | `PLANNED` | Low | High | Testing guide says E2E deferred. |
| Monitoring/observability | `DO_NOT_CLAIM_YET` | `PLANNED` | Low | High | No Sentry/log aggregation/metrics code found. |
| Redis/WebSockets/scheduled jobs/payments | `DO_NOT_CLAIM_YET` | `NOT_APPLICABLE` | Low | High | No implementation. |
| Trained ML, LLM, RAG, agents | `DO_NOT_CLAIM_YET` | `NOT_APPLICABLE` | Low | High | Current no-show assistance is deterministic rules. |

## Strongest Optional Talking Points

1. Transactions and race-condition mitigation in appointment/queue workflows.
2. Clinic-scoped backend authorization after Clerk authentication.
3. Relational modeling with join tables.
4. Explainable deterministic risk assistance with human-controlled decisions.
5. Structured request validation and error envelopes.

## Conservative Rule

If a concept needs a live deployment, current command output, screenshots, or external provider configuration, present it only after the owner records that evidence.
