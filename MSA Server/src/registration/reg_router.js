const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { createApplication } = require('./reg_controller');

const router = express.Router();

const uploadDir = path.join(__dirname, '..', '..', 'uploads');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        const safeBaseName = path
            .basename(file.originalname, ext)
            .replace(/[^a-zA-Z0-9-_]/g, '_')
            .slice(0, 50);
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${safeBaseName}-${unique}${ext}`);
    }
});

const upload = multer({ storage });

router.post('/applications', upload.array('playerVideo', 2), createApplication);

module.exports = router;
