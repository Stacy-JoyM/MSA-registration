const express = require('express');
const {
    loginAdmin,
    getSummary,
    listApplications,
    updateApplicationStatus,
    sendAcceptanceEmail
} = require('./admin_controller');

const adminTokens = new Set();
const router = express.Router();

const requireAdmin = (req, res, next) => {
    const header = req.get('authorization') || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token || !adminTokens.has(token)) {
        return res.status(401).json({ error: 'Unauthorized' });
    }
    return next();
};

router.post('/login', loginAdmin(adminTokens));
router.get('/summary', requireAdmin, getSummary);
router.get('/applications', requireAdmin, listApplications);
router.patch('/applications/:id', requireAdmin, updateApplicationStatus);
router.post('/send-acceptance', requireAdmin, sendAcceptanceEmail);

module.exports = router;
