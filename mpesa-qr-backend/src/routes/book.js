import express from 'express';
import { google } from 'googleapis';

const router = express.Router();

// 1. Initialize Google Auth (Requires a Service Account JSON file)
// You will download this file from Google Cloud Console
const auth = new google.auth.GoogleAuth({
  keyFile: './google-service-account.json', // Path to your downloaded JSON key
  scopes: ['https://www.googleapis.com/auth/calendar.events'],
});

const calendar = google.calendar({ version: 'v3', auth });

router.post('/book-consultation', async (req, res) => {
  const { name, email, date, time } = req.body;

  if (!name || !email || !date || !time) {
    return res.status(400).json({ success: false, error: 'All fields are required.' });
  }

  try {
    // 2. Format the Date and Time (Assuming East Africa Time / Nairobi)
    const startDateTime = new Date(`${date}T${time}:00+03:00`);
    
    // Default consultation length: 45 Minutes
    const endDateTime = new Date(startDateTime.getTime() + 45 * 60000); 

    // 3. Construct the Google Calendar Event
    const event = {
      summary: `MerchantPro Consultation: ${name}`,
      description: `New consultation request from ${name}.\nClient Email: ${email}\n\nPlease prepare demo materials for MerchantPro M-Pesa integration.`,
      start: {
        dateTime: startDateTime.toISOString(),
        timeZone: 'Africa/Nairobi',
      },
      end: {
        dateTime: endDateTime.toISOString(),
        timeZone: 'Africa/Nairobi',
      },
      attendees: [
        { email: 'mpesaqr@cloudora.live' }, // The Host
        { email: email },                   // The Client
      ],
      // This tells Google to actually send the email invites!
      reminders: {
        useDefault: true,
      },
    };

    // 4. Inject the event into the specific calendar
    const response = await calendar.events.insert({
      calendarId: 'cloudoraltd@gmail.com', // The calendar we are injecting into
      resource: event,
      sendUpdates: 'all', // Sends the email invitation to the client
    });

    res.status(200).json({ 
      success: true, 
      message: 'Consultation booked! Calendar invite sent.',
      eventLink: response.data.htmlLink 
    });

  } catch (error) {
    console.error('❌ Google Calendar API Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to book consultation. Please try again later.' 
    });
  }
});

export default router;