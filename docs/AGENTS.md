# docs — the operator runbook

## Purpose

What an operator needs to run and recover Binify: the database, the environment,
the limits that can take the service down, and how to restore it.

## Ownership

Owns operational truth. Code owns behaviour; this subtree owns the instructions
for the infrastructure the code cannot see (Neon plan settings, console actions,
retention windows).

## Local Contracts

- **`neon-migration.md` is asserted by a gate.** `scripts/verify-docs.mjs` fails if
  the runbook stops listing every required environment variable, the recovery
  procedure, the role split, the retention caveat, or if it ever contains a
  credential literal. Keep those sections when editing.
- **State what is *not* known.** The Neon PITR retention window is a property of the
  account plan, not of this repository; the runbook says so and the owner confirms
  it. Do not invent a number.
- **Document the two failure modes separately.** Scale-to-zero suspends the compute
  and resumes on the next connection (not an outage); a consumption quota suspends
  it until the billing period resets and *does not* wake on a new connection. The
  runbook must keep that distinction — it is the reason a keepalive is not the fix
  for quota exhaustion.
- **Never place a real value in these files** — only `<placeholders>`. Angle-bracket
  placeholders are what the credential check allows.
- **Change the runbook in the same pull request as the behaviour.** A new required
  variable, a changed limit, or a new console action is undocumented until it is
  written here.

## Work Guidance

- Facts an operator can verify in a console belong here; facts the code enforces
  belong in the nearest source `AGENTS.md`.
- Owner actions that cannot be automated are listed in `GATES.md`, not duplicated
  here.

## Verification

- `node scripts/verify-docs.mjs` — runbook content and credential hygiene.

## Child DOX Index

None.
