const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: false } : undefined
});

const ensureDbConfig = () => {
    if (!process.env.DATABASE_URL && !process.env.PGHOST && !process.env.PGUSER) {
        throw new Error('Database config missing. Set DATABASE_URL or PGHOST/PGUSER/PGPASSWORD/PGDATABASE.');
    }
};

const initDb = async () => {
    ensureDbConfig();
    await pool.query(`
        CREATE TABLE IF NOT EXISTS applications (
            id TEXT PRIMARY KEY,
            created_at TIMESTAMPTZ NOT NULL,
            status TEXT NOT NULL,
            event_type TEXT NOT NULL,
            payload JSONB NOT NULL
        );
    `);
};

module.exports = {
    pool,
    initDb
};
