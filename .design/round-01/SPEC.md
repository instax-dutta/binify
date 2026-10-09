# Binify — Design Spec: "Sanctum" (locked, round 01 → 02)

## The task
Compose a secret, seal it, hand over a one-time link. The product's promises:
encryption never leaves the visitor's machine, the server holds noise, the paste
dies on read, self-destructs on a timer, and can be recalled.

## North star
Entering the site feels like entering a candlelit order: one vellum slip in a
vast darkness, worked by hand, sealed with wax. Spoken once, then silence.

## Tone (five dials, evidence-driven)
- Energy: QUIET — a secret deserves hush. One glow, one color event (wax).
- Finish: REFINED — soft edges, hairline rules, no hard shadows except the slip.
- Density: SPARSE — one object on a screen; the darkness is the layout.
- Weight: HEAVY-ish — the slip is physical, serif carries ink weight.
- Solemnity: SOLEMN — no jokes, no caps-lock hacker voice, ritual wording.

## Signature moments (two, everything else stays quiet)
1. PRESS THE SEAL: the wax disc is the primary action. On press it sinks
   (scale .93), and in the sealed state a fresh seal is pressed with a
   spring overshoot (scale 1.6 → 1, 500ms cubic-bezier(.2,1.5,.4,1)).
2. THE BURN: on the viewer, after the one read, the payload's text lifts,
   blurs and dissolves upward like smoke — then the "returned to ash" line
   fades in. Timer/view-limit states show the ember line glowing down.

## Color identity (night family — dark is a MATERIAL here, not a default)
- --night #0f0c09 base; --night-hi #171310 for any raised surface
- --vellum #ece1cb paper; --vellum-dim #e2d5bc gradient end
- --ink #2b241a on paper; --ink-soft #5b5040
- --amber #c9a25a: ONLY for the sigil link, the word BURN, focus rings.
  Budget: amber never exceeds ~5% of any screen.
- --wax #7a2e2a / --wax-deep #4d1d1a: the seal disc and burn states only.
- Contrast check: vellum on night ≈ 15.9:1; amber on night ≈ 8.7:1; ink on
  vellum ≈ 12.4:1. All pass AA/AAA at their sizes.

## Typography
- Voice: Cormorant Garamond 500 (italic for mottos, 600 for the seal).
- Data: IBM Plex Mono 400/500, 10–14px, letterspaced small caps for labels.
- Scale: motto 21px italic → slip labels 10px/0.34em → message 19px/1.55 →
  link 14px amber. Nothing between 22 and 28: the whisper stays whispering.

## Control grammar
- Hairlines only on paper (rgba ink .4); inputs are underlines, never boxes.
- Selects: mono text + ▾ caret, underline; never pill-shaped.
- The ONE filled control in the whole app is the wax seal.
- Copy buttons: transparent, 1px vellum-hair border, mono letterspaced;
  hover lifts border+text to amber. Press = translateY(1px).
- Focus: 1px amber outline offset 3px, keyboard-visible everywhere.

## Iconography
No icon font, no Lucide. The app has exactly three glyphs, hand-drawn inline
SVG in the Sanctum line language (1.6px round-cap strokes):
- key sigil (circle + diagonal stem + two teeth) = encrypt action
- flame sigil = burned/expired states
- broken sigil (key with snapped stem) = revoked/not-found states
Everything else is words.

## Structure per page
- COMPOSER (home): nav (THE BURN ARCHIVE + 3 links) / motto / vellum slip
  (name, message, burns+guard, seal) / night-foot. The slip may grow with
  content; the seal zone is always visible after it.
- SEALED: fresh seal centered, whisper line, amber sigil link, meta line,
  copy button. The slip itself is gone — what is delivered is a sigil, not a
  document.
- VIEWER: the slip arrives with the payload in serif; a candle-glow vignette;
  RETENTION LINE under the message ("returns to ash in X" / "X reads remain",
  drawn as a glowing ember tick row, not a number alone); actions: copy,
  recall (only if slip carries a burn slip). After read/burn: smoke dissolve
  → "returned to ash" with flame sigil.
- REVOKED / 404 / EXPIRED: broken-sigil variant of the seal, one line, one
  way home. Never a bare error box.
- DOCS: the slip widens into a document column, same serif, hairline sections.

## Motion (three basics, per skill motion rules)
1. Enter: motto fades+rise 8px 400ms; slip rises 14px 500ms 80ms later.
   Seal zone last, 120ms more. One-way, once.
2. Press seal → sealed state: crossfade 350ms with the fresh-seal overshoot
   as the arrival accent.
3. Burn (viewer): payload dissolve 700ms ease-out; ash line fades in 300ms
   after. prefers-reduced-motion: all of it becomes opacity-only.

## What this direction refuses
- No glowing orbs, no purple, no gradient meshes, no glass cards.
- No feature-card grid — claims live as whispered lines or in DOCS.
- No terminal green anywhere; no caps-lock shouting.
- No decorative Latin; English only, spoken plainly.
- The seal is never used as a bullet, list marker, or decoration.

## Devices
Primary: desktop 1280×900 (friends sharing code), verified at 390×844:
slip goes full-width with 20px margins, motto drops to 18px, oath grid
stays two columns (5min/1day fit), nav collapses to two links.
