Community Friends App - Foundation

Getting started
- Install dependencies: `npm install`
- Run dev server: `npm run dev`

What’s included
- Next.js 15 App Router
- Tailwind CSS v4 via `@tailwindcss/postcss`
- ESLint flat config

Next steps (per workplan)
- Set up Supabase client and auth scaffolding
- Create baseline folders under `src/components`, `src/lib`, and `src/hooks`

Environment variables

Set these in your `.env.local`:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` – Supabase anon key
- `NEXT_PUBLIC_SITE_URL` – Base URL for magic link redirects (e.g., `http://localhost:3000` in dev)

Auth flow

- Passwordless email using Supabase `signInWithOtp` (magic link)
- The client is initialized with `persistSession: true`, `autoRefreshToken: true`, and `detectSessionInUrl: true` in the browser
- Magic link returns to `NEXT_PUBLIC_SITE_URL` and the SDK exchanges tokens automatically; users then continue to the intended `redirect` path when applicable

Testing

- Unit: `npm test`
- E2E: `npm run cy:open` or `npm run cy:run`
