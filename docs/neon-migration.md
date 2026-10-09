# Database

The app stores everything in one Postgres database on Neon. The client is `pg`
and the schema lives in `src/lib/db.ts`; changing where it runs is a
connection-string change, not a migration.

## Why Neon rather than a Cloudflare tunnel

A tunnel gives a public hostname, but Postgres does not speak HTTP and Vercel
cannot run a `cloudflared` client. Making a tunnel work would need an extra
HTTP↔Postgres bridge in front of it — more components to secure, not fewer.
Neon is built for exactly this: a serverless Postgres with a pooled endpoint
reachable over the network from Vercel functions.

## Steps

1. Create a Neon project. Pick the region closest to the Vercel region; if you
   change `regions` in `vercel.json`, match it.
2. Copy the **pooled** connection string. It contains `-pooler` in the hostname.
   The direct one will exhaust backend slots under serverless concurrency.
3. Put it in `.env.local` (gitignored, never commit it):

   ```
   DATABASE_URL=postgresql://<app-role>:<password>@<pooler-host>/<database>?sslmode=require
   ```

   Leave `DATABASE_SSL=true` (the default).
4. Apply the schema:

   ```bash
   npm run db:check     # reachability + round-trip latency
   npm run migrate
   npm run test:integration
   ```

## Things that behave differently on Neon

**Scale to zero.** The Free plan suspends compute after 5 minutes idle and this
cannot be disabled. The first query after a quiet period pays a few hundred
milliseconds to wake it, plus a cold Postgres buffer cache. Measured worst
case, a read is roughly 2× slower than warm. The driver already allows a 10 s
connection timeout, which covers it. Launch ($0 minimum, pay-as-you-go) lets
you disable scale-to-zero.

**Egress is the real budget, not storage.** You get 5 GB/month of transfer. Each
paste *read* pulls its payload back out of the database, so `MAX_PASTE_SIZE`
multiplies directly into how many reads you can serve:

| `MAX_PASTE_SIZE` | Full-size reads per month |
|---|---|
| 4 MB (default) | ~1,250 |
| 1 MB | ~5,000 |
| 256 KB | ~20,000 |

Set `MAX_PASTE_SIZE` in the environment to trade maximum paste size for volume.
It defaults to 4 MB, so nothing changes unless you set it.

**Exceeding the egress allowance suspends compute** until the next billing
period rather than simply billing overage. Your site goes dark, so set
`MAX_PASTE_SIZE` deliberately.

## Optional: consumption quotas

Neon can suspend a project when it reaches a compute-time or transfer limit you
set. Configuring those means hitting a limit is a deliberate stop rather than a
surprise outage.

## Rolling back

An earlier development setup ran a self-hosted PostgreSQL cluster on a remote
machine. It has been decommissioned; the app talks only to Neon. To move
somewhere else, replace one environment variable and re-run `npm run migrate` —
the schema is defined once, in `src/lib/db.ts`.

## Backups and point-in-time recovery

**The plan is Neon point-in-time recovery, not logical dumps.** A branch on Neon
is a copy-on-write clone: restoring is a branch reset, not a `pg_restore` at
3am with a hand-written `pg_dump`.

| Setting | Value | Why |
|---|---|---|
| Point-in-time recovery | Enabled | Restores to any second in the retention window |
| Retention | Plan default — confirm on the Neon console | Decides the real recovery-point objective |
| Backups | Plan default — confirm on the Neon console | Protects against a region-level problem PITR may not cover |
| Production branch | Single branch, `production` | Paste IDs are random, so a restore costs no reconciliation |

Point-in-time recovery restores to a *new* branch. Validate a restore by
promoting it and re-running the suite against it:

```
# Neon console or psql, then:
DATABASE_URL=<restored branch> npm run migrate
DATABASE_URL=<restored branch> npm run test:integration
```

Two properties make a restore safe here. Paste IDs are 14 random characters, so
nothing collides with the original branch, and every paste is immutable and
single-use, so a restore cannot leave a half-consumed paste. There is no
user account row to reconcile.

**Check this before going live.** Retention and backup windows are properties of
the Neon plan, not of this repository, so they cannot be asserted by a test.
Confirm them on the console and keep the table above honest.

## Environment variables

Everything the app needs, in one place. No value belongs in git.

| Variable | Required | Purpose |
|---|---|---|
| `DATABASE_URL` | yes | Pooled `binify_app` URI. The app role, never the owner |
| `DATABASE_SSL` | no | `true` on Neon. Defaults to requiring TLS |
| `DATABASE_POOL_MAX` | no | Pool ceiling per process. Keep well under the role limit |
| `TOKEN_PEPPER` | yes | Server-side pepper for deletion-token hashes. Rotating it invalidates outstanding revocation links |
| `INIT_SECRET` | yes | Bearer token guarding paste creation |
| `CRON_SECRET` | yes | Bearer token guarding the expiry cron endpoint |
| `MAX_PASTE_SIZE` | no | Payload ceiling in bytes. See the egress table above |
| `TRUST_PROXY` | no | `true` only behind a proxy that sets `x-forwarded-for` |

### A note on `TOKEN_PEPPER`

Deletion tokens are `HMAC-SHA256(pepper, id)`. The pepper is why a stolen
database dump does not let an attacker revoke other people's pastes. Two
consequences follow:

- It must exist in production, and must not be the same value anywhere else.
- Rotating it silently invalidates every outstanding revocation link. Existing
  pastes are unaffected; only the ability to delete an already-created paste is.

### Least privilege

`binify_app` holds `USAGE` and `CREATE` on the schema and nothing else. The
application never needs the Neon owner role, and the owner password exists only
for administration. If it is ever exposed, rotate it in the Neon console; the
running application is unaffected because it does not use it.
