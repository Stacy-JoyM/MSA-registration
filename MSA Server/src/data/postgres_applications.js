const crypto = require('crypto');
const { pool, initDb } = require('../db');

const toApplication = (row) => ({
    id: row.id,
    createdAt: row.created_at,
    status: row.status,
    eventType: row.event_type,
    ...(row.payload || {})
});

const init = async () => {
    await initDb();
};

const createApplication = async (payload) => {
    const { eventType, ...payloadData } = payload;
    const application = {
        id: crypto.randomBytes(12).toString('hex'),
        createdAt: new Date().toISOString(),
        status: 'applied',
        eventType
    };

    await pool.query(
        `
        INSERT INTO applications (id, created_at, status, event_type, payload)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [
            application.id,
            application.createdAt,
            application.status,
            application.eventType,
            payloadData
        ]
    );

    return { ...application, ...payloadData };
};

const listApplications = async (eventType) => {
    const values = [];
    let whereClause = '';
    if (eventType) {
        values.push(eventType);
        whereClause = 'WHERE event_type = $1';
    }

    const { rows } = await pool.query(
        `
        SELECT id, created_at, status, event_type, payload
        FROM applications
        ${whereClause}
        ORDER BY created_at DESC
        `,
        values
    );

    return rows.map(toApplication);
};

const getSummary = async (eventType) => {
    const values = [];
    let whereClause = '';
    if (eventType) {
        values.push(eventType);
        whereClause = 'WHERE event_type = $1';
    }

    const { rows } = await pool.query(
        `
        SELECT
            COUNT(*)::int AS total,
            SUM(CASE WHEN status = 'applied' THEN 1 ELSE 0 END)::int AS applied,
            SUM(CASE WHEN status = 'shortlisted' THEN 1 ELSE 0 END)::int AS shortlisted,
            SUM(CASE WHEN status = 'selected' THEN 1 ELSE 0 END)::int AS selected,
            SUM(CASE WHEN status = 'paid' THEN 1 ELSE 0 END)::int AS paid,
            SUM(CASE WHEN status = 'rejected' THEN 1 ELSE 0 END)::int AS rejected
        FROM applications
        ${whereClause}
        `,
        values
    );

    const summary = rows[0] || {};
    return {
        total: summary.total || 0,
        applied: summary.applied || 0,
        shortlisted: summary.shortlisted || 0,
        selected: summary.selected || 0,
        paid: summary.paid || 0,
        rejected: summary.rejected || 0
    };
};

const updateApplicationStatus = async (id, status) => {
    const { rows } = await pool.query(
        `
        UPDATE applications
        SET status = $1
        WHERE id = $2
        RETURNING id, created_at, status, event_type, payload
        `,
        [status, id]
    );

    if (!rows.length) {
        return null;
    }

    return toApplication(rows[0]);
};

const updateApplicationEmailStatus = async (id, type, sentAt) => {
    const statusKey = type === 'rejection' ? 'emailSentRejection' : 'emailSentAcceptance';
    const timestampKey = type === 'rejection' ? 'emailSentRejectionAt' : 'emailSentAcceptanceAt';
    const { rows } = await pool.query(
        `
        UPDATE applications
        SET payload = jsonb_set(
            jsonb_set(
                COALESCE(payload, '{}'::jsonb),
                $2,
                to_jsonb($3::boolean),
                true
            ),
            $4,
            to_jsonb($5::text),
            true
        )
        WHERE id = $1
        RETURNING id, created_at, status, event_type, payload
        `,
        [id, `{${statusKey}}`, true, `{${timestampKey}}`, sentAt]
    );

    if (!rows.length) {
        return null;
    }

    return toApplication(rows[0]);
};

module.exports = {
    init,
    createApplication,
    listApplications,
    getSummary,
    updateApplicationStatus,
    updateApplicationEmailStatus
};
