# Screenshot And Asset Audit

This audit prevents stale or fabricated visuals from becoming reviewer evidence.

## Current Asset Classification

| Asset path                                                                                               | Classification | Notes                                           |
| -------------------------------------------------------------------------------------------------------- | -------------- | ----------------------------------------------- |
| [apps/web/public/pravaah-logo.png](../../apps/web/public/pravaah-logo.png)                               | `CURRENT`      | Public brand/logo asset.                        |
| [apps/web/public/pravaah-wordmark-dark.png](../../apps/web/public/pravaah-wordmark-dark.png)             | `CURRENT`      | Public brand asset.                             |
| [apps/web/public/pravaah-wordmark-light.png](../../apps/web/public/pravaah-wordmark-light.png)           | `CURRENT`      | Public brand asset.                             |
| [apps/web/public/brand/pravaah-social-card.png](../../apps/web/public/brand/pravaah-social-card.png)     | `CURRENT`      | Social preview asset; not a product screenshot. |
| [apps/web/public/brand/favicon.svg](../../apps/web/public/brand/favicon.svg)                             | `CURRENT`      | Browser icon.                                   |
| [apps/web/public/brand/pravaah-mark-gradient.svg](../../apps/web/public/brand/pravaah-mark-gradient.svg) | `CURRENT`      | Brand mark.                                     |
| [apps/web/public/brand/pravaah-mark-solid.svg](../../apps/web/public/brand/pravaah-mark-solid.svg)       | `CURRENT`      | Brand mark.                                     |
| [docs/assets/v0.2/README.md](../assets/v0.2/README.md)                                                   | `CURRENT`      | Screenshot manifest, not an image.              |
| [docs/assets/v0.2/screenshots/README.md](../assets/v0.2/screenshots/README.md)                           | `CURRENT`      | Empty screenshot folder note.                   |
| `docs/assets/v0.2/screenshots/*.png`                                                                     | `UNVERIFIED`   | No screenshot PNGs are currently committed.     |

No stale product screenshots, mockups, or placeholder product images were found under `docs/assets` during this pass.

## Required Screenshots

Use the existing [v0.2 asset manifest](../assets/v0.2/README.md) as the canonical capture list:

- `01-public-landing.png`
- `02-sign-up.png`
- `03-onboarding-status.png`
- `04-create-clinic.png`
- `05-sample-data-choice.png`
- `06-dashboard-first-run.png`
- `07-clinic-settings.png`
- `08-doctor-edit.png`
- `09-patient-edit.png`
- `10-appointment-risk.png`
- `11-queue-reorder.png`
- `12-dashboard-after-activity.png`

## Caption Template

Use this format when screenshots are added:

```md
Image: docs/assets/v0.2/screenshots/<file-name>.png

Caption: Screen name. Environment: local/preview/production. Implementation: IMPLEMENTED. Deployment: NOT_YET_RELEASED or DEPLOYED with evidence.
```

## Capture Policy

- Capture only the current rendered application.
- Use fictional data from [Safe Sample Data Guide](sample-data-guide.md).
- Do not use generated dashboards, generic mockups, or old UI images as product screenshots.
- Do not mark screenshots complete until the actual image files exist and have been reviewed for secrets and personal data.
