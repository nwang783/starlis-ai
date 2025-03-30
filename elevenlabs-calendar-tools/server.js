const express = require('express');
const bodyParser = require('body-parser');
const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');
const moment = require('moment');
require('dotenv').config();

// Environment variables
const PORT = process.env.PORT || 8080;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REFRESH_TOKEN = process.env.GOOGLE_REFRESH_TOKEN;
const GOOGLE_ACCESS_TOKEN = process.env.GOOGLE_ACCESS_TOKEN;

// Create Express app
const app = express();

// Middleware
app.use(bodyParser.json());

// Helper function to get calendar auth (simplified without Firestore)
function getCalendarAuth() {
  const oauth2Client = new OAuth2Client(
    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    'https://developers.google.com/oauthplayground'
  );

  oauth2Client.setCredentials({
    access_token: GOOGLE_ACCESS_TOKEN,
    refresh_token: GOOGLE_REFRESH_TOKEN
  });

  return oauth2Client;
}

// Helper function to get calendar service
function getCalendarService() {
  const auth = getCalendarAuth();
  return google.calendar({ version: 'v3', auth });
}

// Root route for health check
app.get('/', (req, res) => {
  res.status(200).json({ status: 'OK', message: 'Calendar Tools API is running' });
});

// Route for adding events
app.post('/add_event', async (req, res) => {
  try {
    const {
      title,
      description = '',
      start_day,
      end_day,
      start_time,
      end_time,
      location = '',
      attendees = []
    } = req.body;

    // Validate required parameters
    if (!title || !start_day || !end_day || !start_time || !end_time) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Required: title, start_day, end_day, start_time, end_time' 
      });
    }

    // Parse date and time
    const startDateTime = moment(`${start_day} ${start_time}`, 'MM/DD/YYYY hh:mm A').format();
    const endDateTime = moment(`${end_day} ${end_time}`, 'MM/DD/YYYY hh:mm A').format();

    // Create event object
    const event = {
      summary: title,
      description,
      location,
      start: {
        dateTime: startDateTime,
        timeZone: 'America/New_York'
      },
      end: {
        dateTime: endDateTime,
        timeZone: 'America/New_York'
      }
    };

    // Add attendees if provided
    if (Array.isArray(attendees) && attendees.length > 0) {
      event.attendees = attendees.map(email => ({ email }));
    }
    
    // If attendees is a single string, convert it to an array
    if (typeof attendees === 'string' && attendees.trim() !== '') {
      event.attendees = [{ email: attendees.trim() }];
    }

    // Get Calendar service and insert the event
    const calendarService = getCalendarService();
    const response = await calendarService.events.insert({
      calendarId: 'primary',
      resource: event,
      sendUpdates: event.attendees && event.attendees.length > 0 ? 'all' : 'none'
    });

    console.log('Event created:', response.data.htmlLink);

    // Send the result
    res.status(200).json({
      id: response.data.id,
      summary: response.data.summary,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
      location: response.data.location || '',
      link: response.data.htmlLink
    });
  } catch (error) {
    console.error('Error adding event:', error);
    res.status(500).json({ error: `Failed to add event: ${error.message}` });
  }
});

// Route for getting events
app.post('/get_events', async (req, res) => {
  try {
    const { start_day, end_day } = req.body;

    // Validate required parameters
    if (!start_day || !end_day) {
      return res.status(400).json({ 
        error: 'Missing required parameters. Required: start_day, end_day' 
      });
    }

    // Parse date range
    const timeMin = moment(start_day, 'MM/DD/YYYY').startOf('day').format();
    const timeMax = moment(end_day, 'MM/DD/YYYY').endOf('day').format();

    // Get Calendar service and list events
    const calendarService = getCalendarService();
    const response = await calendarService.events.list({
      calendarId: 'primary',
      timeMin,
      timeMax,
      singleEvents: true,
      orderBy: 'startTime'
    });

    const events = response.data.items.map(event => ({
      id: event.id,
      summary: event.summary || 'No Title',
      start: event.start.dateTime || event.start.date,
      end: event.end.dateTime || event.end.date,
      location: event.location || '',
      description: event.description || ''
    }));

    // Send the result
    res.status(200).json({
      events,
      count: events.length
    });
  } catch (error) {
    console.error('Error getting events:', error);
    res.status(500).json({ error: `Failed to get events: ${error.message}` });
  }
});

// Route for deleting events
app.post('/delete_event', async (req, res) => {
  try {
    const { event_id } = req.body;

    // Validate required parameters
    if (!event_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: event_id' 
      });
    }

    // Get Calendar service and delete the event
    const calendarService = getCalendarService();
    await calendarService.events.delete({
      calendarId: 'primary',
      eventId: event_id
    });

    // Send the result
    res.status(200).json({
      status: 'success',
      message: `Event ${event_id} deleted successfully`
    });
  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: `Failed to delete event: ${error.message}` });
  }
});

// Route for updating events
app.post('/update_event', async (req, res) => {
  try {
    const {
      event_id,
      title,
      description,
      start_day,
      end_day,
      start_time,
      end_time,
      location,
      attendees
    } = req.body;

    // Validate required parameters
    if (!event_id) {
      return res.status(400).json({ 
        error: 'Missing required parameter: event_id' 
      });
    }

    // Get Calendar service
    const calendarService = getCalendarService();
    
    // Get the existing event
    const { data: event } = await calendarService.events.get({
      calendarId: 'primary',
      eventId: event_id
    });

    // Update the fields if provided
    if (title !== undefined) {
      event.summary = title;
    }
    if (description !== undefined) {
      event.description = description;
    }
    if (location !== undefined) {
      event.location = location;
    }

    // Update date and time if provided
    if (start_day && start_time) {
      const startDateTime = moment(`${start_day} ${start_time}`, 'MM/DD/YYYY hh:mm A').format();
      event.start = {
        dateTime: startDateTime,
        timeZone: 'America/New_York'
      };
    }
    if (end_day && end_time) {
      const endDateTime = moment(`${end_day} ${end_time}`, 'MM/DD/YYYY hh:mm A').format();
      event.end = {
        dateTime: endDateTime,
        timeZone: 'America/New_York'
      };
    }

    // Update attendees if provided
    if (attendees !== undefined) {
      if (Array.isArray(attendees) && attendees.length > 0) {
        event.attendees = attendees.map(email => ({ email }));
      } else if (typeof attendees === 'string' && attendees.trim() !== '') {
        event.attendees = [{ email: attendees.trim() }];
      } else {
        // Empty array or empty string means remove attendees
        event.attendees = [];
      }
    }

    // Update the event
    const response = await calendarService.events.update({
      calendarId: 'primary',
      eventId: event_id,
      resource: event,
      sendUpdates: (event.attendees && event.attendees.length > 0) ? 'all' : 'none'
    });

    // Send the result
    res.status(200).json({
      id: response.data.id,
      summary: response.data.summary,
      start: response.data.start.dateTime,
      end: response.data.end.dateTime,
      location: response.data.location || '',
      link: response.data.htmlLink
    });
  } catch (error) {
    console.error('Error updating event:', error);
    res.status(500).json({ error: `Failed to update event: ${error.message}` });
  }
});

// Error handler for undefined routes
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Start the server
const server = app.listen(PORT, () => {
  console.log(`HTTP server is running on port ${PORT}`);
});

// Handle termination signals for graceful shutdown
process.on('SIGINT', () => {
  server.close(() => {
    console.log('Server shutting down');
    process.exit(0);
  });
});

// Export for testing
module.exports = { app, server };
