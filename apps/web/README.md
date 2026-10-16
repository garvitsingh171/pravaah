# Pravaah Web

This workspace contains the Pravaah React + TypeScript + Vite frontend.

## Scripts

```bash
npm run dev -w apps/web
npm run build -w apps/web
npm run lint -w apps/web
npm run preview -w apps/web
```

## Required Environment Variables

Put frontend-safe values in `apps/web/.env`:

```txt
VITE_API_BASE_URL=http://localhost:5000/api
VITE_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
VITE_DEFAULT_CLINIC_ID=00000000-0000-4000-8000-000000000000
```

`VITE_DEFAULT_CLINIC_ID` is optional demo fallback context. In normal signed-in use, the app prefers the authenticated internal Pravaah user's active clinic returned by `GET /api/auth/me`.

## Source Structure

```txt
src/
├── app/
├── components/
├── features/
├── lib/
├── routes/
├── types/
└── main.tsx
```

## Public Marketing Pages

The marketing experience lives in `src/features/marketing/`, separate from the protected clinic workspace. It includes `/`, `/product`, five implemented feature pages, `/solutions`, `/how-it-works`, `/faq`, `/about`, and `/contact`. Public routes share a layout, but protected routes retain their existing shell and Clerk routing.

`npm run build -w apps/web` runs Vite and then `scripts/generate-static-marketing.mjs`. The script writes a readable HTML entry point with route-specific metadata and links for each public route. React replaces that initial content when it starts. Keep the route list in the generator, `src/lib/siteMetadata.ts`, `public/sitemap.xml`, and `vercel.json` in sync.

The contact form uses a `mailto:` handoff to the repository owner's confirmed contact address. Visitors review and send the draft in their own email client; there is no server-side lead storage or guaranteed delivery.

See the root docs for details:

- [Frontend Structure](../../docs/architecture/FRONTEND_STRUCTURE.md)
- [Setup](../../docs/guides/SETUP.md)
- [Auth And Security](../../docs/architecture/AUTH_AND_SECURITY.md)
