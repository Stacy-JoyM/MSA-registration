const express = require('express');
const path = require('path');
const hbs = require('hbs');
const livereload = require("livereload");
const connectLiveReload = require("connect-livereload");

const app = express();
const PORT = process.env.PORT || 3000;

// Create a livereload server
const liveReloadServer = livereload.createServer();
liveReloadServer.watch(path.join(__dirname, 'views'));

// Ping the browser when a file changes
liveReloadServer.server.once("connection", () => {
  setTimeout(() => {
    liveReloadServer.refresh("/");
  }, 100);
});

// Use the middleware to inject the livereload script into your HTML
app.use(connectLiveReload());

// Set up Handlebars as the view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials
const partialsPath = path.join(__dirname, 'views/partials');
console.log('Registering partials from:', partialsPath);
console.log('Available partials:', require('fs').readdirSync(partialsPath));

// Register navbar partial manually from subdirectory
const navbarPartialPath = path.join(__dirname, 'views/partials/navbar/navbar.hbs');
if (require('fs').existsSync(navbarPartialPath)) {
    console.log('Found navbar partial at:', navbarPartialPath);
    hbs.registerPartial('navbar', require('fs').readFileSync(navbarPartialPath, 'utf8'));
} else {
    console.log('Navbar partial not found at:', navbarPartialPath);
}

// Register description partial manually from subdirectory
const descriptionPartialPath = path.join(__dirname, 'views/partials/description/description.hbs');
if (require('fs').existsSync(descriptionPartialPath)) {
    console.log('Found description partial at:', descriptionPartialPath);
    hbs.registerPartial('description', require('fs').readFileSync(descriptionPartialPath, 'utf8'));
} else {
    console.log('Description partial not found at:', descriptionPartialPath);
}

hbs.registerPartials(partialsPath);

// 2. SERVE STATIC FILES
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'views')));

// 3. ROUTES
app.get('/', (req, res) => {
    res.redirect('/events');
});

app.get('/events', (req, res) => {
    res.render('event-home/event-home', {
        title: 'Events - Momentum Sports',
        footerPage: 'events'
    });
});

// Add this route to server.js
app.get('/description/:eventType', (req, res) => {
    const eventType = req.params.eventType; // Gets 'basketball' or 'football' from URL
    
    // Validate event type
    const validEvents = ['basketball', 'football'];
    if (!validEvents.includes(eventType)) {
        return res.status(404).render('404', { title: 'Event Not Found' });
    }
    
    // Render description partial directly with event-specific data
    res.render('partials/description/description', {
        title: `${eventType.charAt(0).toUpperCase() + eventType.slice(1)} Event - Momentum Sports`,
        eventType: eventType,
        eventData: getEventData(eventType) // Function to get event-specific data
    });
});

app.get('/register', (req, res) => {
    const eventType = req.query.event || '';
    res.render('registration/registration', { // Path based on your folder structure
        title: 'Register - Momentum Sports',
        eventType: eventType
    });
});

app.get('/admin', (req, res) => {
    // We use "layout: false" if you don't want the main navbar on the dashboard
    res.render('registration/admin-dashboard', {
        title: 'Admin Dashboard - Momentum Sports',
        layout: false 
    });
});

app.get('/data-policy', (req, res) => {
    res.render('data-policy', {
        title: 'Data Policy - Momentum Sports'
    });
});

// Add this helper function 
function getEventData(eventType) {
    const events = {
        basketball: {
            image: '/partials/description/assets/basketball-banner.png',
            title: 'Basketball Event',
            date: 'Happening April',
            description: `Join our exciting basketball tournament featuring teams from across the region. This will take place on April, parents are intended to sign up for their children.  
Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum.
             
Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum.Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum.
            `,
            buttonText: 'Register Now'
        },
        football: {
            image: '/partials/description/assets/football-banner.png',
            title: 'Football Event',
            date: 'Happening August',
            description:  `Join our exciting basketball tournament featuring teams from across the region. This will take place on April, parents are intended to sign up for their children.Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum.
            
Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum. Proin nec lobortis enim. Nullam rhoncus rutrum nibh, non facilisis diam condimentum non. Integer porta, diam sed convallis porttitor, eros nisi malesuada elit, sed condimentum.
            `,
            buttonText: 'Register Now'
        }
    };
    
    return events[eventType] || events.basketball; // Default to basketball if not found
}

// 4. ERROR HANDLING
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Main layout active with partials from views/partials`);
});