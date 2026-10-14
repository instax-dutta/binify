# DOX framework

- DOX is highly performant AGENTS.md hierarchy installed here
- Agent must follow DOX instructions across any edits

## Core Contract

- AGENTS.md files are binding work contracts for their subtrees
- Work products, source materials, instructions, records, assets, and durable docs must stay understandable from the nearest applicable AGENTS.md plus every parent AGENTS.md above it

## Read Before Editing

1. Read the root AGENTS.md
2. Identify every file or folder you expect to touch
3. Walk from the repository root to each target path
4. Read every AGENTS.md found along each route
5. If a parent AGENTS.md lists a child AGENTS.md whose scope contains the path, read that child and continue from there
6. Use the nearest AGENTS.md as the local contract and parent docs for repo-wide rules
7. If docs conflict, the closer doc controls local work details, but no child doc may weaken DOX

Do not rely on memory. Re-read the applicable DOX chain in the current session before editing.

## Update After Editing

Every meaningful change requires a DOX pass before the task is done.

Update the closest owning AGENTS.md when a change affects:

- purpose, scope, ownership, or responsibilities
- durable structure, contracts, workflows, or operating rules
- required inputs, outputs, permissions, constraints, side effects, or artifacts
- user preferences about behavior, communication, process, organization, or quality
- AGENTS.md creation, deletion, move, rename, or index contents

Update parent docs when parent-level structure, ownership, workflow, or child index changes. Update child docs when parent changes alter local rules. Remove stale or contradictory text immediately. Small edits that do not change behavior or contracts may leave docs unchanged, but the DOX pass still must happen.

## Hierarchy

- Root AGENTS.md is the DOX rail: project-wide instructions, global preferences, durable workflow rules, and the top-level Child DOX Index
- Child AGENTS.md files own domain-specific instructions and their own Child DOX Index
- Each parent explains what its direct children cover and what stays owned by the parent
- The closer a doc is to the work, the more specific and practical it must be

## Child Doc Shape

- Create a child AGENTS.md when a folder becomes a durable boundary with its own purpose, rules, responsibilities, workflow, materials, or quality standards
- Work Guidance must reflect the current standards of the project or user instructions; if there are no specific standards or instructions yet, leave it empty
- Verification must reflect an existing check; if no verification framework exists yet, leave it empty and update it when one exists

Default section order:
- Purpose
- Ownership
- Local Contracts
- Work Guidance
- Verification
- Child DOX Index

## Style

- Keep docs concise, current, and operational
- Document stable contracts, not diary entries
- Put broad rules in parent docs and concrete details in child docs
- Prefer direct bullets with explicit names
- Do not duplicate rules across many files unless each scope needs a local version
- Delete stale notes instead of explaining history
- Trim obvious statements, repeated rules, misplaced detail, and warnings for risks that no longer exist

## Closeout

1. Re-check changed paths against the DOX chain
2. Update nearest owning docs and any affected parents or children
3. Refresh every affected Child DOX Index
4. Remove stale or contradictory text
5. Run existing verification when relevant
6. Report any docs intentionally left unchanged and why

## User Preferences

When the user requests a durable behavior change, record it here or in the relevant child AGENTS.md

## Binify — project rail

Binify is a zero-knowledge encrypted pastebin. A pasted secret is sealed in the
visitor's browser (AES-256-GCM, key carried in the URL fragment, never sent to a
server); the server stores ciphertext and envelope metadata only. A paste burns on
a timer, on a number of readings, or on first reading, and can be recalled with a
burn slip.

**Stack.** Next.js 16 (App Router, Turbopack) · React 19 · TypeScript strict ·
Tailwind v4 plus the hand-written Sanctum layer in `src/app/globals.css` ·
Neon Postgres as the single data store (Redis and Turso were removed) ·
Vercel production (`iad1`) · GitHub Actions for CI.

**Non-negotiables.**

- **Secrets never travel.** Do not print, commit, or paste credentials. `.env.local`
  is gitignored; production values live in Vercel as write-only secrets. The app
  connects with the least-privileged `binify_app` role — never `neondb_owner`.
- **`TOKEN_PEPPER`, `INIT_SECRET`, `CRON_SECRET` must exist in any environment that
  serves traffic**, and the code fails closed without them. Do not add a fallback.
- **`GATES.md` is the completion ledger and its checks are the contract.** Never
  edit a `CHECK`, `EXPECT`, or gate script so that a failing build passes — fix the
  code, or add a new gate. A gate that cannot fail is worse than no gate.
- **Two surfaces, one rule:** ink on paper, vellum on night. `verify-a11y` asserts
  this polarity directly because axe cannot judge contrast over the slip's gradient
  and grain.
- **Ship through CI.** Feature branch → pull request → CI `verify` → merge to `main`
  → Vercel production → verify the live domain. Never push straight to `main`.

**Workflow.**

- Heavy work (builds, browsers, integration tests) belongs on the test host, not a
  laptop; the laptop may legitimately have no `node_modules`.
- Before claiming anything is done, run the `scripts/verify-*.mjs` gates that cover
  the change, then re-read `GATES.md` and update the ledger honestly.
- The design language, tokens and component grammar are specified in `DESIGN.md`
  and `.design/round-01/SPEC.md`; read them before changing appearance.

**Verification.** CI job `verify` in `.github/workflows/ci.yml` runs the type
checker, lint, unit tests, integration tests against a Postgres service, the build,
and the static gates. From a workstation, `npm run build` plus the individual
`scripts/verify-*.mjs` gates cover the same ground; `GATES.md` records which pass.

## Child DOX Index

- `src/AGENTS.md` — application source: routes, components, domain logic, tests.
- `scripts/AGENTS.md` — the executable gates, the harness they share, and the ledger rules.
- `docs/AGENTS.md` — the operator runbook for the database and its recovery.
- `.github/workflows/AGENTS.md` — what CI must run, and what it must never do.
- `public/AGENTS.md` — brand assets, the manifest, and the asset budget.
