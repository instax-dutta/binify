# src/app/api — the HTTP API

## Purpose

The only surface that touches the database. Paste creation, retrieval (which
burns), rotation, recall, schema initialisation, and scheduled housekeeping.

## Ownership

Owns request handling, authorisation, response shape and the atomicity of the
paste lifecycle. The SQL that makes those atomic lives in `src/lib/pastes.ts`.

## Local Contracts

- **Everything fails closed.** `/api/init` requires `Bearer INIT_SECRET`;
  `/api/cron/*` require `Bearer CRON_SECRET`. A missing secret refuses the request —
  never a fallback, never an "allow if unset". `safeCompare` does the comparison.
- **One error shape, from one place.** Wrap the handler body in `try/catch` and
  return `errorResponse(err, context)`. It produces `{ error, code }` for an
  `ApiError`, and `{ error, requestId }` for anything unexpected — the request id is
  also written to the server log so a report can be correlated, and **no internal
  detail** (driver text, SQL, hostnames, the app role) may reach the body.
- **Every response goes through `apiHeaders()`** — `no-store, no-cache,
  must-revalidate, private` plus `nosniff`. Paste material must never be cached by a
  CDN or intermediary.
- **`/api/paste` (POST) is public by design** — a pastebin is open — but it is rate
  limited and size capped. Do not add `INIT_SECRET` to it; that secret guards
  schema initialisation, not paste creation.
- **Reading is atomic.** `GET /api/paste/[id]` performs the burn in a single SQL
  statement; the browser tests and integration tests both assert exactly-once under
  concurrency. Do not "read then delete".
- **A missing paste is always the same answer.** Unknown, expired, purged and
  exhausted all return 404 with the same body: no oracle about which.
- **Rotate issues a new id**; the old address stops resolving immediately.
- **Never log a request body, a token, or a URL fragment.** Use `logger` and
  `sanitizeError`; the fragment never reaches the server anyway, and the logs must
  not reintroduce it.

## Routes

| Route | Auth | Notes |
|---|---|---|
| `POST /api/paste` | public, rate limited | seals a paste, returns id + burn slip |
| `GET /api/paste/[id]` | none | burns when the limit is reached |
| `DELETE /api/paste/[id]` | burn slip in `?token=` | recall |
| `POST /api/paste/[id]/rotate` | burn slip in body | new address |
| `POST /api/init` | `INIT_SECRET` | applies the schema under an advisory lock |
| `GET /api/cron/cleanup` | `CRON_SECRET` | purges expired rows and stale limits |
| `GET /api/cron/keepalive` | `CRON_SECRET` | `SELECT 1`; a probe, not a warmer |

## Work Guidance

- Keep handlers thin: validate, call `src/lib`, shape the response. Business rules
  belong in `src/lib` where they can be tested without a server.
- Rate-limit verdicts are passed to `apiHeaders(verdict, limit)` so clients can back
  off; a 429 also carries `Retry-After`.

## Verification

- `node scripts/verify-observability.mjs` — a real 500 carries a request id, leaks
  nothing internal, and a client error stays readable.
- `node scripts/verify-keepalive.mjs` — the probe refuses anonymous and wrong tokens.
- `npm run test:integration` — burn-after-read and rate-limit atomicity against a
  live Postgres; the point of those tests is concurrency, not coverage.
