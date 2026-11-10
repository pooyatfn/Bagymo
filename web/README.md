# bagymo web

Next.js (App Router) + Tailwind CSS v4 frontend for باجیمو. See the root `README.md` for the full setup.

```bash
npm ci
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000 npm run dev
npm run lint && npm run typecheck
```

- `src/components/ui/` — design-system components; colors come from tokens in `src/app/globals.css` (`brand-*`, `ink-*`, `surface`, `canvas`, `line`).
- `src/components/PageShell.tsx` — wrap every panel page; pass `roles={[...]}` to restrict access.
- `src/components/AppShell.tsx` — sidebar navigation per role (`NAV`).
- Use `useToast()` / `useConfirm()` instead of `alert()` / `confirm()`.
