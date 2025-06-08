const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Middleware
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Matching SMS Backend is running!' });
});

// Send new match notification
app.post('/api/sms/match', async (req, res) => {
  try {
    const { phoneNumber, matchName } = req.body;
    
    if (!phoneNumber || !matchName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and match name are required' 
      });
    }

    const message = `🎉 You have a new match on Matching! ${matchName} is interested in you. Open the app to connect! 💕`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`✅ New match SMS sent to ${phoneNumber} - SID: ${messageResponse.sid}`);
    
    res.json({ 
      success: true, 
      messageSid: messageResponse.sid,
      message: 'Match notification sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending match SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send profile view notification
app.post('/api/sms/profile-view', async (req, res) => {
  try {
    const { phoneNumber, viewerName } = req.body;
    
    if (!phoneNumber || !viewerName) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and viewer name are required' 
      });
    }

    const message = `👀 ${viewerName} viewed your profile on Matching! Check them out in the app.`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`✅ Profile view SMS sent to ${phoneNumber} - SID: ${messageResponse.sid}`);
    
    res.json({ 
      success: true, 
      messageSid: messageResponse.sid,
      message: 'Profile view notification sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending profile view SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send message notification
app.post('/api/sms/message', async (req, res) => {
  try {
    const { phoneNumber, senderName, messagePreview } = req.body;
    
    if (!phoneNumber || !senderName || !messagePreview) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number, sender name, and message preview are required' 
      });
    }

    const truncatedPreview = messagePreview.substring(0, 50) + (messagePreview.length > 50 ? '...' : '');
    const message = `💬 New message from ${senderName}: "${truncatedPreview}" Reply in the Matching app!`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`✅ Message notification SMS sent to ${phoneNumber} - SID: ${messageResponse.sid}`);
    
    res.json({ 
      success: true, 
      messageSid: messageResponse.sid,
      message: 'Message notification sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending message SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Send activity reminder
app.post('/api/sms/reminder', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    const message = `✨ Your perfect match might be waiting! You have potential matches on Matching. Open the app to see who's interested in you! 💕`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: phoneNumber,
    });

    console.log(`✅ Activity reminder SMS sent to ${phoneNumber} - SID: ${messageResponse.sid}`);
    
    res.json({ 
      success: true, 
      messageSid: messageResponse.sid,
      message: 'Activity reminder sent successfully!' 
    });

  } catch (error) {
    console.error('Error sending reminder SMS:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    success: false, 
    error: 'Internal server error' 
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    error: 'Endpoint not found' 
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Matching SMS Backend running on http://localhost:${PORT}`);
  console.log(`📱 Twilio number: ${twilioPhoneNumber}`);
  console.log(`🎯 Health check: http://localhost:${PORT}/health`);
}); 