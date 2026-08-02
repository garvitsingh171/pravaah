# Pravaah Visual System

| Field            | Value                                                                                                                                      |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| Issue            | #211                                                                                                                                       |
| Status           | Documentation foundation                                                                                                                   |
| Last reviewed    | 2026-08-02                                                                                                                                 |
| Evidence basis   | Source inspection of `apps/web/src`, `apps/web/src/index.css`, `apps/web/tailwind.config.js`, route audit, and existing product docs.      |
| Implementation   | Current app uses Tailwind utility classes directly; the approved v0.3 tokens below are not yet centralized in Tailwind or CSS variables.   |
| Release boundary | This document is guidance for v0.3 consistency. It does not redesign screens, add components, or prove that every standard is implemented. |

## Purpose

The visual system exists to make Pravaah consistent, professional, workflow-focused, easy to scan, usable by clinic staff, responsive, accessible, and easy to review or demonstrate.

It is not a new component library, a complete redesign implementation, a hospital ERP design language, a decorative AI-dashboard style, or permission to add excessive animation, glass effects, or gradients.

## Product Design Principles

### Operational Clarity

The most important workflow information must be easy to find: appointment time, patient, doctor, queue position, status, risk level, action availability, and error state.

### Calm Presentation

The interface should feel reliable rather than visually noisy. Use restrained colour, predictable spacing, and clear sections. Avoid decorative effects that compete with clinic work.

### Human-Controlled Assistance

No-show risk must look advisory. It may draw attention, but it must not appear to make medical or operational decisions automatically.

### Consistency

Similar records, actions, statuses, and errors should look and behave similarly across dashboard, doctors, patients, appointments, queue, onboarding, and settings.

### Responsive Usefulness

Mobile and tablet layouts must preserve task completion, not merely shrink desktop screens. Forms, filters, queue controls, and status actions must remain usable.

### Accessible By Default

Colour, focus, keyboard interaction, labels, status text, and errors must be understandable without relying on colour alone.

### Honest Product Presentation

Visual design must not imply patient login, doctor login, trained ML, automatic queue optimization, medical prediction, or hospital ERP scope.

## Current Visual Implementation

| Area                | Current evidence                                                                                          | Notes                                                                                     |
| ------------------- | --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| Styling system      | Tailwind CSS with empty `theme.extend`.                                                                   | No centralized design tokens yet.                                                         |
| Global font         | `Inter, system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif`.                            | Inter is referenced as first preference but no font package or hosted font is configured. |
| App background      | Mostly `bg-slate-50`; root CSS uses `#f9fafb`.                                                            | Approved background token is close but not identical.                                     |
| Text colours        | Mostly `text-slate-900`, `text-slate-700`, `text-slate-600`, `text-slate-500`.                            | Body token below uses slate-like text.                                                    |
| Primary action      | Many current buttons and focus states use Tailwind blue, such as `bg-blue-600`.                           | v0.3 standard approves teal for primary action; migration would need implementation work. |
| Surfaces            | White cards/forms with `border-slate-200` and `rounded-lg`.                                               | Consistent enough to standardize.                                                         |
| Radius              | `rounded-md`, `rounded-lg`, and `rounded-full` are common.                                                | Cards should stay at 8px or less unless a special pill/badge is intentional.              |
| Shadows             | Mostly none or subtle `shadow-sm`/`shadow-lg` for toasts.                                                 | Keep elevation quiet.                                                                     |
| Semantic states     | Red errors, emerald success, amber queue/warning, sky/indigo/cyan/violet appointment status.              | Continue using text labels plus colour.                                                   |
| Responsive patterns | `sm`, `md`, and grid/flex stacking are common.                                                            | Runtime viewport checks are still required.                                               |
| Accessibility       | Many forms use labels, `aria-invalid`, `aria-describedby`, `role=status`, `role=alert`, and focus styles. | No WCAG certification or full keyboard audit has been completed.                          |

## Approved Colour Foundation

These approved v0.3 colours define the intended foundation. Current code does not yet expose them as named tokens.

| Token      | Value     | Intended role                              |
| ---------- | --------- | ------------------------------------------ |
| Navy       | `#0F172A` | Primary brand, navigation, strong headings |
| Teal       | `#14B8A6` | Primary action, active state, emphasis     |
| Background | `#F8FAFC` | Main application background                |
| White      | `#FFFFFF` | Cards, forms, elevated surfaces            |
| Text       | `#475569` | Standard body text                         |
| Border     | `#E2E8F0` | Borders, dividers, field outlines          |

### Token Rules

| Token      | Primary use                             | Supporting use                              | Acceptable text combinations                                           | Do not use for                                      | Contrast and interaction expectations                                                 |
| ---------- | --------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Navy       | Brand text, strong headings, active nav | Dense table headings and app-shell identity | White on navy, navy on white/background                                | Error/success meaning or large dark panels          | Must meet contrast for navigation and headings. Hover may deepen or add soft surface. |
| Teal       | Primary actions and active emphasis     | Selected controls, focus accents, key links | White text on solid teal; teal text on white only when contrast passes | Risk severity, destructive actions, disabled states | Must be semantic for action/emphasis, not decoration. Hover may use a darker teal.    |
| Background | Page and app-shell background           | Empty-state page fields                     | Navy or Text on background                                             | Cards/forms that need clear boundaries              | Keep contrast between background and white cards visible.                             |
| White      | Cards, forms, popovers, dialogs, toasts | Table bodies and elevated rows              | Navy/Text on white                                                     | Full-page glare without background structure        | Pair with Border and spacing, not heavy shadows.                                      |
| Text       | Body copy, helper text, descriptions    | Secondary metadata                          | Text on White or Background                                            | Primary brand headlines when Navy is clearer        | Avoid low-contrast small text; use darker slate for dense content.                    |
| Border     | Dividers, inputs, cards, tables         | Dashed empty states and separators          | Not a text colour                                                      | Critical status communication                       | Focus and error states must override the neutral border.                              |

### Semantic Tokens

Semantic colours should be named by meaning, not hue:

| Semantic token | Current-ish Tailwind evidence                  | Intended use                                                 |
| -------------- | ---------------------------------------------- | ------------------------------------------------------------ |
| `success`      | `emerald-*`                                    | Completed actions, saved state, positive completion.         |
| `warning`      | `amber-*`                                      | Attention needed, queue waiting, medium operational caution. |
| `danger`       | `red-*`                                        | Validation errors, destructive actions, failed operations.   |
| `information`  | `blue-*`, `sky-*`, `cyan-*`, `indigo-*`        | Informational statuses and guidance.                         |
| `neutral`      | `slate-*`                                      | Disabled, inactive, cancelled, secondary metadata.           |
| `focus`        | current blue focus rings; v0.3 should use teal | Keyboard focus and active control outlines.                  |
| `disabled`     | `slate-100`, `slate-300`, `slate-500`          | Disabled controls and unavailable actions.                   |

Semantic colours are not decorative. They must be paired with text or icon labels.

## Light And Dark Appearance

No active dark-mode implementation was found in `apps/web/src/index.css`, `apps/web/tailwind.config.js`, or the inspected route components.

v0.3 visual documentation is light-mode-first. Do not invent a complete dark theme in implementation or screenshots without a separate issue. Future dark-mode support should begin by centralizing semantic tokens so status and risk colours can be adapted safely.

## Typography

Current implementation relies on the global font stack and Tailwind font sizes. Do not add a new font package unless a separate approved implementation issue requires it.

| Level           | Intended use                                | Approximate size | Weight         | Line height        | Mobile behavior                                                 |
| --------------- | ------------------------------------------- | ---------------- | -------------- | ------------------ | --------------------------------------------------------------- |
| Display/hero    | Public landing headline only                | 36-48px          | Bold           | Tight but readable | May reduce to 30-36px; keep line breaks natural.                |
| Page heading    | Main route heading                          | 28-32px          | Bold           | 1.2-1.3            | Use 24-30px; avoid wrapping over controls.                      |
| Section heading | Major card/section title                    | 20-24px          | Semibold/Bold  | 1.3                | Use 18-20px in compact surfaces.                                |
| Card heading    | Record/card title                           | 16-18px          | Semibold       | 1.35               | Wrap long names; do not truncate critical patient/doctor names. |
| Body text       | Descriptions and operational copy           | 14-16px          | Regular        | 1.5-1.7            | Keep readable; avoid tiny body copy.                            |
| Secondary text  | Metadata and helper details                 | 12-14px          | Regular/Medium | 1.4-1.6            | Avoid low contrast.                                             |
| Labels          | Form and filter labels                      | 14px             | Medium         | 1.4                | Always visible; placeholders do not replace labels.             |
| Helper text     | Field guidance                              | 12-14px          | Regular        | 1.4-1.6            | Wrap below fields.                                              |
| Table text      | Dense record comparison                     | 13-14px          | Regular/Medium | 1.4                | Tables may scroll or convert to cards.                          |
| Button text     | Action labels                               | 14px             | Semibold       | 1.2-1.4            | Use short descriptive labels; allow wrapping if needed.         |
| Metric text     | Dashboard numbers                           | 24-32px          | Bold           | 1.1-1.2            | Keep labels close and visible.                                  |
| Technical/code  | Routes, error codes, env names, enum values | 12-14px          | Monospace      | 1.4                | Wrap long URLs/endpoints in docs and debug surfaces.            |

Readable line length should normally stay below 70-80 characters for long explanatory text. Use title case for page titles and sentence case for helper/error copy. Avoid uppercase except small metadata labels, enum names in technical docs, and short badges. Align numeric metrics and queue positions consistently. Long clinic, doctor, and patient names must wrap without overlapping actions.

## Spacing And Layout

Use Tailwind's existing scale rather than arbitrary values.

| Area                   | Standard                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------- |
| Mobile gutters         | `px-4`                                                                                                  |
| Tablet/desktop gutters | `md:px-6`, with wider internal page sections only when needed.                                          |
| Page maximum width     | Use constrained content for forms and public copy; operational dashboards may use full available width. |
| Page header spacing    | 16-24px gap between heading, supporting text, and actions.                                              |
| Section spacing        | `space-y-4` to `space-y-6` for operational pages.                                                       |
| Card padding           | `p-4` mobile, `p-6` or `md:p-8` for large forms.                                                        |
| Form spacing           | `gap-4`/`gap-5`, `space-y-5`/`space-y-6`.                                                               |
| Field spacing          | Label, then 8px top margin to control, then compact helper/error text.                                  |
| Table density          | Compact headers, 16-20px cell padding where records need scanning.                                      |
| Dialog padding         | 20-24px mobile, 24-32px desktop if dialogs are introduced.                                              |
| Button groups          | `gap-3`, stack on small screens when labels are long.                                                   |
| Dashboard grids        | Responsive grid from one column to multi-column at `md`/`lg`.                                           |

Desktop should prioritize scan density and side navigation. Tablet should preserve form completion and readable cards. Mobile should stack sections, keep touch targets large, and avoid horizontal overflow except deliberate table scrolling.

## Borders, Radii And Elevation

| Element         | Standard                                                                    |
| --------------- | --------------------------------------------------------------------------- |
| Default border  | `1px` neutral Border / current `border-slate-200`.                          |
| Strong border   | Use for selected, warning, or active states with semantic colour.           |
| Input border    | Neutral by default, focus token on focus, danger token on validation error. |
| Card radius     | 8px or less; current `rounded-lg` is acceptable.                            |
| Button radius   | 6-8px; pills only for badges or compact metadata.                           |
| Dialog radius   | 8px unless a future component standard says otherwise.                      |
| Subtle shadow   | `shadow-sm` only for small separation when border is insufficient.          |
| Elevated shadow | Reserve for toasts/popovers/dialogs; avoid heavy dashboard shadows.         |
| Focus ring      | Visible 2px outline/ring with offset.                                       |
| Selected state  | Combine surface colour, border/ring, and text; do not rely on colour alone. |
| Disabled state  | Lower contrast, blocked cursor, no hover affordance, still readable.        |

## Component Standards

Use these standards for components that exist or are natural for current product workflows. Components not currently active are marked as future standards and require implementation before being claimed.

| Component                  | Purpose and variants                                                  | State and accessibility requirements                                                           | Mobile/content guidance                                                                | Status                                   |
| -------------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------- |
| Button                     | Primary, secondary, tertiary, destructive, inline.                    | Hover, focus, disabled, loading, and destructive states must be distinct.                      | Use descriptive labels; normally one primary action per page section.                  | Current pattern exists, not centralized. |
| Icon button                | Compact tool action only when the icon is familiar or labelled.       | Requires accessible label and visible focus.                                                   | Keep minimum touch size; add text when meaning is ambiguous.                           | Limited/current-future.                  |
| Link                       | Navigation or external reference.                                     | Must show focus and not depend on colour alone when embedded in dense text.                    | Avoid vague "click here".                                                              | Current.                                 |
| Input/Textarea/Select      | Data entry and filters.                                               | Visible label, validation state, `aria-invalid` and error association where possible.          | Full width on mobile; placeholders never replace labels.                               | Current.                                 |
| Checkbox/Radio             | Binary or mutually exclusive settings.                                | Label must be clickable; focus visible; disabled state clear.                                  | Use for settings, not primary commands.                                                | Checkbox current; radio future.          |
| Form field/section         | Group related clinic, doctor, patient, appointment data.              | Preserve entered values after errors; show server validation safely.                           | Stack fields on mobile; avoid crowded two-column forms under small widths.             | Current.                                 |
| Card/Metric card           | Record display, summaries, and dashboard metrics.                     | Heading/label relationship should be clear; status text visible.                               | Cards may replace tables on mobile.                                                    | Current.                                 |
| Section card               | Framed operational form or major route section.                       | Avoid cards inside cards; keep actions discoverable.                                           | Use `p-4`/`p-6`; do not turn every page band into a decorative card.                   | Current.                                 |
| Table                      | Dense record comparison.                                              | Header cells required; row actions labelled.                                                   | May horizontally scroll or convert to record cards, but data must stay understandable. | Current.                                 |
| Responsive record card     | Mobile-friendly doctor/patient/appointment/queue record.              | Preserve status, primary fields, and actions.                                                  | Actions may wrap or move to menus if needed.                                           | Current.                                 |
| Dialog/confirmation dialog | Destructive/final confirmation only if implemented.                   | Needs label, focus trap, focus restoration, Escape/close behavior, and clear consequence copy. | Avoid cramped content; primary/destructive actions stay reachable.                     | Future.                                  |
| Drawer                     | Secondary details or filters only if route complexity requires it.    | Same focus and labelling expectations as dialogs.                                              | Must not hide required actions behind gesture-only behavior.                           | Future.                                  |
| Dropdown menu              | Compact action sets.                                                  | Keyboard navigation and labels required.                                                       | Prefer visible actions for critical status changes.                                    | Future/limited.                          |
| Tabs                       | Switch between related views without navigation.                      | Use semantic tab pattern if implemented.                                                       | Do not use tabs for unrelated workflows.                                               | Future.                                  |
| Breadcrumbs                | Deep route hierarchy.                                                 | Links must be meaningful.                                                                      | Not needed for current shallow routes.                                                 | Future.                                  |
| Alert                      | Important persistent message.                                         | `role=alert` for errors; do not overuse.                                                       | Keep action nearby.                                                                    | Current through `ErrorMessage`.          |
| Toast                      | Short success/error feedback.                                         | `role=status` or `role=alert`; dismiss control labelled.                                       | Do not replace persistent error state for failed forms.                                | Current.                                 |
| Status badge               | Appointment, queue, active/inactive state.                            | Text label required; colour supplemental.                                                      | Keep labels readable and wrap when necessary.                                          | Current.                                 |
| Risk badge                 | LOW/MEDIUM/HIGH no-show risk.                                         | Level text, reason visibility, and human-control copy required.                                | Risk colour never communicates alone.                                                  | Current.                                 |
| Skeleton                   | Placeholder for known layout while loading.                           | Must not hide real errors or continue indefinitely.                                            | Current app mostly uses loading panels; skeleton is future.                            | Future.                                  |
| Loading state              | Initial page, section, background refresh, form submission.           | `role=status`/`aria-live` for meaningful updates.                                              | Use operation-specific text.                                                           | Current.                                 |
| Empty state                | Empty database, filters, or unavailable records.                      | Explain what is missing and next action/permission.                                            | Avoid blank pages.                                                                     | Current.                                 |
| Error state                | Validation, auth, authorization, network, backend, unexpected errors. | Safe message, optional retry, no stack traces/secrets.                                         | Preserve user input.                                                                   | Current.                                 |
| Pagination                 | Larger lists when introduced.                                         | Keyboard accessible and announces current page.                                                | Not active; current lists need future scale decisions.                                 | Future.                                  |
| Filter bar/Search input    | Appointment, queue, doctor, patient scanning.                         | Label filters, preserve values across errors when practical.                                   | Wrap controls on mobile.                                                               | Current.                                 |
| Destructive confirmation   | Cancel appointment, mark no-show, deactivate doctor/patient.          | Explicit consequence copy; final actions visually destructive.                                 | Do not use vague labels.                                                               | Partial/current-future.                  |

## Action Hierarchy

| Action type        | Use                                                                                   | Example labels                                                         |
| ------------------ | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Primary action     | Main next step for the current section. Normally one primary action per page section. | Create clinic, Add doctor, Add patient, Book appointment, Save changes |
| Secondary action   | Useful alternative that should not compete with primary action.                       | Continue with an empty clinic, Clear filters, Refresh                  |
| Tertiary action    | Low-emphasis supporting action.                                                       | Back, Cancel, View details                                             |
| Destructive action | Irreversible, final, or harmful operation.                                            | Cancel appointment, Mark patient as no show, Deactivate doctor         |
| Inline action      | Row/card-specific operation near the record.                                          | Edit, Call patient, Complete appointment                               |
| Navigation action  | Route change rather than mutation.                                                    | Dashboard, Doctors, Patients, Appointments, Queue, Clinic Settings     |

Prefer precise action labels such as `Create clinic`, `Add doctor`, `Add patient`, `Book appointment`, `Mark as arrived`, `Add to queue`, `Call patient`, `Complete appointment`, `Save changes`, and `Cancel appointment`.

Avoid vague labels when a precise action exists: `Submit`, `Proceed`, `Do it`, `Manage`, `Click here`, `Update`.

## Appointment Status Presentation

| Status    | Display label | Semantic meaning                                     | Visual token       | Permitted actions                              | State  | Accessibility text                   |
| --------- | ------------- | ---------------------------------------------------- | ------------------ | ---------------------------------------------- | ------ | ------------------------------------ |
| SCHEDULED | Scheduled     | Appointment exists but is not yet confirmed/arrived. | Information/sky    | Confirm, Arrive, Add to queue, Cancel, No show | Active | Appointment status: Scheduled.       |
| CONFIRMED | Confirmed     | Clinic has confirmed the appointment.                | Information/indigo | Arrive, Add to queue, Cancel, No show          | Active | Appointment status: Confirmed.       |
| ARRIVED   | Arrived       | Patient has arrived at clinic.                       | Information/cyan   | Add to queue, Call, Cancel, No show            | Active | Appointment status: Arrived.         |
| IN_QUEUE  | In Queue      | Appointment is represented in the queue.             | Warning/amber      | Call, Complete, Cancel, No show                | Active | Appointment status: In Queue.        |
| CALLED    | Called        | Patient has been called for consultation.            | Information/violet | Complete, Cancel, No show                      | Active | Appointment status: Called.          |
| COMPLETED | Completed     | Consultation finished.                               | Success/emerald    | None                                           | Final  | Final appointment status: Completed. |
| CANCELLED | Cancelled     | Appointment was cancelled.                           | Neutral/slate      | None                                           | Final  | Final appointment status: Cancelled. |
| NO_SHOW   | No Show       | Patient did not attend.                              | Danger/red         | None                                           | Final  | Final appointment status: No Show.   |

Do not rely on colour alone. Use readable labels in badges and action labels. Direct API transition enforcement is tracked separately in the v0.3 route audit.

## Queue Status Presentation

| Status    | Display label | Operational meaning                               | State  | Visual treatment    | Reorder participation                              | Accessibility text             |
| --------- | ------------- | ------------------------------------------------- | ------ | ------------------- | -------------------------------------------------- | ------------------------------ |
| WAITING   | Waiting       | Queue entry is active and waiting.                | Active | Warning/information | May participate if active and scoped correctly.    | Queue status: Waiting.         |
| ARRIVED   | Arrived       | Patient has arrived and is visible in flow.       | Active | Information/cyan    | May participate if active and scoped correctly.    | Queue status: Arrived.         |
| CALLED    | Called        | Patient has been called.                          | Active | Information/violet  | May participate if active and product rules allow. | Queue status: Called.          |
| COMPLETED | Completed     | Queue work is finished.                           | Final  | Success/emerald     | Not reorderable.                                   | Final queue status: Completed. |
| CANCELLED | Cancelled     | Queue entry ended due to cancellation.            | Final  | Neutral/slate       | Not reorderable.                                   | Final queue status: Cancelled. |
| NO_SHOW   | No Show       | Queue entry ended because patient did not attend. | Final  | Danger/red          | Not reorderable.                                   | Final queue status: No Show.   |

Final statuses must not be shown as reorderable. Queue reorder must preserve clinic, doctor, and clinic-local-day position scope after the related implementation gap is fixed.

## Risk-Level Presentation

Risk is explainable, deterministic, rule-based, decision-support, and human-controlled.

| Level  | Display label       | Visual token       | Supporting treatment                                           | Accessibility text          |
| ------ | ------------------- | ------------------ | -------------------------------------------------------------- | --------------------------- |
| LOW    | Low no-show risk    | Success/neutral    | Reasons may be collapsed but should remain available.          | No-show risk level: Low.    |
| MEDIUM | Medium no-show risk | Warning/amber      | Show reasons and suggested staff follow-up if present.         | No-show risk level: Medium. |
| HIGH   | High no-show risk   | Danger/red/warning | Show reasons prominently and use careful, non-accusatory copy. | No-show risk level: High.   |

Risk colour must never be the only way the level is communicated. Suggested actions are recommendations for staff review only. Risk must never imply automatic cancellation, automatic queue reordering, medical decision-making, or certainty about patient behavior.

## Loading, Empty, Error And Success States

| State                         | Standard                                                                         |
| ----------------------------- | -------------------------------------------------------------------------------- |
| Initial page loading          | Show a visible loading state with route-specific text. Do not use blank screens. |
| Section loading               | Keep page structure visible when possible.                                       |
| Background refresh            | Preserve existing data and show subtle progress or retry state.                  |
| Form submission               | Disable duplicate submit and use operation-specific text.                        |
| Empty database                | Explain what is missing and what can be done next.                               |
| Empty search result           | Explain filters/search are the reason and offer clear adjustment.                |
| Network error                 | Explain the API could not be reached and offer retry when safe.                  |
| Validation error              | Show field-level errors and preserve entered values.                             |
| Authorization error           | Say access is not allowed; do not expose another clinic's data.                  |
| Not-found error               | State the record/page could not be found.                                        |
| Backend unavailable           | Use safe wording; no stack traces or connection strings.                         |
| Successful create/update      | Show success only after backend confirmation.                                    |
| Successful destructive action | Confirm the result and preserve related records where product rules require it.  |
| Retry action                  | Use `Try again`, `Retry`, or a task-specific label.                              |

## Responsive Behavior

| Width  | Expectation                                                                                |
| ------ | ------------------------------------------------------------------------------------------ |
| 320px  | Single-column layout, full-width forms, touch-safe actions, no incoherent overlap.         |
| 375px  | Same as 320px with slightly more room for badges/actions.                                  |
| 768px  | Tablet layout may use two-column grids for forms and cards; navigation remains usable.     |
| 1024px | Dashboard and operational pages may use multi-column grids; filters should stay scannable. |
| 1440px | Use available width for workflow density without stretching long reading copy too far.     |

Navigation should wrap or scroll intentionally. Page headers should stack actions on small screens. Forms should avoid cramped multi-column fields on mobile. Filters and queue controls must remain reachable. Tables may become horizontally scrollable or use responsive cards, but data must remain understandable. Status badges must include readable text. Touch targets should be at least roughly 40px high where possible.

## Accessibility Foundation

This is a minimum expectation, not WCAG certification.

- Use semantic headings in route order.
- Keep landmarks such as header, nav, main, and footer meaningful.
- Preserve keyboard navigation and logical focus order.
- Show visible focus for links, buttons, fields, toasts, and menus.
- Use visible form labels.
- Associate descriptions and errors with inputs where practical.
- Give icon-only controls accessible labels.
- Give dialogs labels, focus traps, and focus restoration if dialogs are implemented.
- Announce loading/error/success status changes where they affect task completion.
- Maintain colour contrast for text and controls.
- Keep touch targets usable on mobile.
- Respect reduced-motion preferences for future animation.
- Use table headers for true tables.
- Communicate statuses and risk with text, not colour alone.

## Implementation Status Note

| Area                | Current implementation                                                                | Documented v0.3 standard                                                                 | Implementation follow-up needed                                            |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Colour tokens       | Tailwind utilities used directly; action states often blue.                           | Navy/Teal/Background/White/Text/Border plus semantic tokens.                             | Add centralized tokens only through a separate implementation issue.       |
| Typography          | Global font stack and Tailwind size utilities.                                        | Defined hierarchy for hero, page, section, card, body, label, table, button, metrics.    | Audit route typography at runtime.                                         |
| Layout              | Responsive Tailwind grids/flex in pages and shell.                                    | Mobile/tablet/desktop task-completion standards.                                         | Capture viewport evidence.                                                 |
| Components          | Repeated local button, input, card, badge, loading, empty, error, and toast patterns. | Shared standards documented; no new component library required.                          | Consider extracting shared primitives only if duplication becomes painful. |
| Status/risk display | Badges with text and colours in appointments/queue/dashboard.                         | Text-first semantic status and risk communication.                                       | Verify all runtime states and fix lifecycle gaps tracked in route audit.   |
| Accessibility       | Many labels, errors, focus styles, `role=status`, and `role=alert` found.             | Keyboard, focus, labels, status announcements, contrast, and colour-independent meaning. | Run browser keyboard and screen-reader smoke checks.                       |
| Dark mode           | Not implemented.                                                                      | Light-mode-first.                                                                        | Separate issue required for dark mode.                                     |
