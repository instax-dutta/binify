# src/test — integration tests

## Purpose

Tests that need a **real PostgreSQL**: the properties they assert (exactly-once
burn, atomic rate limiting, rotation) hold only under genuine row locking, and a
mock would prove nothing.

## Ownership

Owns integration coverage of the database layer and the route handlers against a
live schema.

## Local Contracts

- **They require `DATABASE_URL`** and they write to the database it names. Use a
  throwaway database, never production. CI provides a `postgres:16-alpine`
  service; on a workstation, point `DATABASE_URL` at a local Postgres and run
  `npm run migrate` first.
- **Test the concurrency, not the happy path.** `pastes.integration.test.ts`
  asserts that N concurrent reads of a one-read paste yield exactly one result and
  the rest 404; rate-limit tests assert the counter is atomic. Weakening these to
  sequential calls would remove the only thing they are for.
- **They run with `--test-concurrency=1`** (`npm run test:integration`), because
  the assertions assume they control the database.
- **Never point these at production Neon**, and never commit a connection string.

## Work Guidance

- Prefer a new assertion about a real invariant to a new snapshot of behaviour.
- Keep the suite runnable in CI in under a minute; it is on the critical path of
  every pull request.

## Verification

- `npm run migrate && npm run test:integration` against a local Postgres.
- CI job `verify` runs them against its service container on every pull request.

## Child DOX Index

None.
