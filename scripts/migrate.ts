/**
 * Apply the schema.
 *
 *   DATABASE_URL=postgres://... npm run migrate
 *
 * Imports the same DDL the running app uses, so there is one definition of the
 * schema rather than a migration file that can drift from the code.
 */

import { SCHEMA_SQL, getPool } from '../src/lib/db';

async function main() {
    if (!process.env.DATABASE_URL) {
        console.error('DATABASE_URL is not set.');
        process.exit(1);
    }

    const pool = getPool();

    try {
        const info = await pool.query<{ version: string }>('SELECT version()');
        console.log(`Connected to ${info.rows[0].version.split(',')[0]}`);

        await pool.query(SCHEMA_SQL);
        console.log('Schema applied.');

        const tables = await pool.query<{ table_name: string }>(
            `SELECT table_name FROM information_schema.tables
              WHERE table_schema = 'public' ORDER BY table_name`
        );
        console.log(`Tables: ${tables.rows.map((r) => r.table_name).join(', ')}`);

        const columns = await pool.query<{ column_name: string }>(
            `SELECT column_name FROM information_schema.columns
              WHERE table_schema = 'public' AND table_name = 'pastes'
              ORDER BY ordinal_position`
        );
        console.log(`pastes columns: ${columns.rows.map((r) => r.column_name).join(', ')}`);

        console.log('\nDone. Set TOKEN_PEPPER, INIT_SECRET and CRON_SECRET before serving traffic.');
    } catch (err) {
        console.error('Migration failed:', err instanceof Error ? err.message : err);
        process.exitCode = 1;
    } finally {
        await pool.end();
    }
}

void main();