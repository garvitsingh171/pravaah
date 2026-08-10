# Route SEO Inventory

This inventory reflects the React Router configuration in `apps/web/src/App.tsx` and `apps/web/src/routes/dashboardRoutes.tsx`.

## Site URL

The frontend metadata utility uses `VITE_SITE_URL` with a fallback of:

```txt
https://pravaah.garvitsingh171.com
```

The repository still does not contain production deployment evidence. The owner must verify the final production origin before release.

## Route Classification

| Route                | Classification              | Indexing           | Sitemap | Canonical | Metadata owner                            | Direct load                                           |
| -------------------- | --------------------------- | ------------------ | ------- | --------- | ----------------------------------------- | ----------------------------------------------------- |
| `/`                  | Public informational        | `index,follow`     | Yes     | Yes       | `RouteMetadata` and `index.html` fallback | Vercel SPA rewrite                                    |
| `/login/*`           | Authentication              | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite                                    |
| `/sign-up/*`         | Authentication              | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite                                    |
| `/onboarding`        | Public onboarding redirect  | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite                                    |
| `/onboarding/clinic` | Private onboarding          | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite                                    |
| `/dashboard`         | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/doctors`           | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/doctors/new`       | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/patients`          | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/patients/new`      | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/appointments`      | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/queue`             | Protected application       | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app guards              |
| `/clinic-settings`   | Protected Admin application | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite plus Clerk/app/backend role guards |
| `*`                  | Not found fallback          | `noindex,nofollow` | No      | No        | `RouteMetadata`                           | Vercel SPA rewrite                                    |

## Public SEO Files

- `apps/web/public/robots.txt` allows public crawling and declares the sitemap URL.
- `apps/web/public/sitemap.xml` contains only the public homepage canonical URL.
- `apps/web/public/brand/pravaah-social-card.png` is the 1200 by 630 social preview image.
- `apps/web/index.html` carries the default public metadata for crawlers that do not execute React.

## SPA Limitation

Pravaah is a Vite single-page app. Runtime metadata updates work for browsers and crawlers that execute JavaScript, but route-specific social previews are not guaranteed for crawlers that only read the initial HTML. The current architecture provides a strong default public preview for `/` and documents this limitation without introducing SSR or a new framework.

## Security Note

Sitemap exclusion and `noindex` are not security controls. Protected data remains protected by Clerk authentication, internal-user resolution, role checks, clinic access checks, and backend authorization.
