# Moving to Neon

The app stores everything in one Postgres database, so moving off the
self-hosted cluster on pelican is a connection-string change, not a migration.

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
   DATABASE_URL=postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/binify?sslmode=require
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

Keep the pelican cluster running until Neon has served real traffic. Reverting is
replacing one environment variable and re-running `npm run migrate` — the schema
is identical because both use `src/lib/db.ts`.

## Disconnecting the tunnel

The `pelican-pg` tunnel is no longer needed. On pelican there are currently two
connectors for it:

- a host process using `~/.cloudflared/config.yml`
- a Docker container started with `--token` in its argv, which is why the token
  shows up in `ps`

The systemd unit references `/etc/cloudflared/token`, which does not exist, so
it sits in `activating` — that is why there are two. None of it is publicly
reachable: `pg.aeglyn.site` has no DNS record.
