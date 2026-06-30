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

See the root docs for details:

- [Frontend Structure](../../docs/FRONTEND_STRUCTURE.md)
- [Setup](../../docs/SETUP.md)
- [Auth And Security](../../docs/AUTH_AND_SECURITY.md)
