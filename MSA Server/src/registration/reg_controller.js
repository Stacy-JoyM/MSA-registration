const data = require('../data');

const isValidEventType = (eventType) => ['football', 'basketball'].includes(eventType);

const createApplication = async (req, res, next) => {
    try {
        const payload = req.body || {};
        const files = Array.isArray(req.files) ? req.files : [];
        if (files.length) {
            payload.videos = files.map((file) => {
                const baseUrl = `${req.protocol}://${req.get('host')}`;
                return `${baseUrl}/uploads/${file.filename}`;
            });
        }
        const eventType = (payload.eventType || '').toLowerCase();
        if (!isValidEventType(eventType)) {
            return res.status(400).json({ error: 'Invalid event type' });
        }

        const application = await data.createApplication({ ...payload, eventType });
        return res.status(201).json({ application });
    } catch (error) {
        return next(error);
    }
};

module.exports = {
    createApplication
};
