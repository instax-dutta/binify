# src/lib — domain core

## Purpose

Framework-free logic: the cryptography, the database, the security primitives,
rate limiting, validation and logging. This is the only layer that may be tested
without a browser or a server.

## Ownership

Owns the correctness boundaries of the product — especially the burn and the
cipher. Route handlers in `src/app/api` are thin wrappers over these modules.

## Local Contracts

- **`crypto.ts` — do not weaken the envelope.**
  - `sealPaste` / `openSealed` put the descriptive fields (title, language,
    expiry, view limit) **inside** the ciphertext so the GCM tag authenticates
    them; the server's cleartext columns are only a convenience and must never be
    trusted when the sealed copy exists.
  - New pastes derive keys with **Argon2id**; **PBKDF2 remains only to read older
    slips**. Never remove the legacy read path, and never lower an iteration
    count or change a parameter name — existing pastes would stop opening.
  - The key lives in the URL fragment and must never be sent anywhere.
- **`db.ts`** — one pooled Neon connection built from `DATABASE_URL`; `SCHEMA_SQL`
  is the single definition of the schema; `initializeDatabase` runs under a
  Postgres advisory lock so concurrent cold starts cannot race.
- **`pastes.ts`** — the lifecycle in SQL, because only the database can make these
  atomic: create, read (burn in **one** statement), rotate, revoke. Exactly-once
  burn under concurrency is the property the integration tests exist to prove.
- **`security.ts`** — `hashDeletionToken` (HMAC with `TOKEN_PEPPER`) and
  `safeCompare` (constant-time). The pepper fails closed when unset: a missing
  pepper must throw rather than hash with an empty key.
- **`rate-limit.ts`** — durable counters in Postgres, not memory. `limits.ts` holds
  the in-process read limiter and the `RATE_LIMITS` table.
- **`validation.ts`** — the zod schemas plus `calculateExpiration` (unit tested in
  `validation.test.ts`; the test mocks the clock).
- **`paste-size.ts`** — `MAX_PASTE_SIZE` is bytes of **ciphertext**, and the parser
  accepts **only a plain integer**. `parseInt('1MB')` is `1`, which would clamp to
  the 1 KB floor and silently cap every paste; anything unparseable falls back to
  the default. Do not "helpfully" accept unit suffixes.
- **`logging.ts`** — `sanitizeError` reduces an unknown throw to message and name.
  Never log a credential, a token, a request body or a connection string.
- **`utils.ts`** — `cn` and `handleResponse` (shared response reader).
- **`ip.ts`** — client IP resolution; it trusts `x-forwarded-for` **only** when
  `TRUST_PROXY=true`, because doing otherwise lets a caller forge their identity.

## Work Guidance

- Prefer SQL to application logic when the property is "exactly once".
- Keep modules free of Next.js imports so tests stay fast and hermetic.
- A new rule earns a test in the same change; the unit suite is cheap.

## Verification

- `npm test` — unit tests beside the modules they cover.
- `npm run test:integration` — the database and concurrency properties.
- `node scripts/verify-observability.mjs` — the logger leaks no infrastructure.

## Child DOX Index

None. Each module is described above; a module needing more than a paragraph
should probably be split instead.
