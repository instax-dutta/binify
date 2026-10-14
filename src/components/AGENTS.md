# src/components — UI and the Sanctum grammar

## Purpose

Every piece of interface. The design language is "Sanctum": a vellum slip in
vast darkness, worked by hand, sealed in wax. `DESIGN.md` and
`.design/round-01/SPEC.md` hold the full direction; this file holds what a
contributor must not break.

## Ownership

Owns appearance, interaction and the accessibility of interactive controls.
Tokens live in `src/app/globals.css` (the `@layer components` block); this
subtree consumes them.

## Local Contracts

- **Two surfaces, one rule.** Text on the night surface is light (vellum/amber);
  text inside a `.slip` or `.charred-paper` surface is **ink**. `verify-a11y`
  asserts this polarity directly, so a light-on-paper regression fails the gate.
  Classes that carry the grammar: `.slip`, `.rune`, `.rune-muted`, `.paper-input`,
  `.ghost` (night), `.ghost-paper` / `.ghost-paper-danger` (paper), `.wax-lit`
  (the wax hue for night, where `--wax` is too dark).
- **The wax seal is one object.** `WaxSeal.tsx` is the only definition: render
  `<WaxSealDefs />` once per page and `<WaxSeal size={n} />` wherever the seal
  appears. It is a flat matte impression with a rim legend — never make it glossy,
  and never replace it with an icon font glyph.
- **`LuxurySelect` is a real listbox and the a11y gate drives it.** Keep
  `role="listbox"`/`role="option"`, the `aria-activedescendant` wiring, and the
  trigger `id`s (`expiration-select`, `language-select`). Replacing it with a native
  `<select>` changes the accessibility contract the gate tests.
- **The payload renderer draws on paper.** `ContentCanvas` picks plain text,
  `CodeBlock` (Prism with the `sanctumPaper` theme) or `MarkdownPreview`
  (Tailwind typography pointed at the ink palette). A dark syntax theme is a contrast
  bug here, and long lines must scroll **inside** the slip rather than cross its edge.
- **The composer is a gate fixture.** `PasteEditor` must keep: a title input whose
  placeholder contains the word "title", a submit control whose accessible text
  contains the literal uppercase `ENCRYPT`, and a counter reading `N CHARS`.
  `PasteCreated` must render the share address as an `<a href*="/p/">`.
  These are contracts, not styling choices — `verify-browsers` drives them.
- **Motion is declarative CSS only** (`anim-rise`, `anim-fade`, `anim-seal`,
  `anim-dissolve`, `ember-pulse`) and everything collapses under
  `prefers-reduced-motion`. No animation runtime, no layout thrash.

## Work Guidance

- Reuse an existing component before adding one; the app is deliberately small.
- New interactive controls need keyboard access, a visible focus ring (the global
  `:focus-visible` rule), and an accessible name — axe runs on six pages.
- Prefer a word to an icon. The icon set was deliberately reduced to the seal and a
  handful of hand-drawn glyphs.

## Verification

- `node scripts/verify-a11y.mjs` — axe plus the surface-polarity assertion.
- `node scripts/verify-browsers.mjs` — the compose → seal → open journey in
  Chromium, Firefox and WebKit, including the WebKit path that once failed on CSP.
- `node scripts/verify-budget.mjs` — the homepage payload budget.

## Child DOX Index

None. Component-local rules are short enough to live here.
