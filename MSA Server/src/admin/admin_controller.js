const crypto = require('crypto');
const nodemailer = require('nodemailer');
const data = require('../data');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const loginAdmin = (adminTokens) => (req, res) => {
    const { password } = req.body || {};
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    adminTokens.add(token);
    return res.json({ token });
};

const getSummary = async (req, res, next) => {
    try {
        const eventType = (req.query.event || '').toLowerCase();
        const summary = await data.getSummary(eventType);
        return res.json({ summary });
    } catch (error) {
        return next(error);
    }
};

const listApplications = async (req, res, next) => {
    try {
        const eventType = (req.query.event || '').toLowerCase();
        const applications = await data.listApplications(eventType);
        return res.json({ applications });
    } catch (error) {
        return next(error);
    }
};

const updateApplicationStatus = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { status } = req.body || {};
        const allowedStatuses = ['applied', 'shortlisted', 'selected', 'paid'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }

        const application = await data.updateApplicationStatus(id, status);
        if (!application) {
            return res.status(404).json({ error: 'Application not found' });
        }

        return res.json({ application });
    } catch (error) {
        return next(error);
    }
};

const createTransporter = () => {
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;
    const clientId = process.env.SMTP_OAUTH2_CLIENT_ID;
    const clientSecret = process.env.SMTP_OAUTH2_CLIENT_SECRET;
    const refreshToken = process.env.SMTP_OAUTH2_REFRESH_TOKEN;

    if (user && clientId && clientSecret && refreshToken) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: {
                type: 'OAuth2',
                user,
                clientId,
                clientSecret,
                refreshToken
            }
        });
    }

    if (user && pass) {
        return nodemailer.createTransport({
            service: 'gmail',
            auth: { user, pass }
        });
    }

    throw new Error(
        'SMTP credentials missing. Set SMTP_USER plus OAuth2 vars (SMTP_OAUTH2_CLIENT_ID/SECRET/REFRESH_TOKEN) or SMTP_PASS.'
    );
};

const formatEventLabel = (value) => {
    if (!value) return 'Momentum Sports';
    const normalized = value.trim().toLowerCase();
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const sendAcceptanceEmail = async (req, res, next) => {
    try {
        const { email, name, eventType } = req.body || {};
        if (!email) {
            return res.status(400).json({ error: 'Recipient email is required.' });
        }

        const transporter = createTransporter();
        const from = process.env.SMTP_FROM || process.env.SMTP_USER;
        const recipientName = (name || 'Athlete').trim();
        const eventLabel = formatEventLabel(eventType);
        const subject = `Momentum Sports ${eventLabel} - Acceptance`;
        const text = [
            `Hi ${recipientName},`,
            '',
            `Congratulations! You have been accepted for the ${eventLabel} program at Momentum Sports Africa.`,
            'We will be in touch soon with the next steps and schedule details.',
            '',
            'Regards,',
            'Momentum Sports Africa',
            '',
        ].join('\n');

        await transporter.sendMail({
            from,
            to: email,
            subject,
            text
        });

        return res.json({ ok: true });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    loginAdmin,
    getSummary,
    listApplications,
    updateApplicationStatus,
    sendAcceptanceEmail
};
