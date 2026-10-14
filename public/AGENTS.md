# public — brand assets and the manifest

## Purpose

Files served verbatim at the site root: the wax-seal icon set, the social image,
and the web app manifest.

## Ownership

Owns shipped static bytes and the budget they must fit. Metadata that *references*
these files lives in `src/app/layout.tsx`.

## Local Contracts

- **The seal is the brand.** `brand/favicon.svg` is the source of truth; the PNGs
  are its renders at fixed sizes (`favicon-32`, `favicon-16`, `icon-180`,
  `icon-192`, `icon-512`). Regenerate all of them when the seal changes — a stale
  size is a 404 or a wrong icon in someone's tab.
- **`brand/og-sanctum.jpg`** is the social card (charred vellum, the pressed seal,
  "Spoken once, then silence"). It is JPEG deliberately: the PNG version was over
  the per-asset cap and re-rendered at 40 KB.
- **Budgets are enforced.** `verify-assets` checks every file referenced by
  metadata or the manifest exists, that no single asset exceeds 128 KB, and that
  the **total** shipped under `public/` (recursively) stays under 256 KB. Adding a
  large asset fails the build's gates, not just a review.
- **Manifest colours are the night tokens** (`#0f0c09`), and its icons point at
  `/brand/*`. A light-theme manifest would flash white on install.
- **Do not put anything here that is not meant to be fetched by a stranger.** This
  directory is public; secrets, dumps and design sources do not belong in it.

## Work Guidance

- Design sources live in the gitignored `.design/` tree; `.design/round-01/SPEC.md`
  is the committed-language reference, and `.design/round-01/assets/` holds the
  render pages. Re-render from there rather than redrawing by hand.
- Prefer SVG where the platform allows it, and JPEG/PNG only where a raster is
  required (favicons, social cards).

## Verification

- `node scripts/verify-assets.mjs` — existence, per-asset cap, recursive total.
- `node scripts/verify-crawler.mjs` — robots/sitemap still resolve.

## Child DOX Index

None.
