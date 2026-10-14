# src/app — routes, pages and the proxy

## Purpose

App Router tree: the pages a visitor sees, the fonts and metadata they load, and
`proxy.ts`, which sets the security headers.

## Ownership

Owns everything a browser request touches before it reaches `src/lib`. Route
handlers under `api/` have their own doc.

## Local Contracts

- **Fonts are committed files, fetched from no CDN.** `layout.tsx` declares them with
  `next/font/local` from `./fonts`; `src/app/fonts/LICENSE.md` records family,
  copyright and licence. Adding a font means committing the `woff2` (latin subset,
  only the weights used) and its licence row. The CSP keeps `font-src 'self'`.
- **Metadata points at `/brand/*`** for icons and the OG image, and `themeColor` is
  the night token. `public/AGENTS.md` owns those files.
- **`proxy.ts` CSP must not regress.** `unsafe-eval` is absent in production;
  `upgrade-insecure-requests` and HSTS are emitted **only when the request is
  already TLS** — emitting them on plain HTTP makes WebKit upgrade every subresource
  and renders the app unstyled and inert. `scripts/verify-headers.mjs` asserts both
  the TLS and the plain-HTTP case.
- **State pages carry gate contracts, not just styling:**
  - `loading.tsx`, `error.tsx`, `global-error.tsx` keep a live region
    (`role=`/`aria-live`) — `verify-pending-ui` greps for it.
  - `error.tsx` keeps the words "Something went wrong" and a control wired to Next's
    `reset` — `verify-error-boundary` asserts both.
  - The missing-paste copy keeps the phrase "does not exist" (or equivalent) —
    `verify-pending-ui` asserts an explanation is shown.
  - `global-error.tsx` renders its own `<html>`/`<body>` and inline styles, because it
    runs when the document shell itself failed.
- **Written pages use `Folio`** (`src/components/Folio.tsx`): docs, privacy, security
  and terms. Folio prose is styled by `.folio .slip …` rules — scoped to the slip, so
  they cannot repaint the eyebrow above it (that is exactly what happened once).
- **`/p/[id]` never renders server-side content**: the viewer decrypts in the
  browser, so the page ships a shell and the client fetches by id.

## Work Guidance

- A page that only reads should stay a server component; add `'use client'` only at
  the smallest component that needs interactivity.
- Interactive pages for the paste flow live in `src/components`; keep route files
  thin and let components own behaviour.

## Verification

- `node scripts/verify-headers.mjs` — CSP, HSTS, no-store, both TLS and HTTP.
- `node scripts/verify-pending-ui.mjs` — live regions and the missing-paste copy.
- `node scripts/verify-error-boundary.mjs` — the boundary actually catches a throw.
- `node scripts/verify-crawler.mjs` — `/p/*` excluded from indexing.
- `node scripts/verify-a11y.mjs` — contrast and surface polarity on every page here.

## Child DOX Index

- `src/app/api/AGENTS.md` — the route handlers under this tree.
