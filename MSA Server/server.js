require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');

const data = require('./src/data');
const adminRouter = require('./src/admin/admin_router');
const registrationRouter = require('./src/registration/reg_router');

const app = express();
const PORT = process.env.API_PORT || 4000;

app.use(cors({ origin: process.env.CORS_ORIGIN || '*' }));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
    res.json({ ok: true });
});

app.use('/api/admin', adminRouter);
app.use('/api', registrationRouter);

app.use((err, req, res, next) => {
    console.error('API error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
});

data.init()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`API server running on http://localhost:${PORT}`);
        });
    })
    .catch((error) => {
        console.error('Failed to start API server:', error);
        process.exit(1);
    });
