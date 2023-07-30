const NodeHelper = require("node_helper");
const { google } = require("googleapis");
const fs = require('fs');
const path = require('path');
const http = require('http');
const url = require('url');

// Path to the secrets.json file
const secretsPath = path.join(__dirname, 'secrets.json');
const credentialsPath = path.join(__dirname, 'credentials.json');

// Read the secrets file
const secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
// Read the credentials file
const credentials = JSON.parse(fs.readFileSync(credentialsPath, 'utf8'));

module.exports = NodeHelper.create({
  start: function() {
    console.log("MMM-GoogleCalendarEventAdder helper started...");
  },
  socketNotificationReceived: function(notification, payload) {
    if (notification === "ADD_CALENDAR_EVENT") {
      this.addCalendarEvent(payload);
    }
  },
  createServer: function() {
    return new Promise((resolve, reject) => {
        const server = http.createServer((req, res) => {
            if (req.url.indexOf('/oauth2callback') > -1) {
                const qs = new url.URL(req.url, 'http://localhost:3000').searchParams;
                const code = qs.get('code');
                res.end('Authentication successful! You can close this page and return to the app.');
                server.close();
                resolve(code);
            }
        });

        server.listen(3000, () => {
            console.log('Server running on port 3000');
        });
    });
  },
  addCalendarEvent: function(payload) {
    const oauth2Client = new google.auth.OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      credentials.installed.redirect_uris[0],
    );

    // If there's an access token in the secrets file, use it.
    // Otherwise, generate an auth URL for the user to get a new one.
    if (secrets.accessToken && secrets.refreshToken) {
      oauth2Client.setCredentials({
        access_token: secrets.access_token,
        refresh_token: secrets.refresh_token,
        expiry_date: secrets.expiry_date
      });
      this.insertCalendarEvent(payload, oauth2Client);
    } else {
      const scopes = ['https://www.googleapis.com/auth/calendar'];
      const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'online',
        scope: scopes
      });
      console.log('Please visit this URL to authenticate: ', authUrl);
      
      // Call the createServer method and use the returned code
      this.createServer().then((code) => {
        oauth2Client.getToken(code, (error, token) => {
            if (error) {
                console.log('Error getting token', error);
            } else {
                oauth2Client.setCredentials(token);
                this.insertCalendarEvent(payload, oauth2Client);
            }
        });
    });
    }
  },
  insertCalendarEvent: function(payload, oauth2Client) {
    const startTime = new Date(payload.startTime).toISOString();
    const endTime = new Date(payload.endTime).toISOString();

    const event = {
      summary: payload.eventTitle,
      start: {
        dateTime: payload.startTime,
        timeZone: "America/New_York",
      },
      end: {
        dateTime: payload.endTime,
        timeZone: "America/New_York",
      },
    };

    console.log("Constructed event: ", event); // Log constructed event

    const calendar = google.calendar({ version: "v3", auth: oauth2Client });
    calendar.events.insert(
      {
        auth: oauth2Client,
        calendarId: "jtate84@gmail.com",
        resource: event,
      },
      function(err, event) {
        if (err) {
          console.log("There was an error contacting the Calendar service: ", err);
          return;
        }
        console.log("Event created: %s", event.htmlLink);
      }
    );
  },
});
