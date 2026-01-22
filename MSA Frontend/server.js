const express = require('express');
const path = require('path');
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 3000;

// Set view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));

app.use(express.static(path.join(__dirname, 'views')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/events');
});

app.get('/events', (req, res) => {
    try {
        res.render('event-home/event-home', {
            title: 'Events - Momentum Sports',
            footerPage: 'events'
        });
    } catch (error) {
        console.error('Render error:', error);
        res.status(500).send('Render error: ' + error.message);
    }
});

app.get('/description/:eventType', (req, res) => {
    const eventType = (req.params.eventType || '').toLowerCase();
    const eventMap = {
        basketball: {
            title: 'Basketball',
            description: 'Momentum Sports Africa basketball program registration.',
            date: 'Happening April',
            image: '/partials/description/assets/basketball-banner.PNG',
            buttonText: 'Apply Now'
        },
        football: {
            title: 'Football',
            description: 'Momentum Sports Africa football program registration.',
            date: 'Happening August',
            image: '/partials/description/assets/football-banner.png',
            buttonText: 'Apply Now'
        }
    };

    const eventData = eventMap[eventType];
    if (!eventData) {
        return res.status(404).send('Event not found');
    }

    res.render('partials/description/description', {
        title: `${eventData.title} - Momentum Sports`,
        eventType,
        eventData
    });
});

app.get('/register', (req, res) => {
    const eventType = (req.query.event || '').toLowerCase();
    res.render('partials/registration/registration', {
        title: 'Register - Momentum Sports',
        eventType: eventType,
        isFootball: eventType === 'football',
        isBasketball: eventType !== 'football'
    });
});

app.get('/admin', (req, res) => {
    res.render('admin-dashboard', {
        title: 'Admin Dashboard - Momentum Sports'
    });
});

app.get('/data-policy', (req, res) => {
    res.render('data-policy', {
        title: 'Data Policy - Momentum Sports'
    });
});

// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}/events`);
});
