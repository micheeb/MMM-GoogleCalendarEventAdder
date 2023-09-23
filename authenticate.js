const fs = require('fs');
const path = require('path');
const express = require('express');
const readline = require('readline');
const { google } = require('googleapis');
let open; // Initialize it as undefined here

// Paths
const credentialsPath = path.join(__dirname, 'credentials.json');
const secretsPath = path.join(__dirname, 'secrets.json');

// Load credentials
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

let server; 

async function getNewToken(oauth2Client) {
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: ['https://www.googleapis.com/auth/calendar']
    });
    console.log('Opening browser for authentication:', authUrl);

    try {
        await open(authUrl);
    } catch (err) {
        console.error('Failed to open the browser automatically. Please visit the URL manually:', authUrl);
    }

    const app = express();
    app.get('/oauth2callback', function(req, res) {
        const code = req.query.code;
        oauth2Client.getToken(code, function(err, token) {
            if (err) {
                console.log('Error while trying to retrieve access token', err);
                return;
            }
            fs.writeFileSync(secretsPath, JSON.stringify(token)); // Store the token
            console.log('Token stored in', secretsPath);
            res.send('Authentication successful! You can now close this page.');

            server.close(() => {  // Close the server here
                console.log('Express server closed');
                process.exit(0);
            });
        });
    });

    // Assign the server instance to the server variable
    server = app.listen(3000, function () {
        console.log('App listening on port 3000');
    });
}

const oauth2Client = new google.auth.OAuth2(
    credentials.installed.client_id,
    credentials.installed.client_secret,
    credentials.installed.redirect_uris[0]
);

(async () => {
    // Use dynamic import for the 'open' module
    try {
        const openModule = await import('open');
        open = openModule.default;

        await getNewToken(oauth2Client); // Make sure to await this async function
    } catch (error) {
        console.error('Error during setup:', error);
    }
})();
