# src — application source

## Purpose

All product code: routes, UI, domain logic and tests. Nothing here is generated;
every file is read by the Next.js build or by a test runner.

## Ownership

Owns the application behaviour. The root `AGENTS.md` owns repo-wide rules
(secrets, gates, ship flow); this file owns how source is laid out and what each
subtree is for.

## Local Contracts

- **Path alias** `@/*` → `src/*` (see `tsconfig.json`). Use it; no deep relative paths.
- **TypeScript is strict** and `allowImportingTsExtensions` is on, so tests import
  siblings with an explicit `.ts` extension (`./crypto.ts`). Application code keeps
  extensionless imports.
- **Client vs server.** Files that touch the DOM, `useState`, `window`, or Web Crypto
  carry `'use client'`. Domain modules in `src/lib` must stay framework-free unless
  the file says otherwise — they are what makes the logic testable without a server.
- **The design system is hand-written.** Tokens and the Sanctum component grammar
  live in `src/app/globals.css`; Tailwind is present for utilities only, and its
  configured colours map to the Sanctum tokens (`night`, `vellum`, `ink`, `amber`,
  `wax`). Do not introduce a second palette.
- **No new runtime dependency without a stated reason.** The bundle budget is a gate
  (`scripts/verify-budget.mjs`), and every dependency is also a supply-chain surface.

## Work Guidance

- Put domain rules in `src/lib`, presentation in `src/components`, routing and
  rendering in `src/app`. If a rule can be tested without a browser, it belongs in
  `src/lib`.
- Comments explain *why*, never *what*. Delete a comment that restates the code.

## Verification

- `npm test` — unit tests (`tsx --test src/lib/*.test.ts`).
- `npm run test:integration` — needs a real Postgres; see `src/test/AGENTS.md`.
- `npx tsc --noEmit` and `npx eslint src/` — both are enforced by CI.

## Child DOX Index

- `src/app/AGENTS.md` — routes, pages and the middleware/proxy; page-level contracts.
- `src/app/api/AGENTS.md` — the HTTP API: auth, response shape, atomicity.
- `src/components/AGENTS.md` — UI components and the Sanctum grammar, including the
  selectors the browser gates depend on.
- `src/lib/AGENTS.md` — crypto, database, security, rate limiting, validation.
- `src/test/AGENTS.md` — integration tests that need a live database.
