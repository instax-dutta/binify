# scripts — the gates, the ledger, and operator utilities

## Purpose

The executable evidence for this project. Every `verify-*.mjs` measures one
claim about the built application and prints a marker; `GATES.md` at the repo
root records which of them passed. Plus the database utilities an operator runs
by hand.

## Ownership

Owns verification. The root `AGENTS.md` states the rule this subtree enforces:
a gate's `CHECK` and `EXPECT` are the contract, and neither is edited to make a
failing build pass.

## Local Contracts

- **A gate must be able to fail.** Before trusting one, break the thing it
  measures and watch it fail. `verify-a11y` looked healthy for weeks while
  ignoring contrast on gradient surfaces precisely because its check could not
  see the defect; it now asserts surface polarity directly.
- **One gate, one claim, one marker.** Each script prints a stable marker
  (`A11Y PASS`, `HEADERS PASS`, …) that `GATES.md` names in its `EXPECT`. Changing
  a marker means updating the ledger in the same change.
- **Gates need a production build.** They run `next start` against `.next`, so run
  `npm run build` first. Most take no arguments and choose a free port themselves.
- **Never silence a step.** A command wrapped in `|| true`, or a gate that only
  greps for the *existence* of a check, asserts nothing. `verify-ci` actively
  rejects such steps in the workflow file.
- **Database-backed gates** (`verify-suite`, `verify-browsers`,
  `verify-pending-ui`, `verify-observability`, `verify-keepalive`) need a reachable
  `DATABASE_URL`. When the real database is unreachable from the test host, point
  them at a throwaway Postgres (a `postgres:16-alpine` container plus
  `npm run migrate`) exactly as CI does — do not skip them.
- **Run gates one loop at a time.** They build and start servers; two concurrent
  loops race over `.next` and produce false failures.

## Utilities

| Script | Purpose |
|---|---|
| `migrate.ts` | applies `SCHEMA_SQL`; the only way to create the schema |
| `check-db.ts` | connectivity and round-trip latency; run it from the host that will serve traffic |
| `neon-compute.ts` | reads/sets the Neon compute's `suspend_timeout_seconds` (`--timeout 0` keeps it resident) |

## Work Guidance

- When a gate's subject changes, update the gate in the same change — a stale gate
  is a false claim.
- Diagnostics belong in the gate's stderr, not in a marker: the marker is compared
  against the ledger.
- New measurements get a new `verify-*.mjs` and a new ledger entry, never an extra
  assertion quietly bolted onto an unrelated gate.

## Verification

- `node scripts/verify-all.mjs` runs the set; `GATES.md` is the record.
- `node /path/to/unlazy/scripts/gate-lint.mjs GATES.md` validates ledger syntax.

## Child DOX Index

- `scripts/lib/AGENTS.md` — the shared harness, and the sharp edges it exists to
  contain.
