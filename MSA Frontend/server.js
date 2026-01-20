const express = require('express');
const path = require('path');
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 3000;

// Set up Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials
const partialsPath = path.join(__dirname, 'views/partials');
console.log('Registering partials from:', partialsPath);
console.log('Available partials:', require('fs').readdirSync(partialsPath));

// Register navbar partial manually
const navbarPartialPath = path.join(__dirname, 'views/partials/navbar.hbs');
if (require('fs').existsSync(navbarPartialPath)) {
    console.log('Found navbar partial at:', navbarPartialPath);
    hbs.registerPartial('navbar', require('fs').readFileSync(navbarPartialPath, 'utf8'));
} else {
    console.log('Navbar partial not found at:', navbarPartialPath);
}

hbs.registerPartials(partialsPath);

// Serve static files from public and views directory
app.use(express.static(path.join(__dirname, 'public')));
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
