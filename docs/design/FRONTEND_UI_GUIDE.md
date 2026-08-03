# Pravaah Frontend UI Guide

This guide describes the shared frontend layer used by the clinic-side Pravaah web app.

## Design Tokens

Core tokens live in `apps/web/src/index.css` as CSS custom properties and are exposed to Tailwind in `apps/web/tailwind.config.js`.

- Brand: `--color-brand`, `--color-brand-hover`, `--color-brand-soft`, `--color-brand-subtle`, `--color-brand-foreground`
- Action: `--color-action`, `--color-action-hover`, `--color-action-soft`
- App surfaces: `--color-app-background`, `--color-app-surface`, `--color-app-surface-muted`, `--color-app-border`, `--color-app-border-strong`
- Text: `--color-app-text`, `--color-app-text-muted`, `--color-app-text-subtle`, `--color-app-text-disabled`
- Status: success, warning, danger, info, and neutral each define `bg`, `text`, and `border` tokens
- Radius: `--radius-app-sm`, `--radius-app-md`, `--radius-app-lg`

Use the tokenized Tailwind names where available, such as `bg-action`, `text-app-muted`, `border-app-border`, and `focus-visible:outline-action`.

## Primitives

Shared UI primitives live in `apps/web/src/components/ui`.

- `Button`: primary, secondary, outline, ghost, and danger button styles with loading and disabled states
- `Badge`: semantic pill badge using `brand`, `info`, `success`, `warning`, `danger`, or `neutral`
- `StatusBadge`: appointment, queue, and active/inactive badges using centralized labels and tones
- `RiskBadge`: standardized no-show risk badge with unavailable handling
- `Card`: bordered white surface for repeated panels
- `PageHeader`: consistent protected-page heading surface and action area
- `FilterBar`: consistent filter-control surface
- `fieldControlClassName`: shared input, select, and textarea control styling

## Status and Risk Language

Status and risk labels are centralized in `statusPresentation.ts`.

- Appointment statuses use labels like `In Queue` and `No Show`
- Queue statuses use labels like `Waiting`, `Called`, and `No Show`
- Risk badges use `Low Risk`, `Medium Risk`, and `High Risk`
- Active record status uses `Active` or `Inactive`

Do not create page-local status color maps. Add new states to `statusPresentation.ts` first, then render them through `StatusBadge`, `RiskBadge`, or `Badge`.

## Page Migration Notes

Protected pages should use `PageHeader` for the top context surface, `FilterBar` for filters, `Button` for button elements, and `fieldControlClassName` for basic form controls.

Page-specific explanatory panels can remain local when they include workflow-specific content, but their badges and action colors should still come from shared primitives and tokens.
