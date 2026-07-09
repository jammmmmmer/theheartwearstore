# Next.js 14 → 16 Migration

**Why:** Next.js 14 reached end-of-life (Oct 2025). Its final patch, `14.2.35`,
does not cover the May 2026 coordinated security release (13 advisories: cache
poisoning, XSS via CSP nonces, SSRF via WebSocket upgrades, request smuggling in
rewrites, DoS in Server Components / image optimizer). Those are only fixed on the
supported 15 / 16 lines. Target: **Next 16** (Active LTS, security support to Oct
2027). Next 15's support ends Oct 2026, so we skip it.

## Scope assessment (done 2026-07-09)

The codebase was audited for Next 14→16 breaking changes. The surface is small:

- **No** `cookies()` / `headers()` / `draftMode()` from `next/headers` — the admin
  session reads cookies via `NextRequest.cookies` / `NextResponse.cookies`, which are
  unchanged. This avoids the biggest Next 15 async-API pain entirely.
- **No** React 19 breaking patterns: no `defaultProps` on function components, no
  `propTypes`, no string refs, no `ReactDOM.render`/`findDOMNode`, no `forwardRef`,
  no `useRef()` without an argument.
- `next.config.mjs` already uses `remotePatterns` (not deprecated `images.domains`).
- Node 22 already installed (Next 16 needs ≥ 20.9).
- Only **two** dynamic-route pages used the old sync `params` shape.

## Changes already applied to the working tree

1. **`package.json`** dependency bumps:
   - `next` `14.2.35` → `^16.2.10`
   - `react` / `react-dom` `^18` → `^19`
   - `@types/react` / `@types/react-dom` `^18` → `^19`
   - `eslint-config-next` `14.2.35` → `^16.2.10`
   - `eslint` `^8` → `^9` (required peer of eslint-config-next 16)
   - `lucide-react` `^0.344.0` → `^0.469.0` (0.344 peer-caps at React 18; 0.469
     adds React 19 support without jumping to the 1.x line / icon-API drift)

   Note: `zustand@4.5` (peer `react >=16.8`) and `@stripe/react-stripe-js@6`
   (peer `<20.0.0`) already permit React 19 — left unchanged.

2. **Async `params`** (Next 15+ makes `params`/`searchParams` a Promise):
   - `app/shop/[productId]/page.tsx` — `params` typed as `Promise<…>`; `await params`
     in `generateMetadata` and `ProductPage`.
   - `app/artists/[slug]/page.tsx` — same treatment in `generateMetadata` and `ArtistPage`.
   - `app/auto-product/result/page.tsx` — already awaited `searchParams`; no change.

3. **Middleware → Proxy** (Next 16 renamed the convention): `middleware.ts` →
   `proxy.ts`, exported function `middleware` → `proxy`; `config`/matcher unchanged.
   Important: leaving the file as `middleware.ts` under Next 16 can cause the auth
   matcher to silently stop running — this gate protects `/upload-design`, so the
   rename is not optional. Delete the old file with `git rm middleware.ts`.

## Build result (2026-07-09)

Clean build on **Next.js 16.2.10 (Turbopack)**, React 19.2.7, TypeScript passed,
37 routes generated. Vulnerabilities dropped from 12 (1 critical / 7 high / 4
moderate) to **2 moderate** — both a build-time-only PostCSS advisory bundled inside
Next itself, unfixable until Next ships a patch. `tsconfig.json` was auto-updated by
Next (jsx → `react-jsx`, added `.next/dev/types`); commit it as-is.

## To run (on your machine — npm can't run through the sandbox)

```bash
cd ~/Projects/theheartwearstore
git checkout -b upgrade/next-16          # carries the uncommitted edits onto a branch
npm install                              # pulls Next 16 + React 19
npm run build                            # the real test — must pass
npm audit                                # should now be clean (or dev-only glob left)
```

If the build passes:

```bash
git add -A
git commit -m "Upgrade to Next.js 16 + React 19 (clears May 2026 security advisories)"
git push -u origin upgrade/next-16
```

Then open a PR (or merge to main) and let Netlify build a deploy preview before
promoting to production.

## Verify after build (manual smoke test on the preview)

- Home page renders (Heartline design intact)
- `/shop` lists products; a product detail page `/shop/[id]` loads
- `/artists/[slug]` page loads
- Add to cart → cart drawer → checkout starts (Stripe)
- `/track` order lookup
- Admin: `/login` → `/upload-design` (middleware gate still redirects when logged out)

## Known watch-items (not blockers)

- `unstable_noStore` (in `app/shop/page.tsx`) is deprecated in 16 but still works.
  Optional later cleanup: replace with `connection()` or `export const dynamic`.
- Next 15 changed caching defaults: `fetch` and GET route handlers are **no longer
  cached by default**. This app already uses `no-store` / `noStore()` cache-busting,
  so the change is in the safe direction (less stale data), but watch product-list
  freshness on the preview.
- `next lint` still runs in 16 but is deprecated; a later move to ESLint 9 flat
  config is worth scheduling, separate from this migration.
- The `glob` high-severity advisory comes in via the eslint toolchain (dev-only,
  never shipped to production) and may persist until the eslint stack is updated.

## Rollback

The change is isolated to a branch. If the build or smoke test fails and can't be
fixed quickly, `git checkout main` leaves production (Next 14.2.35) untouched.
