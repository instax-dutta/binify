/**
 * G8: continuous integration runs the whole suite on every pull request.
 *
 * Asserted against the workflow file rather than by running GitHub, because
 * the property that matters is that the steps exist, name the real commands,
 * and are triggered by pull requests.
 */

import { read, assertAll, pass } from './lib/harness.mjs';

const wf = read('.github/workflows/ci.yml');

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
]);

pass('CI PASS');