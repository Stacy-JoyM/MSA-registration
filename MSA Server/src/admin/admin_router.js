const express = require('express');
const fs = require('fs');
const path = require('path');
const {
    loginAdmin,
    getSummary,
    listApplications,
    updateApplicationStatus,
    sendAcceptanceEmail,
    sendRejectionEmail
} = require('./admin_controller');

const { getAuthUrl, getAuthStatus, saveTokens } = require('../../services/gmailService');

const adminTokens = new Map();
const router = express.Router();
const ADMIN_TOKEN_PATH = path.join(__dirname, '../../secrets/admin_tokens.json');
const TOKEN_TTL_MS = 1000 * 60 * 60 * 24;

const loadAdminTokens = () => {
    if (!fs.existsSync(ADMIN_TOKEN_PATH)) return;
    try {
        const raw = fs.readFileSync(ADMIN_TOKEN_PATH, 'utf-8');
        const data = JSON.parse(raw);
        const now = Date.now();
        Object.entries(data || {}).forEach(([token, expiresAt]) => {
            if (typeof expiresAt === 'number' && expiresAt > now) {
                adminTokens.set(token, expiresAt);
            }
        });
    } catch (error) {
        console.error('Failed to load admin tokens:', error);
    }
};

const persistAdminTokens = () => {
    try {
        const data = Object.fromEntries(adminTokens.entries());
        fs.writeFileSync(ADMIN_TOKEN_PATH, JSON.stringify(data));
    } catch (error) {
        console.error('Failed to persist admin tokens:', error);
    }
};

const registerAdminToken = (token) => {
    const expiresAt = Date.now() + TOKEN_TTL_MS;
    adminTokens.set(token, expiresAt);
    persistAdminTokens();
    return expiresAt;
};


const requireAdmin = (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    const expiresAt = token ? adminTokens.get(token) : null;
    if (!expiresAt) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    if (Date.now() >= expiresAt) {
        adminTokens.delete(token);
        persistAdminTokens();
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};


router.get('/auth/google', (req, res) => {
    const url = getAuthUrl();
    res.redirect(url);
});

router.get('/auth/callback', async (req, res) => {
    const { code } = req.query;
    try {
        await saveTokens(code);
        // Redirect back to login page so the admin can sign in normally
        res.redirect('/admin/login'); 
    } catch (err) {
        console.error("Auth Callback Error:", err);
        const detail = err?.response?.data?.error_description || err?.message || 'Unknown error';
        res.status(500).send(`Failed to save Gmail tokens. ${detail}`);
    }
});

router.get('/auth/status', async (req, res) => {
    try {
        const status = await getAuthStatus();
        return res.json(status);
    } catch (error) {
        return res.json({ connected: false });
    }
});


loadAdminTokens();
router.post('/login', loginAdmin(registerAdminToken));
router.get('/summary', requireAdmin, getSummary);
router.get('/applications', requireAdmin, listApplications);
router.patch('/applications/:id', requireAdmin, updateApplicationStatus);
router.post('/send-acceptance', requireAdmin, sendAcceptanceEmail);
router.post('/send-rejection', requireAdmin, sendRejectionEmail);

module.exports = router;