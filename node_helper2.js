const NodeHelper = require("node_helper");
const { google } = require("googleapis");
const fs = require('fs');
const path = require('path');
const express = require('express');
const moment = require('moment-timezone');
const OAuth2 = google.auth.OAuth2;

// Path to the secrets.json file
const secretsPath = path.join(__dirname, 'secrets.json');
const credentialsPath = path.join(__dirname, 'credentials.json');

// Read the secrets file
let secrets = JSON.parse(fs.readFileSync(secretsPath, 'utf8'));
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
  getNewToken: function(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/calendar']
    });
    console.log('Authorize this app by visiting this url: ', authUrl);

    var app = express();

    app.get('/oauth2callback', function(req, res) {
      var code = req.query.code;
      if (code) {
        oauth2Client.getToken(code, function(err, token) {
          if (err) {
            console.log('Error while trying to retrieve access token', err);
            return;
          }
          oauth2Client.credentials = token;
          secrets = {...secrets, ...token};
          fs.writeFileSync(secretsPath, JSON.stringify(secrets)); // Store the token
          callback(oauth2Client);
          res.send('Authentication successful! Please return to the console.');
          process.exit(1); // Stop the Express server
        });
      } else {
        res.send('Authentication failed! Please return to the console.');
      }
    });

    app.listen(3000, function () {
      console.log('App listening on port 3000');
    });
  },
  addCalendarEvent: function(payload) {
    const oauth2Client = new OAuth2(
      credentials.installed.client_id,
      credentials.installed.client_secret,
      credentials.installed.redirect_uris[0],
    );

    // Check if we have previously stored a token.
    if (secrets.access_token && secrets.refresh_token) {
      oauth2Client.credentials = secrets;
      this.insertCalendarEvent(payload, oauth2Client);
    } else {
      this.getNewToken(oauth2Client, this.insertCalendarEvent.bind(this, payload));
    }
  },
  insertCalendarEvent: function(payload, oauth2Client) {
    const startTime = moment(payload.startTime).tz("America/New_York").format();
    const endTime = moment(payload.endTime).tz("America/New_York").format();
  
      const event = {
    summary: payload.eventTitle,
    start: {
      dateTime: startTime,
      timeZone: "America/New_York",
    },
    end: {
      dateTime: endTime,
      timeZone: "America/New_York",
    },
  };

  console.log("Constructed event: ", event); // Log constructed event

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });
  calendar.events.insert(
    {
      auth: oauth2Client,
      calendarId: "primary",
      resource: event,
    },
    (err, event) => { // Use an arrow function here to preserve 'this' context
      if (err) {
        console.log("There was an error contacting the Calendar service: ", err);
        // this.sendSocketNotification('EVENT_ADD_FAILED', {});
        return;
      }

      console.log("Event created: %s", event.data.htmlLink);
      this.sendNotification('EVENT_ADD_SUCCESS', {});
      console.log("Event has been created and sent to calendarext3");
    }
  );
},
  
});
      /*(err, event) => { // Use an arrow function here to preserve 'this' context
        if (err) {
          console.log("There was an error contacting the Calendar service: ", err);
          this.sendSocketNotification('EVENT_ADD_FAILED', {});
          return;
        }
        console.log("Event created: %s", event.data.htmlLink);
        //this.sendSocketNotification("EVENT_ADD_SUCCESS", {});
        this.sendNotification('EVENT_ADD_SUCCESS', {});
        console.log("Event has been created and sent to calendarext3");
      }
    );
  },*/
  


