const data = require('../data');

const isValidEventType = (eventType) => ['football', 'basketball'].includes(eventType);

const isMissingValue = (value) => {
    if (value === undefined || value === null) return true;
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    return false;
};

const getRequiredFields = (eventType) => {
    if (eventType === 'football') {
        return [
            'playerFullName',
            'playerGender',
            'playerEmail',
            'playerAge',
            'playerCity',
            'playerNationality',
            'playerPhone',
            'playerAltPhone',
            'playerPosition',
            'playerCurrentTeam',
            'playerPreviousTeam',
            'playerInjury',
            'playerReferral',
            'playerUpdates',
            'finalAcknowledgement'
        ];
    }

    return [
        'parentFirstName',
        'parentLastName',
        'parentEmail',
        'parentRelationship',
        'parentPhone',
        'playerFullName',
        'playerGender',
        'playerAge',
        'playerCity',
        'playerSchool',
        'playerPosition',
        'playerSchoolTeam',
        'playerHighestLevel',
        'playerInjury',
        'playerReferral',
        'playerUpdates',
        'playerEliteCamp',
        'eligibilityFitness',
        'eligibilityRiskAck',
        'finalAcknowledgement'
    ];
};

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

        const requiredFields = getRequiredFields(eventType);
        const missingFields = requiredFields.filter((field) => isMissingValue(payload[field]));
        if (!files.length) {
            missingFields.push('playerVideo');
        }

        if (missingFields.length) {
            return res.status(400).json({
                error: 'Missing required fields',
                fields: missingFields
            });
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
