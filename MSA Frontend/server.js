const express = require('express');
const path = require('path');
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/events');
});

app.get('/events', (req, res) => {
    res.render('event-home', {
        title: 'Events - Momentum Sports',
        footerPage: 'events'
    });
});

app.get('/register', (req, res) => {
    const eventType = req.query.event || '';
    res.render('register', {
        title: 'Register - Momentum Sports',
        eventType: eventType
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

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`Frontend available at: http://localhost:${PORT}/events`);
});
