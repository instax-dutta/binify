# .github/workflows — continuous integration

## Purpose

`ci.yml` is the merge gate: it runs the suite on every pull request and on every
push to `main`, against a real Postgres, and it is what makes "verified" mean
something for work that did not happen on the author's machine.

## Ownership

Owns what CI must run and what it must never do. The gates themselves live in
`scripts/`.

## Local Contracts

- **Triggers.** `pull_request` (any branch) and `push` to `main`. Production
  deploys come from Vercel on merge; CI's job is to make an unverified merge
  impossible, not to deploy.
- **A real database, always.** Integration tests run against the `postgres:16-alpine`
  service container with credentials that exist only inside CI. A mocked database
  would make the atomicity tests meaningless.
- **The credential rule.** The workflow may contain the ephemeral CI service
  credentials and nothing else: no `npg_…`, no `neondb_owner`, no real token, and
  nothing from the `secrets` context written into a file. `verify-ci` rejects a
  workflow that violates this.
- **No step may swallow its own failure.** A step ending in `|| true`, or one that
  only checks a command is *mentioned*, asserts nothing. `verify-ci` scans for that
  pattern and also runs the type checker and linter itself, so a red `tsc` or
  `eslint` cannot pass CI by being merely listed.
- **Keep the runtime honest.** The job installs browsers for the cross-browser and
  accessibility gates, uses `npm ci` (lockfile-exact), and stays inside the timeout;
  a flaky gate is worse than a slow one.

## Work Guidance

- New verification belongs in a `scripts/verify-*.mjs` gate that runs locally too;
  CI should invoke it, not reimplement it.
- If a step must be advisory, say so in its name and open an issue — do not use
  `|| true`.

## Verification

- `node scripts/verify-ci.mjs` — checks the workflow's triggers, steps, credentials
  and the `|| true` ban, and executes `tsc --noEmit` and `eslint` itself.
- The CI run on the pull request is the final word; never merge a red `verify`.

## Child DOX Index

None.
