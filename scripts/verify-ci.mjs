/**
 * G8: continuous integration runs the whole suite on every pull request, and
 * the commands it claims to run actually succeed.
 *
 * The workflow definition is checked against the file, and then the two checks
 * that had been failing silently are executed here. A workflow that names a
 * step proves nothing if the step does not pass.
 */

import { spawnSync } from 'node:child_process';
import { read, assertAll, pass } from './lib/harness.mjs';

const wf = read('.github/workflows/ci.yml');

/** Run one of CI's commands and report whether it exited cleanly. */
function ran(bin, args) {
    const r = spawnSync(bin, args, {
        encoding: 'utf8',
        timeout: 10 * 60_000,
        env: { ...process.env, NODE_ENV: 'development' },
    });
    if (r.error) return { ok: false, detail: `${bin} failed to start: ${r.error.message}` };
    const out = `${r.stdout}\n${r.stderr}`.trim();
    return {
        ok: r.status === 0,
        detail: out ? out.split('\n').slice(-8).join('\n') : '',
    };
}

const typecheck = ran('node_modules/.bin/tsc', ['--noEmit']);
const lint = ran('node_modules/.bin/eslint', ['.']);

assertAll([
    { name: 'workflow file exists', ok: wf.length > 0, detail: 'workflow is empty or missing' },
    { name: 'triggers on pull requests', ok: /pull_request/.test(wf), detail: 'no pull_request trigger' },
    { name: 'triggers on push to main', ok: /\bpush\b/.test(wf) && /main/.test(wf), detail: 'no push-to-main trigger' },
    { name: 'installs dependencies with npm ci', ok: /npm ci/.test(wf), detail: 'npm ci missing' },
    { name: 'runs the type checker', ok: /tsc --noEmit|typecheck/.test(wf), detail: 'no typecheck step' },
    { name: 'runs lint', ok: /npm run lint|eslint/.test(wf), detail: 'no lint step' },
    { name: 'runs the test suites', ok: /npm test|verify-suite/.test(wf), detail: 'no test step' },
    {
        name: 'runs integration tests against a real database',
        ok: /test:integration|DATABASE_URL/.test(wf),
        detail: 'integration tests are not wired to a database',
    },
    {
        name: 'provides the integration database as a service',
        ok: /image:\s*postgres/.test(wf),
        detail: 'no postgres service container',
    },
    {
        // The test database credentials belong to an ephemeral CI service
        // container. What must never appear is a real production credential or
        // a secrets-context value being written into a tracked file.
        name: 'contains no production credential literal',
        ok: !/npg_[A-Za-z0-9]{8,}|neondb_owner|eyJ[A-Za-z0-9_-]{20,}/.test(wf),
        detail: 'workflow contains what looks like a real credential',
    },
    {
        name: 'does not persist the secrets context to a file',
        ok: !/secrets\.[A-Z_]+.*(>|>>|tee|write)/.test(wf),
        detail: 'workflow writes a secret into a file',
    },
    {
        name: 'installs browsers for the browser gates',
        ok: /playwright install/.test(wf),
        detail: 'no playwright install step',
    },
    {
        // A step wrapped in `|| true` can never fail, so it asserts nothing.
        name: 'has no step that swallows its own failure',
        ok: !/\|\|\s*true/.test(wf),
        detail: 'a workflow step ends in || true and cannot fail',
    },
    {
        name: 'the type checker passes right now',
        ok: typecheck.ok,
        detail: `tsc --noEmit failed:\n${typecheck.detail}`,
    },
    {
        name: 'lint passes right now',
        ok: lint.ok,
        detail: `eslint failed:\n${lint.detail}`,
    },
]);

pass('CI PASS');