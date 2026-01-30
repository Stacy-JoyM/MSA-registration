require('dotenv').config();
const express = require('express');
const path = require('path');
const hbs = require('hbs');

const app = express();
const PORT = process.env.PORT || 3000;
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:4000';

// Set view engine
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));

// Register partials
hbs.registerPartials(path.join(__dirname, 'views/partials'));


app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(express.static(path.join(__dirname, 'views')));

// Routes
app.get('/', (req, res) => {
    res.redirect('/events');
});

app.get('/events', (req, res) => {
    try {
        res.render('event-home/event-home', {

            title: 'TID Camps - Momentum Sports',
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
            title: 'Basketball TID Camp',
            description: `<strong>FORCE 1 Talent Identification (T.I.D.) Camp</strong>

The FORCE 1 Talent Identification (T.I.D.) Camp is a high-level basketball program designed to identify young athletes for the AfriqueU Invitational Showcase scheduled for June 2026 in Nairobi.This camp is meant for young athletes ready to take their expertise to the next level.This camp will not only create a pathway for local talent to be identified for U.S academy opportunities, but will also improve player's skills and understanding of the game on an international level.Proper evaluation will done by FORCE 1 T.I.D. to provide players with professional basketball assessment, a clear benchmark evaluation based on elite standards and structured skill development sessions.Through this, parents would be able to understand their child's current level, strength and areas for improvement.
It is important to note that this camp serves as the official selection platform for the AfriqueU Invitational Showcase and only 100 athletes would be selected to move forward. Selection is merit-based and performance-driven hence advancement is earned.

<strong>Opportunities Beyond the Camp</strong>
The FORCE 1 T.I.D. Camp would create exposure and long-term value by opening pathways for:
-Elite local talent to be identified for U.S. academy opportunities
-Families who can self-fund to engage directly with U.S academy representatives
-Local partners to strengthen their talent pipeline and community impact
-AfriqueU and SEROS act as opportunity providers, connecting talent to the right environments - without shortcuts or unrealistic guarantees.

<strong>Eligibility Criteria</strong>
-Player may be male/female
-Player must be aged 14-17
-Player should be able to compete at a competitive or elite level

<strong>Camp Details</strong>
This camp is designed for basketball players aged 14-17 years of any gender(male/female). It will be held in Nairobi, Kenya and dates will be announced soon.Once a player is selected, a payment of Ksh 7,500 to cover the administrative and evaluation costs.N/B: Only selected players will be required to make payment.No payment should be done prior. 

<strong>Selection Process</strong>
1)Athlete submits an application
2)Applications are reviewed by the evaluation team
3)Selected athletes receive an official invitation to attend the camp
4)Camp performance determines progression to the final showcase
This structured process ensures fairness, quality and athlete safety.

<strong>N/B: Spots are limited and selection is competitive.</strong>
If your child is ready to be evaluated at a higher level and you are seeking a credible development pathway, we invite you to apply.`,
            date: 'Happening June',

            image: '/partials/description/assets/basketball-banner.PNG',
            buttonText: 'Apply Now'
        },
        football: {
            title: 'Football TID Camp',
            description: `Elite Football Trials
Your pathway to professional football in Dubai
This elite football trial is designed to identify one exceptional player aged 17-25 and provide them with a fully sponsored opportunity to train, compete, and potentially sign a professional contract with our team in Dubai.
This is not an exhibition. This is a real evaluation, with real stakes, and a clear outcome.

The Objective
Our primary objective is simple and uncompromising:
To identify an outstanding footballer with the talent, mentality, and performance level required to compete professionally
Only one player will earn the ultimate reward - but every participant will be evaluated in a professional environment.

Trial Structure
The event runs over two intensive days, designed to test technical ability, tactical understanding, physical performance, and match intelligence.
Day 1 - Open Trials
Up to 100 players
Three sessions:
Morning session (33 players)
Mid-morning session (33 players)
Afternoon session (34 players)
Each session is closely observed and evaluated by the technical team.
Day 2 - Final Assessment
Top 25 performers from Day 1 advance
Players compete in a full match scenario
Final evaluations are made under match conditions
From this final group, one standout player will be selected.

What the Selected Player Receives
The top-performing player will be offered a fully sponsored extended trial in Dubai, including:
All travel expenses covered
Accommodation provided
Daily meals
Local transport in Dubai
This trial provides the opportunity to earn a professional football contract valued at up to $15,000 USD.

Beyond the Trial: Professional Career Support
If selected, the opportunity goes far beyond just training.
The successful player may receive:
A professional football contract
Full player support while in Dubai
Performance-based bonuses, including:
Match participation bonuses
Starting XI appearances
Wins
Substitution appearances
This is a career-launching opportunity designed to place talent on the international stage.

Who Should Apply?
This trial is for footballers who:
Are aged 17-25
Compete at a high competitive level
Are physically and mentally ready for professional football
Are confident performing under pressure
Only players serious about advancing their careers should apply.

Entry Fee
To participate, players are required to pay an entry fee of:
$50 - $100 USD (final amount to be confirmed)

Selection & Transparency
All players are evaluated on performance only
No guaranteed outcomes
No shortcuts
One player earns the opportunity
If you believe you are ready, this is your chance.

Apply Now
Spaces are limited to 100 players.
Submit your application to be considered for this elite football trial and take your shot at a professional future in Dubai.`,
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

    const eventType = (req.query.event || 'basketball').toLowerCase();
    res.render('partials/registration/registration', {
        title: 'Register - Momentum Sports',
        eventType: eventType,
        isFootball: eventType === 'football',
        isBasketball: eventType !== 'football',
        apiBaseUrl: API_BASE_URL

    });
});

app.get('/admin', (req, res) => {

    res.render('admin/admin-dashboard', {
        title: 'Admin Dashboard - Momentum Sports',
        apiBaseUrl: API_BASE_URL
    });
});

app.get('/admin/login', (req, res) => {
    res.render('admin/admin-login', {
        title: 'Admin Login - Momentum Sports',
        apiBaseUrl: API_BASE_URL

    });
});

app.get('/data-policy', (req, res) => {
    res.render('data-policy', {
        title: 'Data Policy - Momentum Sports'
    });
});


app.get('/success', (req, res) => {
    const eventType = (req.query.event || '').toLowerCase();
    const eventMap = {
        basketball: 'Basketball',
        football: 'Football'
    };
    const eventTitle = eventMap[eventType] || 'your event';

    res.render('success', {
        title: 'Application Submitted - Momentum Sports',
        eventType,
        eventTitle
    });
});


// Error handling middleware (must be after routes)
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(500).send('Internal Server Error: ' + err.message);
});

// Start the server
app.listen(PORT, () => {

    console.log(`Frontend server running on http://localhost:${PORT}`);

    console.log(`Frontend available at: http://localhost:${PORT}/events`);
});
