# Self-hosted Postgres on pelican (development)

The app runs on Vercel but, for development, its single Postgres datastore is a
cluster running on `tejes@pelican`. It is deliberately built as a **completely
separate cluster** rather than a database inside the existing one.

## Why a separate cluster

`pelican` already runs a `postgresql@16-main` cluster on port 5432, and that
cluster is in use. Adding a database to it would mean sharing a port, a
configuration file, and a failure domain: a bad setting or a restart for
maintenance would take down anything else on the box, including the services
hosted there.

A second cluster with its own data directory, port, socket, logs, OS user and
systemd unit shares none of that. The two cannot collide, and neither service
unit references the other.

## Layout

| | Existing | Binify |
|---|---|---|
| Port | 5432 | **55432** |
| Data directory | `/var/lib/postgresql/16/main` | `/srv/binify-pg/data` |
| OS user | `postgres` | `binifypg` |
| Socket | `/var/run/postgresql` | `/srv/binify-pg/run` |
| Logs | `/var/log/postgresql/` | `/var/log/binify-pg/` |
| systemd unit | `postgresql@16-main` | `binify-pg.service` |

## Access control

`listen_addresses` is `127.0.0.1,<tailscale-host>` — loopback plus the Tailscale
interface. It is **not** `0.0.0.0`, so the port is unreachable from the public
internet. Development machines reach it over the tailnet.

`pg_hba.conf` enforces:

- the superuser `binify` is refused over TCP entirely and is reachable only
  through the private unix socket
- `binify_app` may connect from `100.64.0.0/10` (Tailscale) or loopback, using
  `scram-sha-256`
- every other host/user combination is `reject`

The app role additionally has `CONNECTION LIMIT 20`, a 15 s `statement_timeout`
and a 30 s `idle_in_transaction_session_timeout`.

## Operations

Use the helpers rather than typing unit names. `systemctl` is wrapped in an
interactive shell so that a bare `postgresql` target is refused instead of
guessed at — the two clusters are independent, but the wrong target is still
the most likely way to take the panel's database down:

```bash
pg-binify status              # health of the app's cluster
pg-binify restart             # restart only this cluster
pg-binify logs                # tail today's log
pg-main   status              # the Pterodactyl panel's cluster (port 5432)

psql-binify                   # admin shell on the app's database
```

`systemctl restart postgresql` prints a short refusal pointing at both helpers
and exits non-zero. Anything naming `binify-pg` is passed through untouched, and
every unrelated `systemctl` call is unaffected. The guard is scoped to
interactive shells only, so no script or existing service is affected. The
original `.bashrc` is preserved at `~/.bashrc.pre-binify-pg`.

Raw equivalents, if you ever need them:

```bash
systemctl status binify-pg.service
tail -f /var/log/binify-pg/postgresql-$(date +%F).log
sudo -u binifypg /usr/lib/postgresql/16/bin/psql -h /srv/binify-pg/run -p 55432 -U binify -d binify
```

**Never `systemctl restart postgresql` or `pg_ctlcluster 16 main restart` for
this app** — that is the Pterodactyl panel's database.


## Local development

`.env.local` (gitignored, mode 600) holds the connection string. To regenerate
it:

```bash
ssh tejes@pelican 'cat /home/tejes/.binify-pg.env'   # mode 600, owner tejes
```

Then, from the repo:

```bash
npm run db:check                 # reachability + round-trip latency
npm run migrate                  # apply the schema
npm run test:integration         # concurrency guarantees, needs DATABASE_URL
```

## Moving to production through a Cloudflare tunnel

The plan is to expose this cluster to Vercel via a Cloudflare tunnel rather than
opening a port to the internet. Before that happens:

1. Add a **read/write split of roles**. The tunnel should present a role limited
   to the `binify` database, not the superuser.
2. Terminate TLS at the tunnel and connect with `sslmode=verify-full`, pinning
   the CA. The dev URL uses `sslmode=disable` because the tailnet link is
   already encrypted by WireGuard.
3. Keep `listen_addresses` off `0.0.0.0` if the tunnel can run as an outbound
   agent; it does not need an inbound listener at all in that mode.
4. Add a `host` line in `pg_hba.conf` for the tunnel's address, and re-verify
   that everything else is still rejected.
5. Consider mTLS or Cloudflare Access in front of the tunnel. Postgres has no
   native auth for this, so the connection string would otherwise be the only
   thing standing between the public internet and the database.

Note that `statement_timeout` will need revisiting: across a tunnel, a
transcontinental round trip can exceed a tightly-set timeout for large writes.

## Teardown

```bash
systemctl disable --now binify-pg
rm /etc/systemd/system/binify-pg.service && systemctl daemon-reload
userdel binifypg
rm -rf /srv/binify-pg /var/log/binify-pg /home/tejes/.binify-pg.env
```

This touches nothing belonging to the `16/main` cluster or the Docker services.
