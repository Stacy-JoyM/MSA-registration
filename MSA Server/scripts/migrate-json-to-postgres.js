require('dotenv').config();

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { Pool } = require('pg');

const DATA_FILE = path.join(__dirname, '..', '..', 'MSA Frontend', 'data', 'applications.json');

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

const loadJson = () => {
    if (!fs.existsSync(DATA_FILE)) {
        return [];
    }
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    if (!raw.trim()) {
        return [];
    }
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed : [];
    } catch (error) {
        console.error('Failed to parse JSON data:', error);
        return [];
    }
};

const insertApplication = async (application) => {
    const {
        id = crypto.randomBytes(12).toString('hex'),
        createdAt = new Date().toISOString(),
        status = 'applied',
        eventType = 'basketball',
        ...payload
    } = application || {};

    await pool.query(
        `
        INSERT INTO applications (id, created_at, status, event_type, payload)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO NOTHING
        `,
        [id, createdAt, status, eventType, payload]
    );
};

const run = async () => {
    await initDb();
    const applications = loadJson();

    if (!applications.length) {
        console.log('No JSON applications found to migrate.');
        return;
    }

    for (const application of applications) {
        await insertApplication(application);
    }

    console.log(`Migrated ${applications.length} applications.`);
};

run()
    .catch((error) => {
        console.error('Migration failed:', error);
        process.exit(1);
    })
    .finally(async () => {
        await pool.end();
    });
