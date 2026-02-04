const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const TOKEN_PATH = path.join(__dirname, '../secrets/token.json');

const getRedirectUri = () => {
    if (process.env.SMTP_OAUTH2_REDIRECT_URI) {
        return process.env.SMTP_OAUTH2_REDIRECT_URI;
    }
    if (process.env.GOOGLE_REDIRECT_URI) {
        return process.env.GOOGLE_REDIRECT_URI;
    }
    const port = process.env.API_PORT || 4000;
    return `http://localhost:${port}/api/admin/auth/callback`;
};

const getOAuthClient = () => {
    const clientId = process.env.SMTP_OAUTH2_CLIENT_ID;
    const clientSecret = process.env.SMTP_OAUTH2_CLIENT_SECRET;
    const redirectUri = getRedirectUri();
    if (!clientId || !clientSecret) {
        throw new Error('Missing SMTP OAuth2 client credentials.');
    }
    return new google.auth.OAuth2(clientId, clientSecret, redirectUri);
};

const loadTokens = () => {
    if (!fs.existsSync(TOKEN_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(TOKEN_PATH));
    } catch (error) {
        return null;
    }
};

const persistTokens = (tokens) => {
    if (!tokens) return;
    fs.mkdirSync(path.dirname(TOKEN_PATH), { recursive: true });
    fs.writeFileSync(TOKEN_PATH, JSON.stringify(tokens));
};

function getAuthUrl() {
    const oauth2Client = getOAuthClient();
    return oauth2Client.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: ['https://www.googleapis.com/auth/gmail.send'],
    });
}

async function saveTokens(code) {
    const oauth2Client = getOAuthClient();
    const { tokens } = await oauth2Client.getToken(code);
    persistTokens(tokens);
    return tokens;
}

async function getAuthStatus() {
    const tokens = loadTokens();
    if (!tokens) {
        return { connected: false };
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);

    try {
        await oauth2Client.getAccessToken();
        const refreshed = oauth2Client.credentials || tokens;
        if (refreshed) {
            persistTokens({ ...tokens, ...refreshed });
        }
        return { connected: true, expired: false };
    } catch (error) {
        return { connected: true, expired: true };
    }
}

async function sendEmail(subject, htmlBody, recipient) {
    if (!fs.existsSync(TOKEN_PATH)) {
        throw new Error("Gmail not connected. Please connect via Admin Dashboard.");
    }
    const tokens = loadTokens();
    if (!tokens) {
        throw new Error("Gmail token invalid. Please reconnect via Admin Dashboard.");
    }
    const oauth2Client = getOAuthClient();
    oauth2Client.setCredentials(tokens);

    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const fromHeader = process.env.SMTP_FROM || 'Momentum Sports Africa';
    const messageParts = [
        `From: ${fromHeader}`,
        `To: ${recipient}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        htmlBody,
    ];
    const message = messageParts.join('\n');
    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw: encodedMessage },
    });
    if (oauth2Client.credentials) {
        persistTokens({ ...tokens, ...oauth2Client.credentials });
    }
    return result;
}

module.exports = { getAuthUrl, getAuthStatus, saveTokens, sendEmail };