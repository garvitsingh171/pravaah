# Route SEO Inventory

The public marketing routes are configured in `apps/web/src/App.tsx`, `apps/web/src/lib/siteMetadata.ts`, and `apps/web/scripts/generate-static-marketing.mjs`.

## Canonical Site

`https://pravaah.garvitsingh171.com` is the canonical origin. Runtime metadata can use `VITE_SITE_URL`, but the build-time HTML generator and sitemap use the production origin above.

## Public Routes

| Route | Purpose | Build-time HTML | Sitemap |
| --- | --- | --- | --- |
| `/` | Introduction | Yes | Yes |
| `/product` | Detailed product overview | Yes | Yes |
| `/features` | Feature index | Yes | Yes |
| `/features/appointments` | Appointment management | Yes | Yes |
| `/features/live-queue` | Queue management | Yes | Yes |
| `/features/no-show-risk` | Explainable, rule-based assistance | Yes | Yes |
| `/features/clinic-management` | Clinic, doctor, and patient records | Yes | Yes |
| `/features/team-management` | Admin and Staff access | Yes | Yes |
| `/solutions` | Clinic roles | Yes | Yes |
| `/how-it-works` | Daily workflow | Yes | Yes |
| `/faq` | Product questions | Yes | Yes |
| `/about` | Product story | Yes | Yes |
| `/contact` | Email handoff | Yes | Yes |

Each public route has a unique title, description, canonical URL, Open Graph and Twitter metadata in `siteMetadata.ts`. The build produces route-specific HTML with core copy and internal links so crawlers that do not run JavaScript can still discover the page. Vercel routes these paths to their generated HTML; all other application paths retain the SPA fallback.

The generated HTML is a readable content snapshot, not a full static render of the interactive React page. The React application replaces it after startup. This remains a practical indexing improvement within the current Vite architecture, with a possible initial layout change on slow connections. Full pre-rendering or SSR is future work.

## Private Routes

Authentication, onboarding, invitations, and the protected workspace are excluded from the sitemap and marked `noindex,nofollow` by route metadata. `robots.txt` also disallows crawling of these path families. This is not an access-control boundary: Clerk, internal user resolution, clinic scoping, role checks, and backend authorization protect private data.

The public social preview image is `apps/web/public/brand/pravaah-social-card.png`.
