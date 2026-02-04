const crypto = require('crypto');
const data = require('../data');
const { sendEmail } = require('../../services/gmailService');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

const loginAdmin = (registerAdminToken) => (req, res) => {
    const { password } = req.body || {};
    if (!password || password !== ADMIN_PASSWORD) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token = crypto.randomBytes(24).toString('hex');
    registerAdminToken(token);
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
        const allowedStatuses = ['applied', 'shortlisted', 'selected', 'paid', 'rejected'];
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



const formatEventLabel = (value) => {
    if (!value) return 'Momentum Sports';
    const normalized = value.trim().toLowerCase();
    return `${normalized.charAt(0).toUpperCase()}${normalized.slice(1)}`;
};

const sendAcceptanceEmail = async (req, res, next) => {
    try {
        const { email, name, eventType, applicationId } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email required.' });

        const eventLabel = formatEventLabel(eventType);
        const recipientName = (name || 'Applicant').trim();
        const subject = `Momentum Sports ${eventLabel} - Acceptance`;
        const htmlBody = `
            <p>Dear ${recipientName},</p>
            <p>
                We are pleased to inform you that your application has been successfully reviewed, and you have been
                accepted to participate in the upcoming evaluation event (${eventLabel}).
            </p>
            <p>
                This acceptance confirms that you have met the initial application requirements and are eligible to
                take part in the official evaluation process.
            </p>
            <p><strong>What Happens Next</strong></p>
            <p>You will shortly receive a follow-up communication containing:</p>
            <ul>
                <li>Payment instructions and deadlines (where applicable)</li>
                <li>Event dates and venue details</li>
                <li>Reporting time and session allocation</li>
                <li>Required documentation and equipment</li>
            </ul>
            <p>
                Please note that participation in the event does not guarantee progression or selection. All outcomes
                are determined strictly on performance and evaluation standards during the assessment.
            </p>
            <p><strong>Important Notice</strong></p>
            <p>Your place is provisionally reserved and will only be fully confirmed upon:</p>
            <ul>
                <li>Completion of any required payment</li>
                <li>Submission of requested documents within the specified timelines</li>
            </ul>
            <p>Failure to complete these steps may result in forfeiture of your slot.</p>
            <p>
                We commend you for taking this important step in your sporting journey and look forward to seeing you
                perform in a professional, competitive environment.
            </p>
            <p>
                Should you have any questions, please await the next communication or contact us via the official
                channels provided.
            </p>
                <p>Kind regards,<br>The Organizing Team<br><strong>Momentum Sports Africa</strong></p>
        
        `;

        await sendEmail(subject, htmlBody, email);
        if (applicationId) {
            await data.updateApplicationEmailStatus(applicationId, 'acceptance', new Date().toISOString());
        }
        return res.json({ ok: true });
    } catch (error) {
        console.error('Acceptance email failed:', error);
        return res.status(500).json({
            error: 'Email send failed',
            detail: error?.message || 'Unable to send acceptance email.'
        });
    }
};

const sendRejectionEmail = async (req, res, next) => {
    try {
        const { email, name, eventType, applicationId } = req.body || {};
        if (!email) return res.status(400).json({ error: 'Email required.' });

        const eventLabel = formatEventLabel(eventType);
        const subject = `Momentum Sports ${eventLabel} - Update`;
        const recipientName = (name || 'Athlete').trim();
        const htmlBody = `
            <p>Hi ${recipientName},</p>
            <p>Thank you for applying to the ${eventLabel} Talent Identification Camp. After careful review, we are unable to offer you a spot at this time.</p>
            <p>
                We appreciate the effort you put into your application and encourage you to keep developing your game.
                We hope to see you apply for future Momentum Sports events and opportunities.
            </p>
            <p>Kind regards,<br>The Organizing Team<br><strong>Momentum Sports Africa</strong></p>
        `;

        await sendEmail(subject, htmlBody, email);
        if (applicationId) {
            await data.updateApplicationEmailStatus(applicationId, 'rejection', new Date().toISOString());
        }
        return res.json({ ok: true });
    } catch (error) {
        console.error('Rejection email failed:', error);
        return res.status(500).json({
            error: 'Email send failed',
            detail: error?.message || 'Unable to send rejection email.'
        });
    }
};

module.exports = {
    loginAdmin,
    getSummary,
    listApplications,
    updateApplicationStatus,
    sendAcceptanceEmail,
    sendRejectionEmail
};
