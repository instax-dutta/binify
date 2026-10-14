# scripts/lib — the shared gate harness

## Purpose

`harness.mjs` is what every gate stands on: it starts a production server, hands
the test a base URL, and guarantees the server dies. Most of the bugs in this
directory were the harness failing to do exactly that, so the contract is written
down here.

## Ownership

Owns process lifecycle and the tiny shared vocabulary (`pass`, `fail`,
`assertAll`, `read`, `exists`, `withBrowser`). Gate scripts own their assertions.

## Local Contracts

- **`withServer(fn)` and `withBrowser(fn, {name})` return their callback's value.**
  Discard it and the gate silently passes — this bug existed here once. If a gate
  computes a verdict inside the callback, it must `return` it out.
- **`pass()` and `fail()` call `process.exit`.** Any `finally` in the caller then
  never runs. Clean up before deciding, not in a `finally` that assumes a normal
  return.
- **The server is killed by the port it owns.** `next start` daemonises itself
  (`next-server`), leaves the process group and is adopted by init, so a group
  signal misses it and a name pattern misses its renamed process. `killListenerOn`
  sweeps `ss`/`lsof` for the port that `freePort()` handed out. Do not "simplify"
  this away: a leaked server per gate exhausted a small test host and broke an
  unrelated run.
- **An exit hook backs the sweep.** Because `pass`/`fail` exit, teardown is also
  registered on `process.exit` and disarmed once the tidy path has run.
- **Servers bind `127.0.0.1` and take a random free port**; gates must never
  assume a fixed port.
- **Everything runs sequentially.** Playwright browsers are launched one at a
  time; parallel renders on a small host are slower and less stable.

## Work Guidance

- A gate that needs a temporary route or file must remove it in every exit path,
  including failure — `verify-error-boundary` and `verify-observability` show the
  pattern (build the probe, run, remove, verify removal, only then decide).
- Quote and reset `NODE_ENV=production` for anything that spawns the app.

## Verification

- Any gate run exercises this file; `node --check scripts/lib/harness.mjs` for
  syntax.

## Child DOX Index

None.
