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
    const { userId, photoUrl, questionnaireData, phoneNumber } = await req.json()

    if (!userId || !questionnaireData) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'User ID and questionnaire data are required' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // Initialize Supabase with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log(`🔍 Profile creation endpoint called with: userId=${userId}, hasPhotoUrl=${!!photoUrl}, hasQuestionnaireData=${!!questionnaireData}`)

    // Check if user already exists by ID or phone number
    console.log(`🔍 Checking if user exists: ${userId} or phone: ${phoneNumber}`)
    
    // First check by user ID
    const { data: existingUserById } = await supabase
      .from('users')
      .select('id, phone_number')
      .eq('id', userId)
      .single()
    
    // Then check by phone number if provided
    let existingUserByPhone = null
    if (phoneNumber) {
      const { data } = await supabase
        .from('users')
        .select('id, phone_number')
        .eq('phone_number', phoneNumber)
        .single()
      existingUserByPhone = data
    }
    
    let actualUserId = userId
    
    if (existingUserByPhone && !existingUserById) {
      // User exists with this phone number but different ID
      // Use the existing user's ID instead
      actualUserId = existingUserByPhone.id
      console.log(`📱 Found existing user by phone, using ID: ${actualUserId}`)
    }
    
    // FIRST: Create or update user record (must exist before profile due to foreign key)
    if (!existingUserById && !existingUserByPhone) {
      console.log(`➕ Creating new user with phone: ${phoneNumber}`)
      const { error: userError } = await supabase
        .from('users')
        .insert({
          id: userId,
          phone_number: phoneNumber || '',
          profile_completed: true
        })

      if (userError) {
        console.error('User creation error:', userError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `User creation failed: ${userError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      console.log(`✅ New user created successfully`)
    } else {
      console.log(`🔄 Updating existing user to mark profile completed`)
      // Update existing user to mark profile as completed
      const { error: updateError } = await supabase
        .from('users')
        .update({ profile_completed: true })
        .eq('id', actualUserId)

      if (updateError) {
        console.error('User update error:', updateError)
        return new Response(
          JSON.stringify({ 
            success: false, 
            error: `User update failed: ${updateError.message}` 
          }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        )
      }
      console.log(`✅ Existing user updated successfully`)
    }

    // SECOND: Create or update profile record (now user exists)
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: actualUserId,
        photo_url: photoUrl,
        questionnaire_data: questionnaireData,
        ai_analysis: null // Will be populated later by AI service
      })

    if (profileError) {
      console.error('Profile creation error:', profileError)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `Profile creation failed: ${profileError.message}` 
        }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`✅ User and Profile created successfully for user ${actualUserId}`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Profile created successfully!',
        userId: actualUserId
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Profile creation error:', error)
    return new Response(
      JSON.stringify({ success: false, error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
}) 