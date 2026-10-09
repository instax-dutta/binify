/**
 * G13: the operational runbook states what an operator needs to run and recover
 * the service.
 *
 * Documentation drifts silently and nobody notices until an incident. The
 * claims that are cheap to get wrong — which variables exist, how to recover,
 * what must never be committed — are asserted here so a deletion fails loudly.
 */

import { read, assertAll, pass } from './lib/harness.mjs';

const doc = read('docs/neon-migration.md');

/** Case-insensitive presence check. */
const mentions = (...terms) => terms.every((t) => doc.toLowerCase().includes(t.toLowerCase()));

assertAll([
    {
        name: 'every required environment variable is documented',
        ok: mentions('DATABASE_URL', 'TOKEN_PEPPER', 'INIT_SECRET', 'CRON_SECRET'),
        detail: 'one or more required variables are missing from the runbook',
    },
    {
        name: 'the optional tuning variables are documented',
        ok: mentions('MAX_PASTE_SIZE', 'TRUST_PROXY', 'DATABASE_POOL_MAX'),
        detail: 'optional variables are missing from the runbook',
    },
    {
        name: 'the recovery story is written down',
        ok: mentions('point-in-time', 'restore'),
        detail: 'no recovery or restore procedure is documented',
    },
    {
        name: 'the retention window is flagged as plan-dependent',
        ok: mentions('retention'),
        detail: 'retention is stated without noting it comes from the Neon plan',
    },
    {
        name: 'least privilege is stated',
        ok: mentions('binify_app', 'owner'),
        detail: 'the role split between the app role and the owner is undocumented',
    },
    {
        name: 'the decommissioned self-hosted cluster stays out of the plan',
        ok: /has been decommissioned/.test(doc),
        detail: 'the old self-hosted cluster is described as a live option',
    },
    {
        // A runbook that repeats a credential is worse than no runbook.
        name: 'contains no credential literal',
        // Angle-bracket placeholders are fine; anything else is suspect.
        ok: !/npg_[A-Za-z0-9]{10,}|neondb_owner|postgresql:\/\/[\w.-]+:[^@<\s"']{3,}@/.test(doc),
        detail: 'the runbook appears to contain a live credential',
    },
]);

pass('DOCS PASS');