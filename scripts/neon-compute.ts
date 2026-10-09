/**
 * Read or change the Neon compute's scale-to-zero setting.
 *
 * This is the real answer to "keep the database from going away", and it needs
 * no traffic at all. `suspend_timeout_seconds` is how long the compute sits
 * idle before Neon parks it:
 *
 *   0    always on. Costs compute time continuously, so it is only available on
 *        the Launch and Scale plans. Nothing suspends, nothing cold-starts.
 *   300  the default. Suspends after five idle minutes and resumes in a few
 *        hundred milliseconds on the next connection.
 *   n    60 to 604800. Suspends after n idle seconds.
 *
 * Changing it requires a Neon API key, which is an administrator credential and
 * is never the credential the application uses.
 *
 *   npm run neon:compute                      report the current setting
 *   npm run neon:compute -- --timeout 0       keep the compute resident
 *   npm run neon:compute -- --timeout 1800    suspend after 30 idle minutes
 *
 * Required: NEON_API_KEY, NEON_PROJECT_ID, NEON_ENDPOINT_ID
 */

const API = 'https://console.neon.tech/api/v2';

function env(name: string): string {
    const value = process.env[name];
    if (!value) {
        console.error(`Missing ${name}. See docs/neon-migration.md.`);
        process.exit(2);
    }
    return value;
}

function arg(flag: string): string | undefined {
    const i = process.argv.indexOf(flag);
    return i === -1 ? undefined : process.argv[i + 1];
}

async function call(path: string, init?: RequestInit) {
    const res = await fetch(`${API}${path}`, {
        ...init,
        headers: {
            accept: 'application/json',
            authorization: `Bearer ${env('NEON_API_KEY')}`,
            'content-type': 'application/json',
            ...(init?.headers ?? {}),
        },
    });
    const text = await res.text();
    if (!res.ok) {
        // The body can echo the request headers on some errors, so it is
        // summarised rather than printed whole.
        console.error(`Neon API ${res.status}: ${text.slice(0, 300)}`);
        process.exit(1);
    }
    return JSON.parse(text);
}

async function main() {
    const projectId = env('NEON_PROJECT_ID');
    const endpointId = env('NEON_ENDPOINT_ID');
    const path = `/projects/${projectId}/endpoints/${endpointId}`;

    const before = await call(path);
    const endpoint = before.endpoint;

    console.log('Current compute');
    console.log(`  state                ${endpoint.current_state}`);
    console.log(`  size                 ${endpoint.autoscaling_limit_min_cu}-${endpoint.autoscaling_limit_max_cu} CU`);
    console.log(`  suspend_timeout      ${endpoint.suspend_timeout_seconds ?? 300}s`);
    console.log(`  ${endpoint.suspend_timeout_seconds === 0 ? 'always on' : 'scales to zero when idle'}`);

    const raw = arg('--timeout');
    if (raw === undefined) return;

    const seconds = Number(raw);
    if (!Number.isInteger(seconds) || seconds < 0 || seconds > 604800) {
        console.error('--timeout must be an integer between 0 and 604800 seconds.');
        process.exit(2);
    }
    if (seconds !== 0 && seconds < 60) {
        console.error('--timeout must be 0 (always on) or at least 60 seconds.');
        process.exit(2);
    }

    const after = await call(path, {
        method: 'PATCH',
        body: JSON.stringify({ endpoint: { suspend_timeout_seconds: seconds } }),
    });

    console.log(`\nSet suspend_timeout to ${after.endpoint.suspend_timeout_seconds}s.`);
    if (seconds === 0) {
        console.log('The compute now stays resident. It bills compute time continuously.');
    } else {
        console.log(`It will suspend after ${seconds} idle seconds and resume on the next connection.`);
    }
}

main().catch((err: unknown) => {
    console.error(err instanceof Error ? err.message : String(err));
    process.exit(1);
});