const express = require('express');
const { google } = require('googleapis');
const { uuid} = require('uuidv4');

require('dotenv').config()

const app = express();

app.use(express.json())


const SCOPES =  {
    READ: "https://www.googleapis.com/auth/calendar.readonly",
    WRITE: "https://www.googleapis.com/auth/calendar"
}


const jwtClient = new google.auth.JWT(
	process.env.GOOGLE_CLIENT_EMAIL,
	null,
	process.env.GOOGLE_PRIVATE_KEY,
	SCOPES.READ
);

const calendar = google.calendar({
	version: 'v3',
	project: process.env.GOOGLE_PROJECT_NUMBER,
	auth: jwtClient
});

app.get('/event', (_, res) => {
    calendar.events.list({
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        timeMin: (new Date()).toISOString(),
        maxResults: 10,
        singleEvents: true,
        orderBy: 'startTime',
    }, (err, result) => {
        if(err) throw new Error(err)
        if (result.data.items.length) {
            res.json(result.data.items)
        } else {
            res.json('No upcoming events found.')
        }
    });
});

app.post("/event", async (req,res)=>{
    const { summary, location, description, startDateTime, endDateTime } = req.body

    let event = {
        "summary": summary || "Some event",
        "location": location || "Africa/Lagos",
        "description": description,
        "start": {
            "dateTime": startDateTime || "2022-05-05T09:00:00-07:00",
            "timeZone": "Africa/Lagos"
        },
        "end": {
            "dateTime":  endDateTime || "2022-05-05T09:00:00-07:00",
            "timeZone": "Africa/Lagos"
        },
        "attendees": [],
        "reminders": {
            "useDefault": false,
            "overrides": [
            {"method": "email", "minutes": 1440},
            {"method": "popup", "minutes": 10}
            ]
        }
    }

    const auth = new google.auth.GoogleAuth({
        keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
        scopes: SCOPES.WRITE
    });
    const authClient = await auth.getClient()
    let result = await calendar.events.insert({
        auth: authClient,
        calendarId: process.env.GOOGLE_CALENDAR_ID,
        resource: event,
    })

    if(req.query.conferencing){
        result = await calendar.events.patch({
            auth: authClient,
            calendarId: process.env.GOOGLE_CALENDAR_ID,
            eventId: result.data.id,
            resource: conferenceData = {
                createRequest: {requestId: uuid()}
            },
            sendNotifications: true,
            conferenceDataVersion: 1
          })
    }

    res.json(result.data)
})

app.listen(3000, () => console.log(`App listening on port 3000!`));
  
