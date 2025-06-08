import { serve } from "https://deno.land/std@0.177.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { v4 as uuidv4 } from 'https://esm.sh/uuid@9.0.0'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumber, code } = await req.json()

    if (!phoneNumber || !code) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Phone number and verification code are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Clean and format phone number
    const cleanPhone = phoneNumber.replace(/\D/g, '');
    const formattedPhone = cleanPhone.startsWith('1') ? `+${cleanPhone}` : `+1${cleanPhone}`;

    // Connect to Supabase
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Check if OTP exists and is valid
    const { data: storedOtp, error: fetchError } = await supabase
      .from('verification_codes')
      .select('*')
      .eq('phone_number', formattedPhone)
      .eq('code', code)
      .single()

    if (fetchError || !storedOtp) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Invalid verification code or code not found.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Check if code has expired
    const expiresAt = new Date(storedOtp.expires_at);
    if (Date.now() > expiresAt.getTime()) {
      // Delete expired code
      await supabase
        .from('verification_codes')
        .delete()
        .eq('phone_number', formattedPhone)

      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'Verification code has expired. Please request a new code.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Code is valid - delete it
    await supabase
      .from('verification_codes')
      .delete()
      .eq('phone_number', formattedPhone)

    // Generate user ID and session token
    const userId = uuidv4();
    const sessionToken = btoa(`${formattedPhone}:${Date.now()}:${userId}`);

    console.log(`✅ Phone verified successfully: ${formattedPhone} - User ID: ${userId}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Phone verified successfully!',
        sessionToken,
        user: {
          id: userId,
          phone_number: formattedPhone,
          authenticated: true,
          profile_completed: false
        }
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error verifying code:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 