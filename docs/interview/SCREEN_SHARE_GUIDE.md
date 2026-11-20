# Screen Share Guide

Authoritative current references: [Interview Guide](INTERVIEW_GUIDE.md), [Product Requirements](../PRD.md), and [High-Level Design](../HLD.md). Use this guide for file order during a walkthrough.

## Order

1. Root README release status.
2. `apps/web/src/App.tsx` for route groups.
3. `apps/web/src/app/ProtectedAppShell.tsx` for onboarding-aware routing.
4. `apps/server/src/modules/auth` for onboarding status and clinic bootstrap.
5. `apps/server/prisma/schema.prisma` for models and constraints.
6. `apps/web/src/features/onboarding` for first-run UI.
7. `apps/web/src/features/queues` for manual reorder controls.
8. `docs/releases/V0_2_0_RELEASE_NOTES.md` for release gates.

## What To Highlight

- source code separates Clerk identity from internal authorization
- onboarding is narrow and explicit
- clinic plus Admin provisioning is transactional
- operational APIs remain protected
- edit and reorder workflows are present but still release-gated until tests run

## What Not To Show

- real secrets
- real patient data
- private Clerk dashboard values
- production database rows
- unverified deployment URLs as final release evidence

## Timed HEAD demo paths

Use fictional clinic **Riverbend Demo Clinic**, doctor **Dr. Mira Sen**, and patient **Asha Demo** in a disposable local or demo environment. Do not change a production database to prepare an interview.

| Time       | Starting screen and action                                                                      | Expected UI and source to open                                                                                                                                                | Recovery                                                                                                           |
| ---------- | ----------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| 5 minutes  | Start at dashboard; describe today's queue and a risk explanation.                              | Dashboard summary and risk reasons; `apps/web/src/features/dashboard/DashboardOverviewPage.tsx`, `apps/server/src/modules/dashboard/dashboard.routes.ts`, `NoShowPrediction`. | If API is down, show the same flow in the workflow atlas and source.                                               |
| 10 minutes | Add fictional patient, choose doctor, discover an available slot, book.                         | Appointment and queue row; `AppointmentBookingForm.tsx`, `appointmentApi.ts`, `appointment.routes.ts`, `Appointment` and `QueueEntry`.                                        | If Clerk or network fails, narrate the request and show route/controller/repository.                               |
| 15 minutes | Follow the 10-minute path, then change queue status and attempt a reorder.                      | Synchronized appointment state and doctor-scoped order; `QueuePage.tsx`, `queue.service.ts`, `queue.repository.ts`.                                                           | If reorder conflicts, explain stale snapshot and refresh; it is a correctness signal.                              |
| 30 minutes | Follow the 15-minute path, then demonstrate Admin staff invitation, risk history, and feedback. | Invitation email-submission state and prediction provenance; `staff.service.ts`, `prediction.service.ts`, `PredictionFeedback`.                                               | Do not claim email delivery from a submission state; use source and fictional screenshots if provider unavailable. |

For each action, ask: who is authenticated, which clinic owns the object, which route handles the request, what commits together, and what happens after a 409 or provider failure? Use [code trace index](CODE_TRACE_INDEX.md) to jump to the exact route. Public GitHub source links follow `https://github.com/garvitsingh171/pravaah/blob/9e0714ef0952f6425c308faebe3ce870a1844182/<path>`; check the remote before a live interview.
