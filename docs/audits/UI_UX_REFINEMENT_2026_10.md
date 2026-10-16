# UI/UX refinement audit — October 2026

Source of truth: `apps/web/src`, route configuration, current workflow docs, and v0.3 release notes. This audit covers the current React frontend. Backend and authorization behavior remain authoritative.

## Route inventory

| Area              | Routes                                                            | Existing workflow                                                                               |
| ----------------- | ----------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| Public and access | `/`, `/login`, `/sign-up`, `/invite/:token`, `/onboarding/clinic` | Marketing, Clerk access, invitation acceptance, clinic provisioning                             |
| Daily operations  | `/dashboard`, `/appointments`, `/queue`                           | Backend summaries and activity, booking and status, queue transitions and doctor-scoped reorder |
| Records           | `/doctors`, `/doctors/new`, `/patients`, `/patients/new`          | List, create, and edit                                                                          |
| Administration    | `/staff`, `/clinic-settings`, `/profile`                          | Admin team controls, Admin clinic settings, account context                                     |
| Fallback          | `*`                                                               | Not found                                                                                       |

The authenticated shell, feedback states, badge/status presentation, field controls, buttons, cards, confirmation dialogs, and risk explanation are shared components. The app already has responsive table scroll regions, a keyboard-managed mobile drawer, terminal-action confirmations, error/retry states, and reduced-motion handling.

## Prioritized findings

1. **Daily orientation:** The dashboard placed a large Operational Pulse before the four most useful counts. Booking was reachable only after another navigation step. It also displayed high-risk names without a direct explanation in that module.
2. **Scanning under pressure:** Appointment rows and queue cards used roomy padding and motion on hover. The appointment table exposed patient email in the main list, adding noise and unnecessary personal detail.
3. **Navigation hierarchy:** Authenticated navigation mixed operations, records, and Admin pages in one run of links. The top bar used decoration and a generic workspace label where clinic context was more useful.
4. **Public navigation:** The landing header used two rows even on desktop and kept section links fully expanded on mobile. The hero headline did not explicitly connect booking to consultation.
5. **Consistency:** Existing tokens and primitives are a good foundation, but dense forms and lists still vary in control height and spacing. The product preview uses fictional data; it must stay clearly labeled as illustrative until real authenticated screenshots are available.

The implementation groups daily and Admin navigation, leads the dashboard with backend counts and a booking action, trims appointment and queue rows, exposes the next supported appointment status action directly, makes risk reasons available from the dashboard, groups clinic settings fields, and removes repeated marketing sections. Shared field controls now have a consistent minimum height. The public showcase has balanced, readable panels and explicit illustrative labels.

The follow-up pass defers the authenticated shell and Motion from the public entry route. The initial production JS chunk decreased from 553.50 KB to 392.66 KB uncompressed (the remaining chunk includes shared dependencies such as Clerk). The appointment “Today” filter, queue date, and appointment and queue timestamps now use the clinic timezone. The mobile public menu restores focus to its trigger on Escape, and appointment dialogs now trap and restore focus, support Escape when safe, and announce errors.

## Scope and follow-up

This refinement keeps the current route model, Clerk flow, API calls, role checks, queue ordering, status transitions, and rule-based risk semantics. A complete screenshot-based product showcase needs authenticated capture of real app screens. Protected-route viewport, keyboard, and visual checks need a runnable Clerk and backend environment; automated frontend tests alone do not prove those checks.

The final web build, lint, and test commands passed (21 test files, 114 tests). The focused date tests cover clinic-day boundaries, a dialog test covers keyboard focus behavior, and a route test covers the deferred signed-out workspace boundary. A real signed-in clinic session is still needed to confirm protected workflows, visual states, and browser accessibility end to end.

## Visual evidence

The public landing page was captured from committed `HEAD` (`23c36ea`) before the edits and from the updated local Vite app after the edits, using headless Chrome at the same viewport sizes:

| Viewport   | Before                                                    | After                                                   |
| ---------- | --------------------------------------------------------- | ------------------------------------------------------- |
| 1440 × 900 | [Before](../assets/ui-refinement/landing-before-1440.png) | [After](../assets/ui-refinement/landing-after-1440.png) |
| 390 × 844  | [Before](../assets/ui-refinement/landing-before-390.png)  | [After](../assets/ui-refinement/landing-after-390.png)  |

The updated public page was also inspected at 1280, 1024, 768, and 360 pixels wide. These images show the initial viewport, not a full-page capture. Protected workflow screenshots were not captured because this local browser session was not authenticated into a clinic.

The [desktop product-section capture](../assets/ui-refinement/landing-product-after-1440.png) uses a taller 1440 × 2400 viewport to show the revised hero, workflow, and illustrative product panels together.
