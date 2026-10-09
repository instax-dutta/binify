/**
 * Verify the database is reachable and measure round-trip latency.
 *
 *   DATABASE_URL=postgres://... npm run db:check
 *
 * Run this from the same network as the app (a Vercel build or a preview
 * deployment) before trusting the configuration. Vercel serverless and the
 * database are frequently in different continents, and a high round-trip time
 * here is the difference between a pastebin that feels instant and one that
 * feels broken.
 */

import { Client } from 'pg';

const TARGET_COUNT = 5;

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        console.error('DATABASE_URL is not set.');
        process.exit(1);
    }

    // Do not print the credentials.
    const redacted = connectionString.replace(/\/\/([^:]+):([^@]+)@/, '//$1:***@');
    console.log(`Target: ${redacted}`);

    const ssl = /\bsslmode=(disable|allow)/.test(connectionString)
        ? false
        : { rejectUnauthorized: false };

    const client = new Client({ connectionString, ssl, connectionTimeoutMillis: 10_000 });

    const t0 = Date.now();
    try {
        await client.connect();
        console.log(`Connected in ${Date.now() - t0} ms`);
    } catch (err) {
        console.error(`FAILED to connect: ${err instanceof Error ? err.message : err}`);
        console.error(
            '\nChecklist:\n' +
                '  - the database exists and is running\n' +
                '  - external access is enabled (Voroa: enable_database_external_access)\n' +
                '  - the allowlist permits the calling host, or allows 0.0.0.0/0\n' +
                '  - the URL is the POOLED endpoint, not the direct one\n' +
                '  - the hostname is not bound to localhost'
        );
        process.exit(1);
    }

    const version = await client.query<{ version: string }>('SELECT version()');
    console.log(`Server: ${version.rows[0].version.split('(')[0].trim()}`);

    const samples: number[] = [];
    for (let i = 0; i < TARGET_COUNT; i++) {
        const s = Date.now();
        await client.query('SELECT 1');
        samples.push(Date.now() - s);
    }
    const avg = Math.round(samples.reduce((a, b) => a + b, 0) / samples.length);
    console.log(`Round trip: avg ${avg} ms (${samples.join(', ')})`);

    if (avg > 100) {
        console.log(
            '\n⚠  Latency is high. Each API call costs at least one of these, so a\n' +
                '   create would take ~2x. Consider moving the app region closer to the\n' +
                '   database, or moving the database closer to the Vercel region.'
        );
    }

    const tables = await client.query<{ table_name: string }>(
        `SELECT table_name FROM information_schema.tables
          WHERE table_schema = 'public' ORDER BY table_name`
    );
    console.log(`\nTables: ${tables.rows.map((r) => r.table_name).join(', ') || '(none — run npm run migrate)'}`);

    const capacity = await client.query<{ max_connections: string }>('SHOW max_connections');
    console.log(`max_connections: ${capacity.rows[0].max_connections}`);
    console.log(
        'Keep DATABASE_POOL_MAX x max concurrent instances under this number.'
    );

    await client.end();
}

void main();