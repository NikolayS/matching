const express = require('express');
const cors = require('cors');
const twilio = require('twilio');
const multer = require('multer');
const { createClient } = require('@supabase/supabase-js');
const { v7: uuidv7 } = require('uuid');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Initialize Twilio client
const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Initialize Supabase client for backend operations
const supabase = createClient(
  process.env.SUPABASE_URL || 'https://zekigaxnilsrennylvnw.supabase.co',
  process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_ANON_KEY
);

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for OTP codes (in production, use Redis or database)
const otpStore = new Map();

// Generate random 6-digit OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Matching SMS Backend is running!' });
});

// Debug endpoint to see stored OTP codes (remove in production)
app.get('/api/debug/codes', (req, res) => {
  const codes = Array.from(otpStore.entries()).map(([phone, data]) => ({
    phone,
    code: data.code,
    expires: new Date(data.expires).toISOString()
  }));
  res.json({ codes });
});

// Send phone verification code
app.post('/api/auth/send-code', async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number is required' 
      });
    }

    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // Generate OTP
    const otp = generateOTP();
    
    // Store OTP with expiration (5 minutes)
    otpStore.set(formattedPhone, {
      code: otp,
      expires: Date.now() + (5 * 60 * 1000) // 5 minutes
    });

    // Send SMS
    const message = `Your Matching verification code is: ${otp}. Valid for 5 minutes. ☕`;
    
    const messageResponse = await client.messages.create({
      body: message,
      from: twilioPhoneNumber,
      to: formattedPhone,
    });

    console.log(`✅ Verification code sent to ${formattedPhone} - Code: ${otp} - SID: ${messageResponse.sid}`);
    
    res.json({ 
      success: true, 
      message: 'Verification code sent successfully!',
      phone: formattedPhone
    });

  } catch (error) {
    console.error('Error sending verification code:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Verify phone code
app.post('/api/auth/verify-code', async (req, res) => {
  try {
    const { phoneNumber, code } = req.body;
    
    if (!phoneNumber || !code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Phone number and verification code are required' 
      });
    }

    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // Check if OTP exists and is valid
    const storedOtp = otpStore.get(formattedPhone);
    
    if (!storedOtp) {
      return res.status(400).json({ 
        success: false, 
        error: 'No verification code found. Please request a new code.' 
      });
    }

    if (Date.now() > storedOtp.expires) {
      otpStore.delete(formattedPhone);
      return res.status(400).json({ 
        success: false, 
        error: 'Verification code has expired. Please request a new code.' 
      });
    }

    if (storedOtp.code !== code) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid verification code.' 
      });
    }

    // Code is valid - remove from store
    otpStore.delete(formattedPhone);

    // Generate a proper UUID for the user
    const userId = uuidv7();
    
    // Generate a simple session token (in production, use JWT)
    const sessionToken = Buffer.from(`${formattedPhone}:${Date.now()}:${userId}`).toString('base64');

    console.log(`✅ Phone verified successfully: ${formattedPhone} - User ID: ${userId}`);
    
    res.json({ 
      success: true, 
      message: 'Phone verified successfully!',
      sessionToken,
      user: {
        id: userId,
        phone_number: formattedPhone,
        authenticated: true
      }
    });

  } catch (error) {
    console.error('Error verifying code:', error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
});

// Photo upload endpoint for custom auth users
app.post('/api/upload/photo', upload.single('photo'), async (req, res) => {
  try {
    const { userId } = req.body;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No photo file provided'
      });
    }

    if (!userId) {
      return res.status(400).json({
        success: false,
        error: 'User ID is required'
      });
    }

    // Generate filename
    const fileExt = file.originalname.split('.').pop();
    const fileName = `${userId}/profile.${fileExt}`;

    // Upload to Supabase storage using service key (bypasses RLS)
    const { error: uploadError } = await supabase.storage
      .from('profile-photos')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: true
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);
      return res.status(500).json({
        success: false,
        error: `Upload failed: ${uploadError.message}`
      });
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('profile-photos')
      .getPublicUrl(fileName);

    console.log(`✅ Photo uploaded successfully for user ${userId} - URL: ${publicUrl}`);

    res.json({
      success: true,
      photoUrl: publicUrl,
      message: 'Photo uploaded successfully!'
    });

  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create profile endpoint for custom auth users
app.post('/api/profile/create', async (req, res) => {
  try {
    console.log('🔍 Profile creation endpoint called with:', { userId: req.body.userId, hasPhotoUrl: !!req.body.photoUrl, hasQuestionnaireData: !!req.body.questionnaireData });
    
    const { userId, photoUrl, questionnaireData, phoneNumber } = req.body;

    if (!userId || !questionnaireData) {
      console.error('❌ Missing required data:', { userId: !!userId, questionnaireData: !!questionnaireData });
      return res.status(400).json({
        success: false,
        error: 'User ID and questionnaire data are required'
      });
    }

    // Check if user already exists by ID or phone number
    console.log(`🔍 Checking if user exists: ${userId} or phone: ${phoneNumber}`);
    
    // First check by user ID
    const { data: existingUserById } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('id', userId)
      .single();
    
    // Then check by phone number
    const { data: existingUserByPhone } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('phone_number', phoneNumber || '')
      .single();
    
    let actualUserId = userId;
    
    if (existingUserByPhone && !existingUserById) {
      // User exists with this phone number but different ID
      // Use the existing user's ID instead
      actualUserId = existingUserByPhone.id;
      console.log(`📱 Found existing user by phone, using ID: ${actualUserId}`);
    }
    
    // FIRST: Create or update user record (must exist before profile due to foreign key)
    if (!existingUserById && !existingUserByPhone) {
      console.log(`➕ Creating new user with phone: ${phoneNumber}`);
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone_number: phoneNumber || '',
          profile_completed: true
        });

      if (userError) {
        console.error('User creation error:', userError);
        return res.status(500).json({
          success: false,
          error: `User creation failed: ${userError.message}`
        });
      }
      console.log(`✅ New user created successfully`);
    } else {
      console.log(`🔄 Updating existing user to mark profile completed`);
      // Update existing user to mark profile as completed
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', actualUserId);

      if (updateError) {
        console.error('User update error:', updateError);
        return res.status(500).json({
          success: false,
          error: `User update failed: ${updateError.message}`
        });
      }
      console.log(`✅ Existing user updated successfully`);
    }

    // SECOND: Create or update profile record (now user exists)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: actualUserId,
        photo_url: photoUrl,
        questionnaire_data: questionnaireData,
        ai_analysis: null // Will be populated later by AI service
      });

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(500).json({
        success: false,
        error: `Profile creation failed: ${profileError.message}`
      });
    }

    console.log(`✅ User and Profile created successfully for user ${actualUserId}`);

    res.json({
      success: true,
      message: 'Profile created successfully!',
      userId: actualUserId
    });

  } catch (error) {
    console.error('Profile creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
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