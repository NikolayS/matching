import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface TwilioConfig {
  accountSid: string;
  authToken: string;
  phoneNumber: string;
}

const sendSMS = async (config: TwilioConfig, to: string, body: string) => {
  const auth = btoa(`${config.accountSid}:${config.authToken}`);
  
  const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${config.accountSid}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      From: config.phoneNumber,
      To: to,
      Body: body,
    }),
  });

  return response.json();
};

const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber } = await req.json()

    if (!phoneNumber) {
      return new Response(
        JSON.stringify({ success: false, error: 'Phone number is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // Generate OTP
    const code = generateOTP();
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    // Store OTP in Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Delete any existing OTP for this phone
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', formattedPhone)

    // Insert new OTP
    const { error: insertError } = await supabase
      .from('verification_codes')
      .insert({
        phone_number: formattedPhone,
        code: code,
        expires_at: expires.toISOString()
      })

    if (insertError) {
      console.error('Error storing OTP:', insertError)
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to store verification code' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Send SMS via Twilio
    const twilioConfig: TwilioConfig = {
      accountSid: Deno.env.get('TWILIO_ACCOUNT_SID') ?? '',
      authToken: Deno.env.get('TWILIO_AUTH_TOKEN') ?? '',
      phoneNumber: Deno.env.get('TWILIO_PHONE_NUMBER') ?? '',
    };

    const message = `Your Matching verification code is: ${code}. Valid for 5 minutes. ☕`;
    
    const twilioResponse = await sendSMS(twilioConfig, formattedPhone, message);

    if (twilioResponse.error_code) {
      console.error('Twilio error:', twilioResponse);
      return new Response(
        JSON.stringify({ success: false, error: 'Failed to send SMS' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ Verification code sent to ${formattedPhone} - Code: ${code} - SID: ${twilioResponse.sid}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Verification code sent successfully!',
        phone: formattedPhone
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error sending verification code:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 